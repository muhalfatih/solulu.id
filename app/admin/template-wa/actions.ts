"use server"

import { revalidatePath } from "next/cache"
import { saveTemplateDbDeps } from "@/lib/whatsapp/db-deps"
import { saveWhatsAppTemplate } from "@/lib/whatsapp/service"

export async function saveWhatsAppTemplateAction(input: { key: string; body: string }) {
  try {
    const result = await saveWhatsAppTemplate(input, saveTemplateDbDeps)
    if (result.success) revalidatePath("/admin/template-wa")
    return result
  } catch (err) {
    console.error("[template-wa] gagal menyimpan template", err)
    return { success: false as const, error: "Gagal menyimpan template. Coba lagi." }
  }
}
