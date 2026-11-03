import { getAppBaseUrl } from "@/lib/url"
import { resolveResend, type EmailSenderOptions, type EmailSendResult } from "./emails"

export interface PoolPendingEmailPayload {
  patientEmail: string
  patientName: string
  date: string
  timeRange: string
  accessToken: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/**
 * Sent to the Klien when a "Konselor Bebas" booking is paid but no counselor has
 * claimed it yet (ADR-0011). The confirmation naming the counselor follows via
 * sendPatientConfirmationEmail once the booking is claimed or assigned
 * (claim/assign re-run fulfillSession, which now has a counselor).
 */
export async function sendPoolPendingEmail(
  payload: PoolPendingEmailPayload,
  options: EmailSenderOptions = {}
): Promise<EmailSendResult> {
  const fetchFn = options.fetchFn ?? fetch
  const resend = resolveResend(options)
  if (resend.failure) return resend.failure
  const { apiKey, fromEmail } = resend.config
  const sessionUrl = `${getAppBaseUrl()}/session/${payload.accessToken}`

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.patientEmail],
      subject: "Pembayaran Diterima, Konselor Anda Sedang Ditentukan - Solulu",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
          <h2 style="color: #059669; margin-bottom: 8px;">Pembayaran Anda Sudah Kami Terima</h2>
          <p>Halo, <strong>${escapeHtml(payload.patientName)}</strong>. Anda memilih Konselor Bebas, jadi nama konselor akan kami kirim lewat email setelah ada konselor yang mengambil sesi Anda.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Jadwal:</strong> ${escapeHtml(payload.date)}, ${escapeHtml(payload.timeRange)} (90 Menit)</p>
          </div>
          <p>Jadwal Anda aman. Pantau status sesi di halaman berikut:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${sessionUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Buka Halaman Sesi Saya
            </a>
          </div>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Resend API error (pool pending):", errorText)
    return { success: false, error: `Resend menolak permintaan: ${errorText}` }
  }

  const data = await response.json()
  return { success: true, id: data.id }
}
