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
  console.log("🚀 Menjalankan migrasi Counselor Recurring Schedules ke PostgreSQL...");

  // 1. Enum schedule_mode_enum
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE "schedule_mode_enum" AS ENUM('manual', 'automatic');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log("✓ Type schedule_mode_enum checked/created.");

  // 2. Add schedule_mode to counselors
  await sql.unsafe(`
    ALTER TABLE "counselors"
    ADD COLUMN IF NOT EXISTS "schedule_mode" "schedule_mode_enum" DEFAULT 'manual' NOT NULL;
  `);
  console.log("✓ Column schedule_mode added to counselors.");

  // 3. Create counselor_weekly_templates table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "counselor_weekly_templates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "counselor_id" uuid NOT NULL REFERENCES "counselors"("id") ON DELETE CASCADE,
      "day_of_week" integer NOT NULL,
      "slot_index" integer NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("✓ Table counselor_weekly_templates checked/created.");

  // 4. Create Indexes
  await sql.unsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_counselor_weekly_template_unique" 
    ON "counselor_weekly_templates" ("counselor_id", "day_of_week", "slot_index");

    CREATE INDEX IF NOT EXISTS "idx_counselor_weekly_template_counselor" 
    ON "counselor_weekly_templates" ("counselor_id");
  `);
  console.log("✓ Indexes created on counselor_weekly_templates.");

  console.log("🎉 Migrasi Counselor Recurring Schedules berhasil!");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Error migrasi:", err);
  process.exit(1);
});
