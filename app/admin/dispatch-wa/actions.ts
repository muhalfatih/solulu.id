"use server"

import { revalidatePath } from "next/cache"
import { dispatchDbDeps } from "@/lib/whatsapp/db-deps"
import { prepareWhatsAppDispatch } from "@/lib/whatsapp/service"

/** Klik kirim: render di server, catat Sudah Dikirim, kembalikan URL wa.me untuk dibuka klien. */
export async function sendWhatsAppDispatchAction(bookingId: string) {
  try {
    const result = await prepareWhatsAppDispatch({ bookingId }, dispatchDbDeps)
    if (result.success) {
      revalidatePath("/admin/dispatch-wa")
      revalidatePath("/operator/dispatch-wa")
    }
    return result
  } catch (err) {
    console.error("[dispatch-wa] gagal menyiapkan dispatch", err)
    return { success: false as const, error: "Gagal menyiapkan pesan WhatsApp. Coba lagi." }
  }
}
