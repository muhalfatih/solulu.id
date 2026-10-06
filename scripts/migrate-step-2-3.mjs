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
  console.log("🚀 Menjalankan migrasi database...");

  // 1. Add education & str_number to counselors
  console.log("1. Menambahkan kolom education & str_number ke tabel counselors...");
  await sql`
    ALTER TABLE counselors 
    ADD COLUMN IF NOT EXISTS education TEXT,
    ADD COLUMN IF NOT EXISTS str_number TEXT;
  `;
  console.log("✓ Kolom counselors diperbarui.");

  // 2. Create specializations table
  console.log("2. Membuat tabel specializations...");
  await sql`
    CREATE TABLE IF NOT EXISTS specializations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  `;
  console.log("✓ Tabel specializations siap.");

  // 3. Seed initial specializations from presets if table is empty
  console.log("3. Memeriksa dan mengisi data awal specializations...");
  const initialPresets = [
    { name: "Kecemasan & Stres", description: "Gangguan panik, generalized anxiety, stres berlebih", sortOrder: 1 },
    { name: "Depresi & Mood", description: "Perubahan suasana hati mendalam, depresi ringan-sedang", sortOrder: 2 },
    { name: "Hubungan & Asmara", description: "Komunikasi pasangan, konflik asmara, komitmen", sortOrder: 3 },
    { name: "Keluarga & Relasi", description: "Dinamika keluarga, relasi orang tua-anak, batasan diri", sortOrder: 4 },
    { name: "Pengembangan Diri", description: "Mengenal potensi, self-esteem, regulasi emosi positif", sortOrder: 5 },
    { name: "Karir & Akademik", description: "Kecemasan ujian, arah karir, tantangan profesional", sortOrder: 6 },
    { name: "Burnout & Kelelahan", description: "Kelelahan emosional kerja, work-life balance", sortOrder: 7 },
    { name: "Trauma & Emosi", description: "Pemulihan luka batin masa lalu, PTSD ringan", sortOrder: 8 },
    { name: "Duka & Kehilangan", description: "Proses berduka (grief), kehilangan orang terdekat", sortOrder: 9 },
    { name: "Quarter-life Crisis", description: "Kebingungan arah hidup di usia 20-an, tujuan hidup", sortOrder: 10 },
  ];

  for (const preset of initialPresets) {
    await sql`
      INSERT INTO specializations (name, description, is_active, sort_order)
      VALUES (${preset.name}, ${preset.description}, true, ${preset.sortOrder})
      ON CONFLICT (name) DO NOTHING;
    `;
  }
  console.log("✓ Data awal specializations berhasil di-seed.");

  // 4. Update any existing R2 domain URLs in counselors & public_documentations
  console.log("4. Migrasi URL gambar ke domain cdn.solulu.id...");
  const updatedCounselors = await sql`
    UPDATE counselors
    SET avatar_r2_url = REPLACE(avatar_r2_url, 'https://pub-70d190fb365d4bd2b318b627e5b5854d.r2.dev', 'https://cdn.solulu.id')
    WHERE avatar_r2_url LIKE '%pub-70d190fb365d4bd2b318b627e5b5854d.r2.dev%'
    RETURNING id;
  `;
  console.log(`✓ ${updatedCounselors.length} avatar konselor diperbarui ke cdn.solulu.id.`);

  await sql.end();
  console.log("🎉 Migrasi selesai!");
}

runMigration().catch((err) => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});
