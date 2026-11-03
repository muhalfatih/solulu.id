/**
 * Logika simpan template dan siapkan dispatch WhatsApp (#31), dengan seam DI
 * untuk akses DB agar bisa diuji tanpa database. Server action di
 * app/admin/template-wa dan app/admin/dispatch-wa hanya membungkus modul ini.
 */
import { recordAudit, type AuditExecutor } from "@/lib/audit/record"
import { requireStaffUser } from "@/lib/auth/staff"
import { OPERATOR_PORTAL_ROLES, SUPERADMIN_ONLY, type RoleCarrier } from "@/lib/auth/staff-role"
import { formatDateId } from "@/lib/format/datetime"
import { getTodayWibDateString } from "@/lib/operator/dispatcher"
import { getAppBaseUrl } from "@/lib/url"
import { resolveDispatchKind } from "./dispatch-kind"
import {
  buildWaUrl,
  isWaTemplateKey,
  renderTemplate,
  validateTemplateBody,
  WA_TEMPLATE_META,
  type WaTemplateKey,
} from "./templates"
import type { DispatchBookingData } from "./queue"

export type ServiceResult<T = Record<never, never>> =
  | ({ success: true } & T)
  | { success: false; error: string }

export interface SaveTemplateDeps {
  upsertTemplate: (input: {
    key: WaTemplateKey
    name: string
    body: string
    updatedBy: string
  },
  /** Dipanggil di dalam transaksi yang sama dengan penulisan template (Jejak Audit #24). */
  audit: (tx: AuditExecutor, before: { body: string } | null) => Promise<void>
  ) => Promise<void>
}

/** Hanya Superadmin; placeholder tak dikenal ditolak sebelum menyentuh DB. */
export async function saveWhatsAppTemplate(
  input: { key: string; body: string },
  deps: SaveTemplateDeps,
  currentUser?: RoleCarrier | null
): Promise<ServiceResult> {
  const user = await requireStaffUser(currentUser, SUPERADMIN_ONLY)
  if (!user) return { success: false, error: "Akses ditolak: hanya Superadmin yang dapat mengubah template." }

  if (!isWaTemplateKey(input.key)) return { success: false, error: "Template tidak dikenal." }
  const check = validateTemplateBody(input.body)
  if (!check.ok) return { success: false, error: check.error }

  const key = input.key
  await deps.upsertTemplate(
    { key, name: WA_TEMPLATE_META[key].name, body: input.body, updatedBy: user.id },
    (tx, before) =>
      recordAudit(tx, {
        actor: user,
        action: "whatsapp_template.update",
        entityType: "whatsapp_template",
        entityId: key,
        before: before ? { body: before.body } : null,
        after: { body: input.body },
      })
  )
  return { success: true }
}

export interface PrepareDispatchDeps {
  loadBooking: (bookingId: string) => Promise<DispatchBookingData | null>
  loadTemplate: (key: WaTemplateKey) => Promise<{ id: string; body: string } | null>
  recordSent: (input: {
    bookingId: string
    templateId: string
    templateKey: WaTemplateKey
    sentBy: string
  }) => Promise<void>
  today?: () => string
  baseUrl?: () => string
}

/**
 * Merender template di server dan mencatat "Sudah Dikirim" lalu mengembalikan URL wa.me.
 * Kind template ditentukan server dari status Booking, bukan dari klien.
 */
export async function prepareWhatsAppDispatch(
  input: { bookingId: string },
  deps: PrepareDispatchDeps,
  currentUser?: RoleCarrier | null
): Promise<ServiceResult<{ url: string; templateKey: WaTemplateKey }>> {
  const user = await requireStaffUser(currentUser, OPERATOR_PORTAL_ROLES)
  if (!user) return { success: false, error: "Akses ditolak: diperlukan role Operator atau Admin." }

  const booking = await deps.loadBooking(input.bookingId)
  if (!booking) return { success: false, error: "Booking tidak ditemukan." }

  const kind = resolveDispatchKind(
    { status: booking.status, scheduleDate: booking.scheduleDate, hasReport: booking.hasReport },
    (deps.today ?? getTodayWibDateString)()
  )
  if (!kind) return { success: false, error: "Booking ini tidak ada dalam antrean dispatch." }

  const template = await deps.loadTemplate(kind)
  if (!template) {
    return {
      success: false,
      error: `Template "${WA_TEMPLATE_META[kind].name}" belum diatur. Minta Superadmin menyimpannya di Template WA.`,
    }
  }

  const text = renderTemplate(template.body, {
    nama_klien: booking.patientName,
    tanggal: formatDateId(booking.scheduleDate),
    slot: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)} WIB`,
    link_sesi: `${(deps.baseUrl ?? getAppBaseUrl)()}/session/${booking.accessToken}`,
    nama_konselor: booking.counselorName,
  })
  const url = buildWaUrl(booking.patientPhone, text)
  if (!url) return { success: false, error: "Nomor WhatsApp klien tidak valid." }

  await deps.recordSent({
    bookingId: booking.bookingId,
    templateId: template.id,
    templateKey: kind,
    sentBy: user.id,
  })
  return { success: true, url, templateKey: kind }
}
