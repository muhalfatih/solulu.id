import postgres from "postgres";
import fs from "fs";

// Load .env.local
const envPath = ".env.local";
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
  console.error("❌ DATABASE_URL tidak ditemukan!");
  process.exit(1);
}

const sql = postgres(dbUrl, {
  prepare: false,
  connect_timeout: 10,
});

async function run() {
  console.log("🚀 Menjalankan migrasi Round 3 (Manual Payment, Extend Fee, Main Issue) ke PostgreSQL...");

  // 1. Platform Settings
  await sql.unsafe(`
    ALTER TABLE "platform_settings"
    ADD COLUMN IF NOT EXISTS "counselor_extend_fee_per_30_min" numeric(12, 2) DEFAULT '35000' NOT NULL,
    ADD COLUMN IF NOT EXISTS "psychologist_extend_fee_per_30_min" numeric(12, 2) DEFAULT '50000' NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_manual_payment_enabled" boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS "manual_payment_instructions" text DEFAULT 'Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.';
  `);
  console.log("✓ Table platform_settings updated.");

  // 2. Bookings
  await sql.unsafe(`
    ALTER TABLE "bookings"
    ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'xendit' NOT NULL,
    ADD COLUMN IF NOT EXISTS "manual_payment_proof_r2_key" text,
    ADD COLUMN IF NOT EXISTS "manual_payment_status" text DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS "is_extended" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "extension_minutes" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "extension_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
    ADD COLUMN IF NOT EXISTS "extension_payment_status" text DEFAULT 'NONE' NOT NULL,
    ADD COLUMN IF NOT EXISTS "extension_payment_method" text,
    ADD COLUMN IF NOT EXISTS "extension_proof_r2_key" text;
  `);
  console.log("✓ Table bookings updated.");

  // 3. Transactions
  await sql.unsafe(`
    ALTER TABLE "transactions"
    ADD COLUMN IF NOT EXISTS "manual_proof_r2_key" text,
    ADD COLUMN IF NOT EXISTS "is_manual_verification" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "manual_verified_by" uuid,
    ADD COLUMN IF NOT EXISTS "manual_verified_at" timestamp with time zone;
  `);
  console.log("✓ Table transactions updated.");

  // 4. Session Reports
  await sql.unsafe(`
    ALTER TABLE "session_reports"
    ADD COLUMN IF NOT EXISTS "main_issue" text DEFAULT 'Konsultasi Emosional & Stres' NOT NULL;
  `);
  console.log("✓ Table session_reports updated.");

  console.log("🎉 Migrasi Round 3 berhasil diselesaikan!");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Error migrasi:", err);
  process.exit(1);
});
