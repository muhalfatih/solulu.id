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
}

/**
 * Sends booking confirmation email to the guest patient.
 */
export async function sendPatientConfirmationEmail(
  payload: PatientEmailPayload,
  options: EmailSenderOptions = {}
): Promise<{ success: boolean; id?: string }> {
  const fetchFn = options.fetchFn ?? fetch
  const apiKey = process.env.RESEND_API_KEY
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"
  const sessionUrl = `${appBaseUrl}/session/${payload.accessToken}`

  if (!apiKey || apiKey === "mock" || process.env.NODE_ENV === "test") {
    // In dev / test mode, log email details
    console.log(
      `[DEV EMAIL: PATIENT] To: ${payload.patientEmail} | Session: ${sessionUrl}`
    )
    return { success: true, id: "mock_patient_email_id" }
  }

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Solulu <no-reply@solulu.id>",
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
    return { success: false }
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
): Promise<{ success: boolean; id?: string }> {
  const fetchFn = options.fetchFn ?? fetch
  const apiKey = process.env.RESEND_API_KEY
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"

  if (!apiKey || apiKey === "mock" || process.env.NODE_ENV === "test") {
    console.log(
      `[DEV EMAIL: COUNSELOR] To: ${payload.counselorEmail} | Patient: ${payload.patientName}`
    )
    return { success: true, id: "mock_counselor_email_id" }
  }

  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Solulu <no-reply@solulu.id>",
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
    return { success: false }
  }

  const data = await response.json()
  return { success: true, id: data.id }
}
