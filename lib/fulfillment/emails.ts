import { getAppBaseUrl } from "@/lib/url"
import { getResendConfig, type IntegrationEnv, type ResendConfig } from "@/lib/config/integrations"

export interface PatientEmailPayload {
  patientEmail: string
  patientName: string
  counselorName: string
  date: string
  timeRange: string
  accessToken: string
}

export interface CounselorEmailPayload {
  counselorEmail: string
  counselorName: string
  patientName: string
  date: string
  timeRange: string
  initialNotes?: string | null
}

export interface EmailSenderOptions {
  fetchFn?: typeof fetch
  env?: IntegrationEnv
}

export interface EmailSendResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Resolves Resend configuration. A missing or placeholder key is reported as a
 * failed send naming the variable, never as a pretend success.
 */
function resolveResend(
  options: EmailSenderOptions
): { config: ResendConfig; failure?: undefined } | { config?: undefined; failure: EmailSendResult } {
  try {
    return { config: getResendConfig(options.env) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Konfigurasi Resend tidak valid."
    console.error("[EMAIL] Pengiriman dibatalkan:", message)
    return { failure: { success: false, error: message } }
  }
}

/**
 * Sends booking confirmation email to the guest patient.
 */
export async function sendPatientConfirmationEmail(
  payload: PatientEmailPayload,
  options: EmailSenderOptions = {}
): Promise<EmailSendResult> {
  const fetchFn = options.fetchFn ?? fetch
  const resend = resolveResend(options)
  if (resend.failure) return resend.failure
  const { apiKey, fromEmail } = resend.config
  const appBaseUrl = getAppBaseUrl()
  const sessionUrl = `${appBaseUrl}/session/${payload.accessToken}`

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.patientEmail],
      subject: `Konfirmasi Sesi Konseling: ${payload.counselorName} - Solulu`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
          <h2 style="color: #059669; margin-bottom: 8px;">Pemesanan Sesi Anda Telah Terkonfirmasi!</h2>
          <p>Halo, <strong>${payload.patientName}</strong>. Pembayaran sesi telekonseling Anda telah berhasil diverifikasi.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Konselor:</strong> ${payload.counselorName}</p>
            <p style="margin: 4px 0;"><strong>Jadwal:</strong> ${payload.date}, ${payload.timeRange} (90 Menit)</p>
          </div>

          <p>Anda dapat mengakses ruang telekonseling pribadi Anda kapan saja melalui tombol di bawah ini (tanpa perlu mendaftar akun):</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${sessionUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Buka Halaman Sesi Saya
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Tautan ruang Zoom akan aktif otomatis 10 menit sebelum sesi dimulai. Simpan email ini untuk mengakses kembali ruang sesi Anda.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} Solulu. Layanan Telekonseling Privat Berbasis Web.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Resend API error (patient):", errorText)
    return { success: false, error: `Resend menolak permintaan: ${errorText}` }
  }

  const data = await response.json()
  return { success: true, id: data.id }
}

/**
 * Sends notification email to the Mitra Konselor when a booking is confirmed.
 */
export async function sendCounselorNotificationEmail(
  payload: CounselorEmailPayload,
  options: EmailSenderOptions = {}
): Promise<EmailSendResult> {
  const fetchFn = options.fetchFn ?? fetch
  const resend = resolveResend(options)
  if (resend.failure) return resend.failure
  const { apiKey, fromEmail } = resend.config
  const appBaseUrl = getAppBaseUrl()

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.counselorEmail],
      subject: `Sesi Baru Terkonfirmasi: ${payload.patientName} - Solulu`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
          <h2 style="color: #0f766e; margin-bottom: 8px;">Jadwal Konseling Baru</h2>
          <p>Halo, <strong>${payload.counselorName}</strong>. Seorang pasien baru telah mengonfirmasi pemesanan sesi konseling bersama Anda.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Nama Pasien:</strong> ${payload.patientName}</p>
            <p style="margin: 4px 0;"><strong>Jadwal:</strong> ${payload.date}, ${payload.timeRange} (90 Menit)</p>
            ${
              payload.initialNotes
                ? `<p style="margin: 4px 0;"><strong>Catatan Awal Pasien:</strong> <em>"${payload.initialNotes}"</em></p>`
                : ""
            }
          </div>

          <p>Silakan masuk ke dasbor konselor untuk meninjau persiapan dan memulai sesi Zoom saat jadwal tiba:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${appBaseUrl}/counselor/dashboard" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Buka Dasbor Konselor
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} Solulu. Layanan Telekonseling Privat Berbasis Web.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Resend API error (counselor):", errorText)
    return { success: false, error: `Resend menolak permintaan: ${errorText}` }
  }

  const data = await response.json()
  return { success: true, id: data.id }
}

export interface CounselorWelcomeEmailPayload {
  counselorEmail: string
  counselorName: string
  temporaryPassword: string
  counselorType: "peer" | "psychologist"
}

/**
  * Sends welcome email with initial login credentials to the newly approved counselor.
  */
export async function sendCounselorWelcomeCredentialsEmail(
  payload: CounselorWelcomeEmailPayload,
  options: EmailSenderOptions = {}
): Promise<EmailSendResult> {
  const fetchFn = options.fetchFn ?? fetch
  const resend = resolveResend(options)
  if (resend.failure) return resend.failure
  const { apiKey, fromEmail } = resend.config
  const appBaseUrl = getAppBaseUrl()
  const loginUrl = `${appBaseUrl}/login`

  const roleTitle = payload.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.counselorEmail],
      subject: `Selamat Bergabung Mitra ${roleTitle} Solulu - Kredensial Login Akun`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
          <h2 style="color: #0d9488; margin-bottom: 8px;">Selamat Bergabung di Solulu!</h2>
          <p>Halo, <strong>${payload.counselorName}</strong>.</p>
          <p>Aplikasi kemitraan Anda sebagai <strong>${roleTitle}</strong> telah disetujui oleh tim verifikasi Solulu. Akun portal konselor Anda kini telah aktif.</p>
          
          <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #0f766e; font-size: 15px;">Informasi Kredensial Login Anda:</p>
            <p style="margin: 6px 0;"><strong>Alamat Email:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${payload.counselorEmail}</code></p>
            <p style="margin: 6px 0;"><strong>Kata Sandi Sementara:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0f766e;">${payload.temporaryPassword}</code></p>
            <p style="margin: 6px 0;"><strong>Portal Login:</strong> <a href="${loginUrl}" style="color: #0d9488;">${loginUrl}</a></p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Masuk ke Portal Konselor
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Demi keamanan, Anda disarankan untuk segera memperbarui kata sandi ini pada menu Profil setelah berhasil masuk.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            © ${new Date().getFullYear()} Solulu. Layanan Telekonseling Privat Berbasis Web.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Resend API error (counselor welcome):", errorText)
    return { success: false, error: `Resend menolak permintaan: ${errorText}` }
  }

  const data = (await response.json()) as { id: string }
  return { success: true, id: data.id }
}
