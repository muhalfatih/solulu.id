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
  console.log("🚀 Menjalankan migrasi Master SOP ke PostgreSQL...");

  // 1. Role Enum values (execute outside transaction)
  try {
    await sql.unsafe(`ALTER TYPE "public"."role_enum" ADD VALUE IF NOT EXISTS 'superadmin';`);
    console.log("✓ Added role_enum 'superadmin'");
  } catch (err) {
    console.log("ℹ Note on role_enum superadmin:", err.message);
  }

  try {
    await sql.unsafe(`ALTER TYPE "public"."role_enum" ADD VALUE IF NOT EXISTS 'operator';`);
    console.log("✓ Added role_enum 'operator'");
  } catch (err) {
    console.log("ℹ Note on role_enum operator:", err.message);
  }

  // 2. Zoom Accounts
  await sql.unsafe(`
    ALTER TABLE "zoom_accounts" 
    ADD COLUMN IF NOT EXISTS "account_number" integer DEFAULT 1 NOT NULL,
    ADD COLUMN IF NOT EXISTS "host_key" text;
  `);
  console.log("✓ Table zoom_accounts updated.");

  // 3. Platform Settings
  await sql.unsafe(`
    ALTER TABLE "platform_settings" 
    ADD COLUMN IF NOT EXISTS "booking_cutoff_hours" integer DEFAULT 4 NOT NULL,
    ADD COLUMN IF NOT EXISTS "reschedule_cutoff_hours" integer DEFAULT 4 NOT NULL,
    ADD COLUMN IF NOT EXISTS "payment_hold_minutes" integer DEFAULT 15 NOT NULL,
    ADD COLUMN IF NOT EXISTS "max_slot_quota" integer DEFAULT 10 NOT NULL,
    ADD COLUMN IF NOT EXISTS "min_counselor_weekly_slots" integer DEFAULT 10 NOT NULL,
    ADD COLUMN IF NOT EXISTS "no_show_timeout_minutes" integer DEFAULT 30 NOT NULL,
    ADD COLUMN IF NOT EXISTS "base_price" numeric(12, 2) DEFAULT '150000' NOT NULL;
  `);
  console.log("✓ Table platform_settings updated.");

  // 4. Counselors (21 fields + legalitas + R2 keys)
  await sql.unsafe(`
    ALTER TABLE "counselors" 
    ADD COLUMN IF NOT EXISTS "email" text,
    ADD COLUMN IF NOT EXISTS "phone" text,
    ADD COLUMN IF NOT EXISTS "domicile" text,
    ADD COLUMN IF NOT EXISTS "experience_years" integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "himpsi_number" text,
    ADD COLUMN IF NOT EXISTS "custom_fee_rate" numeric(12, 2),
    ADD COLUMN IF NOT EXISTS "counselor_commission_rate" numeric(12, 2),
    ADD COLUMN IF NOT EXISTS "sipp_number" text,
    ADD COLUMN IF NOT EXISTS "sipp_expires_at" date,
    ADD COLUMN IF NOT EXISTS "str_expires_at" date,
    ADD COLUMN IF NOT EXISTS "ktp_r2_key" text,
    ADD COLUMN IF NOT EXISTS "cv_r2_key" text,
    ADD COLUMN IF NOT EXISTS "diploma_s1_r2_key" text,
    ADD COLUMN IF NOT EXISTS "diploma_profesi_r2_key" text,
    ADD COLUMN IF NOT EXISTS "str_r2_key" text,
    ADD COLUMN IF NOT EXISTS "sipp_r2_key" text,
    ADD COLUMN IF NOT EXISTS "certificate_r2_key" text,
    ADD COLUMN IF NOT EXISTS "verification_status" text DEFAULT 'verified' NOT NULL,
    ADD COLUMN IF NOT EXISTS "weekly_slot_target" integer DEFAULT 10 NOT NULL;
  `);
  console.log("✓ Table counselors updated.");

  // 5. Schedules (7 fixed slots)
  await sql.unsafe(`
    ALTER TABLE "schedules" 
    ADD COLUMN IF NOT EXISTS "slot_index" integer DEFAULT 1 NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_leave" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "leave_reason" text;
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS "idx_schedule_lookup" ON "schedules" ("date", "slot_index", "status");
  `);
  console.log("✓ Table schedules updated.");

  // 6. Bookings (8 client fields + zoom allocation)
  await sql.unsafe(`
    ALTER TABLE "bookings" 
    ADD COLUMN IF NOT EXISTS "booking_code" text DEFAULT 'SL-1001' NOT NULL,
    ADD COLUMN IF NOT EXISTS "gender" text DEFAULT 'Lainnya',
    ADD COLUMN IF NOT EXISTS "age" integer DEFAULT 25,
    ADD COLUMN IF NOT EXISTS "domicile" text,
    ADD COLUMN IF NOT EXISTS "religion" text,
    ADD COLUMN IF NOT EXISTS "informed_consent_accepted_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "zoom_account_number" integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "zoom_allocation_mode" text DEFAULT 'standalone',
    ADD COLUMN IF NOT EXISTS "zoom_host_key" text,
    ADD COLUMN IF NOT EXISTS "breakout_room_name" text,
    ADD COLUMN IF NOT EXISTS "operator_admitted_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "reschedule_count" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_followed_up" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "followed_up_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "is_no_show" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "no_show_marked_at" timestamp with time zone;
  `);
  console.log("✓ Table bookings updated.");

  // 7. Session Reports
  await sql.unsafe(`
    ALTER TABLE "session_reports" 
    ALTER COLUMN "action_plan" DROP NOT NULL;
  `);
  await sql.unsafe(`
    ALTER TABLE "session_reports" 
    ADD COLUMN IF NOT EXISTS "internal_notes" text,
    ADD COLUMN IF NOT EXISTS "actual_duration_minutes" integer DEFAULT 90,
    ADD COLUMN IF NOT EXISTS "timer_started_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "timer_stopped_at" timestamp with time zone;
  `);
  console.log("✓ Table session_reports updated.");

  console.log("🎉 Migrasi Master SOP berhasil diterapkan ke database!");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
