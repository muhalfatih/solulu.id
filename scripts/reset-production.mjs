// Reset data transaksional (booking, transaksi, laporan, honor, dispatch WA) tanpa
// menyentuh data master (konselor, jadwal, Layanan, template WA, voucher, pengaturan, Zoom).
// Tidak membuat akun demo dan tidak mengisi data karangan (AGENTS.md Zero-Mock).
//
// Pemakaian:
//   node scripts/reset-production.mjs                      -> simulasi (transaksi di-rollback)
//   node scripts/reset-production.mjs --execute --confirm=<host-database>
//
// Cadangan JSON seluruh tabel publik selalu dibuat sebelum mode --execute.
import postgres from "postgres";
import fs from "fs";
import os from "os";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
    process.env[t.slice(0, i).trim()] = v;
  }
}

const dbUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("FATAL: DATABASE_URL_DIRECT / DATABASE_URL tidak ditemukan.");
  process.exit(1);
}
const host = new URL(dbUrl).host;
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const confirm = (args.find((a) => a.startsWith("--confirm=")) ?? "").slice("--confirm=".length);

if (execute && confirm !== host) {
  console.error(`Konfirmasi salah. Jalankan dengan --confirm=${host}`);
  process.exit(1);
}

// Dihapus (anak lebih dulu tidak penting: TRUNCATE ... CASCADE dalam satu pernyataan).
const WIPE = [
  "whatsapp_dispatches",
  "booking_reschedules",
  "counselor_honors",
  "payroll_periods",
  "session_reports",
  "transactions",
  "bookings",
  "screenings",
];

const sql = postgres(dbUrl, { prepare: false, connect_timeout: 60, max: 1, onnotice: () => {} });

async function count(tx, table) {
  const [{ n }] = await tx.unsafe(`select count(*)::int n from public."${table}"`);
  return n;
}

async function report(tx, label) {
  const out = {};
  for (const t of [...WIPE, "counselors", "schedules", "services", "whatsapp_templates", "vouchers"]) {
    out[t] = await count(tx, t);
  }
  const [{ n: busy }] = await tx.unsafe(
    `select count(*)::int n from public.schedules where status in ('booked','reserved')`,
  );
  out.schedules_booked_or_reserved = busy;
  console.log(label, JSON.stringify(out));
}

async function backup() {
  const dir = path.join(os.homedir(), "solulu-backups", `pre-reset-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tables = await sql.unsafe(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'",
  );
  for (const { table_name } of tables) {
    const rows = await sql.unsafe(`select * from public."${table_name}"`);
    fs.writeFileSync(path.join(dir, `${table_name}.json`), JSON.stringify(rows), { mode: 0o600 });
  }
  console.log(`Cadangan: ${dir} (${tables.length} tabel)`);
}

class Rehearsal extends Error {}

async function main() {
  console.log(`Target: ${host} | mode: ${execute ? "EKSEKUSI" : "SIMULASI (rollback)"}`);
  if (execute) await backup();
  try {
    await sql.begin(async (tx) => {
      await report(tx, "sebelum:");
      await tx.unsafe(`TRUNCATE TABLE ${WIPE.map((t) => `public."${t}"`).join(", ")} CASCADE`);
      await tx.unsafe(
        `UPDATE public.schedules SET status='available', reserved_until=NULL WHERE status IN ('booked','reserved')`,
      );
      await tx.unsafe(`UPDATE public.vouchers SET used_count = 0`);
      await report(tx, "sesudah:");
      if (!execute) throw new Rehearsal();
    });
  } catch (e) {
    if (!(e instanceof Rehearsal)) throw e;
    console.log("Simulasi selesai, semua perubahan di-rollback.");
  }
  await sql.end();
}

main().catch(async (e) => {
  console.error("GAGAL:", e.message);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
