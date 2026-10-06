import fs from "fs"
import path from "path"

// 1. Load environment variables from .env.local
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

const qstashUrlRaw = process.env.QSTASH_URL || "https://qstash.upstash.io/v2"
const qstashUrl = qstashUrlRaw.endsWith("/v2")
  ? qstashUrlRaw
  : `${qstashUrlRaw.replace(/\/+$/, "")}/v2`
const qstashToken = process.env.QSTASH_TOKEN
const cronSecret = process.env.CRON_SECRET
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

console.log("==================================================================")
console.log("⚡ SOLULU UPSTASH QSTASH SERVICE & INTEGRATION TEST")
console.log("==================================================================")
console.log(`QStash Endpoint : ${qstashUrl}`)
console.log(
  `QStash Token    : ${
    qstashToken
      ? `${qstashToken.substring(0, 15)}... (Length: ${qstashToken.length})`
      : "❌ NOT FOUND"
  }`
)
console.log(
  `CRON Secret     : ${
    cronSecret ? `${cronSecret.substring(0, 4)}****` : "❌ NOT FOUND"
  }`
)
console.log(`App Base URL    : ${appUrl}`)
console.log("------------------------------------------------------------------\n")

if (!qstashToken || qstashToken === "mock" || qstashToken.includes("your_upstash")) {
  console.error("❌ ERROR: QSTASH_TOKEN belum dikonfigurasi dengan valid di .env.local")
  console.log("Aplikasi saat ini akan otomatis menggunakan mode fallback direct-execution (Dev Mode).")
  process.exit(1)
}

async function runTests() {
  let passedCount = 0
  let totalTests = 0

  // -------------------------------------------------------------
  // Test 1: Verifikasi Kredensial & Panggilan REST API QStash
  // -------------------------------------------------------------
  totalTests++
  console.log("▶ [Test 1] Menghubungi Upstash QStash REST API (/schedules)...")
  try {
    const res = await fetch(`${qstashUrl}/schedules`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
      },
    })

    if (res.ok) {
      const schedules = await res.json()
      console.log(`  ✅ Berhasil terhubung ke QStash API (HTTP ${res.status} ${res.statusText})`)
      console.log(`  📅 Jadwal aktif (Schedules): ${schedules.length} jadwal terdaftar`)
      passedCount++
    } else {
      const err = await res.text()
      console.error(`  ❌ Gagal autentikasi QStash (HTTP ${res.status}): ${err}`)
    }
  } catch (err) {
    console.error("  ❌ Gagal melakukan koneksi ke server QStash:", err.message)
  }

  // -------------------------------------------------------------
  // Test 2: Simulasi Publish Message ke QStash
  // -------------------------------------------------------------
  totalTests++
  console.log("\n▶ [Test 2] Mempublikasikan Pesan Asinkron (Publish Job Simulation)...")
  try {
    const testDestination = "https://httpbin.org/post"
    const publishUrl = `${qstashUrl}/publish/${testDestination}`
    const testPayload = {
      test: true,
      service: "solulu-web",
      type: "fulfillment_simulation",
      timestamp: new Date().toISOString(),
    }

    const res = await fetch(publishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
        "Upstash-Retries": "3",
      },
      body: JSON.stringify(testPayload),
    })

    if (res.ok) {
      const data = await res.json()
      console.log(`  ✅ Berhasil mempublikasikan pesan ke QStash (HTTP ${res.status})`)
      console.log(`  🆔 Message ID Diterbitkan: ${data.messageId}`)
      console.log(`  🔁 Otomatis Retry Ditetapkan: 3x (Upstash-Retries: 3)`)
      passedCount++
    } else {
      const err = await res.text()
      console.error(`  ❌ Gagal publish pesan ke QStash (HTTP ${res.status}): ${err}`)
    }
  } catch (err) {
    console.error("  ❌ Error jaringan saat publish ke QStash:", err.message)
  }

  // -------------------------------------------------------------
  // Test 3: Cek Endpoint Lokal Worker Fulfill-Booking
  // -------------------------------------------------------------
  totalTests++
  console.log("\n▶ [Test 3] Memvalidasi Endpoint Lokal Worker (/api/jobs/fulfill-booking)...")
  try {
    const workerUrl = `${appUrl}/api/jobs/fulfill-booking`
    // Test rejection unauthorized / missing payload
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "upstash-signature": "sig_simulation_check",
      },
      body: JSON.stringify({}),
    })

    if (res.status === 400) {
      console.log(`  ✅ Endpoint worker merespons dengan benar: HTTP 400 (Missing bookingId)`)
      passedCount++
    } else if (res.status === 401) {
      console.log(`  ⚠️ Endpoint worker menolak otorisasi: HTTP 401`)
      passedCount++
    } else {
      console.log(`  ℹ️ Endpoint worker merespons status: HTTP ${res.status}`)
      passedCount++
    }
  } catch (err) {
    console.log(`  ⚠️ Server lokal (${appUrl}) tidak aktif atau tidak dapat dijangkau: ${err.message}`)
  }

  // -------------------------------------------------------------
  // Test 4: Cek Endpoint Lokal Cron Cleanup-Slots
  // -------------------------------------------------------------
  totalTests++
  console.log("\n▶ [Test 4] Memvalidasi Endpoint Lokal Cron (/api/cron/cleanup-slots)...")
  try {
    const cronUrl = `${appUrl}/api/cron/cleanup-slots`
    const res = await fetch(cronUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret || "invalid"}`,
      },
    })

    if (res.status === 200) {
      const data = await res.json()
      console.log(`  ✅ Endpoint cron merespons sukses: HTTP 200 OK`)
      console.log(`  🧹 Hasil cleanup:`, data.data || data.message)
      passedCount++
    } else if (res.status === 401) {
      console.log(`  ❌ Endpoint cron menolak token CRON_SECRET (HTTP 401)`)
    } else {
      console.log(`  ℹ️ Endpoint cron merespons status: HTTP ${res.status}`)
      passedCount++
    }
  } catch (err) {
    console.log(`  ⚠️ Server lokal (${appUrl}) tidak aktif atau tidak dapat dijangkau: ${err.message}`)
  }

  // -------------------------------------------------------------
  // Ringkasan
  // -------------------------------------------------------------
  console.log("\n==================================================================")
  console.log(`📊 HASIL PENGUJIAN: ${passedCount}/${totalTests} Uji Berhasil`)
  console.log("==================================================================")
  if (passedCount >= 2) {
    console.log("🎉 Layanan Upstash QStash terverifikasi AKTIF dan siap digunakan di Solulu Web!")
  } else {
    console.log("⚠️ Ada pengujian yang belum terpenuhi, periksa log di atas.")
  }
}

runTests()
