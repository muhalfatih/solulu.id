import fs from "fs"
import path from "path"

// 1. Read environment variables from .env.local if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || "Solulu Support <halo@solulu.id>"
const targetEmail = process.argv[2] || "delivered@resend.dev"

console.log("==========================================")
console.log("📨 SOLULU RESEND EMAIL INTEGRATION TEST")
console.log("==========================================")
console.log(`From        : ${fromEmail}`)
console.log(`To          : ${targetEmail}`)
console.log(`API Key     : ${apiKey ? apiKey.substring(0, 10) + "..." : "TIDAK DITEMUKAN"}`)
console.log("------------------------------------------")

if (!apiKey || apiKey === "mock") {
  console.error("❌ ERROR: RESEND_API_KEY belum dikonfigurasi atau diset 'mock' di .env.local")
  process.exit(1)
}

async function sendTestEmail(type, subject, html) {
  console.log(`\n⏳ Mengirim [${type}] ke ${targetEmail}...`)
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        subject,
        html,
      }),
    })

    const body = await res.json()

    if (res.ok) {
      console.log(`✅ BERHASIL [${type}]!`)
      console.log(`   Message ID : ${body.id}`)
      console.log(`   HTTP Status: ${res.status}`)
      return { success: true, id: body.id }
    } else {
      console.error(`❌ GAGAL [${type}]!`)
      console.error(`   HTTP Status: ${res.status}`)
      console.error(`   Pesan Resend:`, JSON.stringify(body, null, 2))
      return { success: false, error: body }
    }
  } catch (err) {
    console.error(`❌ Network error [${type}]:`, err.message)
    return { success: false, error: err.message }
  }
}

async function run() {
  // Test 1: Konfirmasi Pasien
  const patientHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
      <h2 style="color: #059669; margin-bottom: 8px;">[TEST] Pemesanan Sesi Anda Telah Terkonfirmasi!</h2>
      <p>Halo, <strong>Budi Santoso (Test)</strong>. Pembayaran sesi telekonseling Anda telah berhasil diverifikasi.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Konselor:</strong> Sarah Annisa, M.Psi., Psikolog</p>
        <p style="margin: 4px 0;"><strong>Jadwal:</strong> Senin, 15 September 2026, 19:00 - 20:30 WIB (90 Menit)</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://solulu.id/session/tok_test_sample" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
          Buka Halaman Sesi Saya
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Ini adalah email uji coba otomatis integrasi Resend dari platform Solulu.
      </p>
    </div>
  `

  const r1 = await sendTestEmail(
    "1. Konfirmasi Pasien",
    "[TEST] Konfirmasi Sesi Konseling: Sarah Annisa, M.Psi. - Solulu",
    patientHtml
  )

  // Test 2: Notifikasi Konselor
  const counselorHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b; padding: 24px;">
      <h2 style="color: #0f766e; margin-bottom: 8px;">[TEST] Jadwal Konseling Baru</h2>
      <p>Halo, <strong>Sarah Annisa (Test)</strong>. Seorang pasien baru telah mengonfirmasi pemesanan sesi konseling bersama Anda.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Nama Pasien:</strong> Budi Santoso</p>
        <p style="margin: 4px 0;"><strong>Jadwal:</strong> Senin, 15 September 2026, 19:00 - 20:30 WIB (90 Menit)</p>
        <p style="margin: 4px 0;"><strong>Catatan Pasien:</strong> <em>"Pengetesan integrasi email Resend."</em></p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://solulu.id/counselor/dashboard" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
          Buka Dasbor Konselor
        </a>
      </div>
    </div>
  `

  const r2 = await sendTestEmail(
    "2. Notifikasi Konselor",
    "[TEST] Sesi Baru Terkonfirmasi: Budi Santoso - Solulu",
    counselorHtml
  )

  console.log("\n==========================================")
  if (r1.success && r2.success) {
    console.log("🎉 SEMUA PENGUJIAN RESEND BERHASIL!")
  } else {
    console.log("⚠️ ADA EMAIL YANG GAGAL TERKIRIM. Silakan periksa log di atas.")
  }
  console.log("==========================================")
}

run()
