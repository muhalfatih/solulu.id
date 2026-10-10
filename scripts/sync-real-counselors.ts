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

  // 3. Seed upcoming fresh active slots (for tomorrow and day after)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  const dayAfterStr = dayAfter.toISOString().split("T")[0]

  const day3 = new Date()
  day3.setDate(day3.getDate() + 3)
  const day3Str = day3.toISOString().split("T")[0]

  const slotsToInsert = [
    // Sarah Annisa (e28eb17e-b7cd-43bc-8a30-d67a221342f3)
    {
      counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
      date: tomorrowStr,
      startTime: "09:00",
      endTime: "10:30",
      status: "available" as const,
    },
    {
      counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
      date: tomorrowStr,
      startTime: "13:30",
      endTime: "15:00",
      status: "available" as const,
    },
    {
      counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
      date: tomorrowStr,
      startTime: "19:00",
      endTime: "20:30",
      status: "available" as const,
    },
    {
      counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
      date: dayAfterStr,
      startTime: "10:00",
      endTime: "11:30",
      status: "available" as const,
    },
    {
      counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3",
      date: dayAfterStr,
      startTime: "15:30",
      endTime: "17:00",
      status: "available" as const,
    },

    // Rian Hidayat (46876e9e-59bb-45bb-9a8c-d86f65b4a95c)
    {
      counselorId: "46876e9e-59bb-45bb-9a8c-d86f65b4a95c",
      date: tomorrowStr,
      startTime: "11:00",
      endTime: "12:30",
      status: "available" as const,
    },
    {
      counselorId: "46876e9e-59bb-45bb-9a8c-d86f65b4a95c",
      date: tomorrowStr,
      startTime: "15:30",
      endTime: "17:00",
      status: "available" as const,
    },
    {
      counselorId: "46876e9e-59bb-45bb-9a8c-d86f65b4a95c",
      date: dayAfterStr,
      startTime: "13:30",
      endTime: "15:00",
      status: "available" as const,
    },
    {
      counselorId: "46876e9e-59bb-45bb-9a8c-d86f65b4a95c",
      date: dayAfterStr,
      startTime: "19:00",
      endTime: "20:30",
      status: "available" as const,
    },

    // Dr. Nadia Larasati (17be06cb-09dc-45af-99c3-6be723efec37)
    {
      counselorId: "17be06cb-09dc-45af-99c3-6be723efec37",
      date: dayAfterStr,
      startTime: "09:00",
      endTime: "10:30",
      status: "available" as const,
    },
    {
      counselorId: "17be06cb-09dc-45af-99c3-6be723efec37",
      date: dayAfterStr,
      startTime: "14:00",
      endTime: "15:30",
      status: "available" as const,
    },
    {
      counselorId: "17be06cb-09dc-45af-99c3-6be723efec37",
      date: day3Str,
      startTime: "10:00",
      endTime: "11:30",
      status: "available" as const,
    },
  ]

  await db.insert(schedules).values(slotsToInsert)
  console.log(`Inserted ${slotsToInsert.length} active schedule slots for upcoming dates: ${tomorrowStr}, ${dayAfterStr}, ${day3Str}.`)

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
