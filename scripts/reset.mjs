import postgres from "postgres";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const dbUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ FATAL: DATABASE_URL tidak ditemukan di .env.local");
  process.exit(1);
}

const sql = postgres(dbUrl, {
  prepare: false,
  connect_timeout: 15,
});

const ALL_TABLES = [
  "session_reports",
  "transactions",
  "bookings",
  "schedules",
  "counselor_applications",
  "counselors",
  "screenings",
  "vouchers",
  "specializations",
  "zoom_accounts",
  "platform_pricing",
  "platform_settings",
  "public_documentations",
  "testimonials",
];

async function runReset() {
  console.log("======================================================");
  console.log("⚠️  MEMULAI TOTAL RESET DATABASE SOLULU (POSTGRESQL)");
  console.log("======================================================");
  const start = Date.now();

  try {
    console.log("🧹 Mengosongkan 14 tabel aplikasi via TRUNCATE CASCADE...");

    // Jalankan truncate seluruh tabel dalam satu transaksi aman
    await sql.begin(async (tx) => {
      await tx.unsafe(`
        TRUNCATE TABLE 
          session_reports,
          transactions,
          bookings,
          schedules,
          counselor_applications,
          counselors,
          screenings,
          vouchers,
          specializations,
          zoom_accounts,
          platform_pricing,
          platform_settings,
          public_documentations,
          testimonials
        CASCADE;
      `);
    });

    console.log("✓ Seluruh tabel berhasil dikosongkan.");

    // Verifikasi row count
    console.log("\n📊 Verifikasi Kondisi Database Pasca-Reset:");
    let allZero = true;
    for (const table of ALL_TABLES) {
      const res = await sql.unsafe(`SELECT count(*) as count FROM "${table}"`);
      const count = Number(res[0].count);
      console.log(`   - ${table.padEnd(25)}: ${count} baris`);
      if (count > 0) allZero = false;
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    if (allZero) {
      console.log(`\n✅ RESET TOTAL BERHASIL DALAM ${elapsed}s! Database dalam kondisi bersih sempurna.`);
    } else {
      console.warn(`\n⚠️ Peringatan: Ada tabel yang masih memiliki baris data.`);
    }
  } catch (err) {
    console.error("❌ Gagal melakukan reset database:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

runReset();
