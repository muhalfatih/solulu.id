import { db } from "../db"
import { counselors, schedules, bookings } from "../db/schema"
import { eq, or, and, notInArray } from "drizzle-orm"
import { createAdminClient } from "../lib/supabase/admin"

async function syncRealCounselors() {
  console.log("=== Finalizing Schedules and Real Counselors ===")

  // 1. Find all schedule IDs referenced in bookings
  const existingBookings = await db.select({ scheduleId: bookings.scheduleId }).from(bookings)
  const referencedScheduleIds = existingBookings.map((b) => b.scheduleId)
  console.log(`Found ${referencedScheduleIds.length} schedules referenced by bookings. Preserving them.`)

  // 2. Delete only unreferenced available schedules
  if (referencedScheduleIds.length > 0) {
    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.status, "available"),
          notInArray(schedules.id, referencedScheduleIds)
        )
      )
  } else {
    await db.delete(schedules).where(eq(schedules.status, "available"))
  }
  console.log("Deleted old unreferenced available schedules.")

  // 3. Fetch all active counselors and seed upcoming fresh active slots (next 7 days)
  const activeCounselors = await db
    .select()
    .from(counselors)
    .where(eq(counselors.isActive, true))
  console.log(`Found ${activeCounselors.length} active counselors. Generating future slots for each...`)

  const STANDARD_SLOTS = [
    { startTime: "09:00", endTime: "10:30" },
    { startTime: "11:00", endTime: "12:30" },
    { startTime: "13:30", endTime: "15:00" },
    { startTime: "15:30", endTime: "17:00" },
    { startTime: "19:00", endTime: "20:30" },
  ]

  const slotsToInsert = []
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + dayOffset)
    const dateStr = targetDate.toISOString().split("T")[0]

    for (let cIdx = 0; cIdx < activeCounselors.length; cIdx++) {
      const c = activeCounselors[cIdx]
      // Pick 2-3 standard slots staggered by counselor index and day
      for (let sIdx = 0; sIdx < STANDARD_SLOTS.length; sIdx++) {
        if ((cIdx + dayOffset + sIdx) % 2 === 0) {
          slotsToInsert.push({
            counselorId: c.id,
            date: dateStr,
            startTime: STANDARD_SLOTS[sIdx].startTime,
            endTime: STANDARD_SLOTS[sIdx].endTime,
            status: "available" as const,
          })
        }
      }
    }
  }

  if (slotsToInsert.length > 0) {
    await db.insert(schedules).values(slotsToInsert)
    console.log(`Inserted ${slotsToInsert.length} active schedule slots across next 7 days for all ${activeCounselors.length} active counselors.`)
  }

  // 4. Verify counselors in DB
  const currentCounselors = await db.select().from(counselors)
  console.log(`Current counselors in DB: ${currentCounselors.length}`)
  for (const c of currentCounselors) {
    const counselorSlots = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.counselorId, c.id), eq(schedules.status, "available")))
    console.log(`- ${c.fullName} (${c.counselorType}): ${counselorSlots.length} active slots`)
  }

  console.log("=== Synchronization of Real Counselors Completed Successfully ===")
}

syncRealCounselors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync error:", err)
    process.exit(1)
  })
