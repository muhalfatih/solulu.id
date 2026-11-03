import { eq } from "drizzle-orm"
import { db } from "@/db"
import { whatsappDispatches, whatsappTemplates } from "@/db/schema"
import { loadDispatchBookingData } from "./queue"
import type { PrepareDispatchDeps, SaveTemplateDeps } from "./service"
import type { WaTemplateKey } from "./templates"

export const saveTemplateDbDeps: SaveTemplateDeps = {
  async upsertTemplate({ key, name, body, updatedBy }) {
    await db
      .insert(whatsappTemplates)
      .values({ key, name, body, updatedBy })
      .onConflictDoUpdate({
        target: whatsappTemplates.key,
        set: { name, body, updatedBy, updatedAt: new Date() },
      })
  },
}

export const dispatchDbDeps: PrepareDispatchDeps = {
  loadBooking: loadDispatchBookingData,
  async loadTemplate(key: WaTemplateKey) {
    const [row] = await db
      .select({ id: whatsappTemplates.id, body: whatsappTemplates.body })
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.key, key))
      .limit(1)
    return row ?? null
  },
  async recordSent({ bookingId, templateId, templateKey, sentBy }) {
    await db.insert(whatsappDispatches).values({ bookingId, templateId, templateKey, sentBy })
  },
}

export async function listWhatsAppTemplates() {
  return db.select().from(whatsappTemplates)
}
