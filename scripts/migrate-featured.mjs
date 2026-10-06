import postgres from "/home/muhalfatih/solulu-web/node_modules/postgres/src/index.js";
import fs from "fs";

// Load .env.local
const envPath = "/home/muhalfatih/solulu-web/.env.local";
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

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
});

async function runMigration() {
  console.log("🚀 Menambahkan kolom is_featured ke tabel counselors...");

  await sql`
    ALTER TABLE counselors 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
  `;
  console.log("✓ Kolom is_featured berhasil ditambahkan.");

  // Set the first 2-3 counselors as featured by default so homepage has content
  const updated = await sql`
    UPDATE counselors 
    SET is_featured = true 
    WHERE id IN (
      SELECT id FROM counselors WHERE is_active = true ORDER BY created_at ASC LIMIT 3
    )
    RETURNING id, full_name, is_featured;
  `;
  console.log(`✓ ${updated.length} konselor ditandai sebagai featured:`, updated.map(u => u.full_name));

  await sql.end();
  console.log("🎉 Migrasi is_featured selesai!");
}

runMigration().catch((err) => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});
