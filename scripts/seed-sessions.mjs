import postgres from "/home/muhalfatih/solulu-web/node_modules/postgres/src/index.js";
import fs from "fs";
import crypto from "crypto";

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
  ssl: "require",
  connect_timeout: 10,
});

function getWIBDate(offsetDays = 0) {
  // Return YYYY-MM-DD in Asia/Jakarta timezone
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function computeEndTime(startTimeStr) {
  const [h, m] = startTimeStr.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const endMinutes = startMinutes + 90;
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;
}

function generateNanoId(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let res = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    res += chars[randomBytes[i] % chars.length];
  }
  return res;
}

async function runSeed() {
  console.log("🚀 Memulai proses reset dan seeding jadwal & sesi Solulu...");

  // 1. Bersihkan session_reports, transactions, bookings, schedules
  console.log("🧹 1. Menghapus seluruh sesi dan jadwal lama...");
  await sql`DELETE FROM session_reports`;
  await sql`DELETE FROM transactions`;
  await sql`DELETE FROM bookings`;
  await sql`DELETE FROM schedules`;
  console.log("   ✓ Berhasil menghapus seluruh data session_reports, transactions, bookings, schedules.");

  // 2. Ambil referensi konselor, zoom account, voucher
  const counselors = await sql`
    SELECT id, full_name, counselor_type 
    FROM counselors 
    WHERE is_active = true 
    ORDER BY created_at ASC
  `;
  console.log(`📋 Ditemukan ${counselors.length} konselor aktif.`);

  const zoomAccounts = await sql`
    SELECT id, name, email 
    FROM zoom_accounts 
    WHERE is_active = true 
    ORDER BY created_at ASC
  `;
  const defaultZoom = zoomAccounts[0] || null;
  console.log(`🎥 Akun Zoom aktif: ${defaultZoom ? defaultZoom.name : "Tidak ada"}`);

  const vouchers = await sql`SELECT id, code FROM vouchers`;
  const defaultVoucher = vouchers[0] || null;

  // 3. Masukkan screening dummy agar sesi memiliki data klinis (SRQ-20)
  console.log("🩺 2. Menyiapkan data screening SRQ-20 klinis...");
  const [screeningNormal] = await sql`
    INSERT INTO screenings (id, answers, total_score, has_suicidal_thoughts, recommended_type, created_at)
    VALUES (
      gen_random_uuid(),
      ${JSON.stringify({ q1: true, q2: false, q3: false, q4: false, q17: false })},
      3,
      false,
      'peer',
      now() - interval '2 days'
    ) RETURNING id
  `;

  const [screeningHighRisk] = await sql`
    INSERT INTO screenings (id, answers, total_score, has_suicidal_thoughts, recommended_type, created_at)
    VALUES (
      gen_random_uuid(),
      ${JSON.stringify({ q1: true, q2: true, q3: true, q4: true, q17: true })},
      14,
      true,
      'psychologist',
      now() - interval '1 day'
    ) RETURNING id
  `;

  const [screeningModerate] = await sql`
    INSERT INTO screenings (id, answers, total_score, has_suicidal_thoughts, recommended_type, created_at)
    VALUES (
      gen_random_uuid(),
      ${JSON.stringify({ q1: true, q2: true, q3: true, q4: true, q17: false })},
      8,
      false,
      'psychologist',
      now() - interval '3 hours'
    ) RETURNING id
  `;

  // 4. Data seeding slot jadwal per konselor
  // Tanggal yang di-generate:
  // - Kemarin: (-1 hari) untuk state PAST / COMPLETED
  // - Hari Ini: (0 hari) untuk state TODAY, IN_SESSION, PENDING_PAYMENT
  // - Besok: (+1 hari) untuk state UPCOMING / CONFIRMED
  // - Lusa: (+2 hari) untuk state AVAILABLE (bisa dibooking klien)
  // - 3 hari lagi: (+3 hari) untuk state CANCELLED & RESERVED

  const yesterday = getWIBDate(-1);
  const today = getWIBDate(0);
  const tomorrow = getWIBDate(1);
  const in2Days = getWIBDate(2);
  const in3Days = getWIBDate(3);
  const in4Days = getWIBDate(4);

  console.log(`📅 Mapping Tanggal WIB:`);
  console.log(`   - Kemarin : ${yesterday}`);
  console.log(`   - Hari Ini : ${today}`);
  console.log(`   - Besok   : ${tomorrow}`);
  console.log(`   - +2 Hari : ${in2Days}`);
  console.log(`   - +3 Hari : ${in3Days}`);
  console.log(`   - +4 Hari : ${in4Days}`);

  console.log("🗓️ 3. Menghasilkan jadwal dan sesi komprehensif untuk semua state...");

  // Kita bagi skenario per konselor:
  // Konselor 0: Sarah Annisa (Psikolog) -> Memiliki Completed (kemarin + session report), In-Session (hari ini), Confirmed (besok), Available (lusa)
  // Konselor 1: Rian Hidayat (Peer) -> Memiliki Pending Payment (hari ini), Confirmed (besok), Expired (kemarin), Available (lusa)
  // Konselor 2: Dr. Nadia Larasati (Psikolog) -> Memiliki Completed (kemarin tanpa report), Cancelled (besok), Available (lusa & +3 hari)
  // Konselor 3: Dimas Pratama (Peer) -> Memiliki Confirmed dengan High Risk (besok), Pending Payment Transfer Manual (hari ini), Available (lusa)
  // Konselor 4: Sikopat / Lainnya -> Memiliki Reserved Slot (hold 17 mins), Available slots

  const sarah = counselors[0];
  const rian = counselors[1] || counselors[0];
  const nadia = counselors[2] || counselors[0];
  const dimas = counselors[3] || counselors[0];
  const konselor5 = counselors[4] || counselors[0];

  // Helper untuk insert schedule
  async function insertSchedule(counselorId, date, startTime, status, reservedUntil = null) {
    const endTime = computeEndTime(startTime);
    const [row] = await sql`
      INSERT INTO schedules (id, counselor_id, date, start_time, end_time, status, reserved_until, created_at)
      VALUES (gen_random_uuid(), ${counselorId}, ${date}, ${startTime}, ${endTime}, ${status}, ${reservedUntil}, now())
      RETURNING id, counselor_id, date, start_time, end_time, status
    `;
    return row;
  }

  // Helper untuk insert booking & transaction
  async function insertBookingWithTx({
    schedule,
    counselor,
    screeningId = null,
    patientName,
    patientEmail,
    patientPhone,
    initialNotes,
    bookingStatus,
    paymentProvider = "manual",
    paymentMethod = "Transfer Bank BCA (Manual)",
    txStatus = "PAID",
    grossAmount = 150000,
    netAmount = 150000,
    voucherId = null,
    referenceNumber = null,
    adminNotes = null,
    bypassedRecommendation = false,
    zoomMeetingId = "83299634471",
    zoomJoinUrl = "https://zoom.us/j/83299634471",
    zoomStartUrl = "https://zoom.us/s/83299634471",
    includeZoom = true,
  }) {
    const accessToken = generateNanoId(32);
    const zoomAccountId = includeZoom && defaultZoom ? defaultZoom.id : null;

    const [b] = await sql`
      INSERT INTO bookings (
        id, access_token, patient_name, patient_email, patient_phone,
        initial_notes, schedule_id, counselor_id, screening_id,
        bypassed_recommendation, waiver_accepted_at,
        zoom_account_id, zoom_meeting_id, zoom_join_url, zoom_start_url,
        status, created_at
      ) VALUES (
        gen_random_uuid(), ${accessToken}, ${patientName}, ${patientEmail}, ${patientPhone},
        ${initialNotes}, ${schedule.id}, ${counselor.id}, ${screeningId},
        ${bypassedRecommendation}, now(),
        ${zoomAccountId}, ${includeZoom ? zoomMeetingId : null}, ${includeZoom ? zoomJoinUrl : null}, ${includeZoom ? zoomStartUrl : null},
        ${bookingStatus}, now()
      ) RETURNING id
    `;

    const [t] = await sql`
      INSERT INTO transactions (
        id, booking_id, voucher_id, xendit_invoice_id, xendit_payment_url,
        payment_method, gross_amount, discount_amount, net_amount,
        status, paid_at, created_at, payment_provider, reference_number, admin_notes
      ) VALUES (
        gen_random_uuid(), ${b.id}, ${voucherId},
        ${paymentProvider === "xendit" ? `xendit_${generateNanoId(12)}` : null},
        ${paymentProvider === "xendit" ? "https://checkout.xendit.co/web/test-inv" : null},
        ${paymentMethod}, ${grossAmount}, ${grossAmount - netAmount}, ${netAmount},
        ${txStatus}, ${txStatus === "PAID" ? new Date() : null}, now(),
        ${paymentProvider}, ${referenceNumber}, ${adminNotes}
      ) RETURNING id
    `;

    return { bookingId: b.id, transactionId: t.id };
  }

  // --- SEED 1: Sesi Selesai Kemarin dengan Laporan Klinis Lengkap (State: COMPLETED / HAS_REPORT) ---
  if (sarah) {
    const s1 = await insertSchedule(sarah.id, yesterday, "13:30:00", "booked");
    const { bookingId } = await insertBookingWithTx({
      schedule: s1,
      counselor: sarah,
      screeningId: screeningModerate.id,
      patientName: "Amanda Putri",
      patientEmail: "amanda.putri@gmail.com",
      patientPhone: "081234567890",
      initialNotes: "Sering cemas saat presentasi di kantor dan kesulitan tidur di malam hari.",
      bookingStatus: "completed",
      paymentProvider: "xendit",
      paymentMethod: "QRIS Statis",
      txStatus: "PAID",
      grossAmount: 150000,
      netAmount: 129000,
      voucherId: defaultVoucher ? defaultVoucher.id : null,
    });

    await sql`
      INSERT INTO session_reports (
        id, booking_id, counselor_id, summary, action_plan,
        follow_up_recommendation, attachment_r2_keys, created_at
      ) VALUES (
        gen_random_uuid(), ${bookingId}, ${sarah.id},
        'Klien menunjukkan gejala kecemasan performa kerja moderat. Telah dilakukan psikoedukasi regulasi napas 4-7-8 dan cognitive reframing.',
        'Latihan teknik pernapasan diafragma 2x sehari dan menuliskan automatic negative thoughts sebelum rapat mingguan.',
        'Sesi follow-up disarankan 2 minggu lagi jika keluhan insomnia berlanjut.',
        ARRAY['session-reports/worksheet-cbt.pdf'],
        now() - interval '18 hours'
      )
    `;
    console.log("   ✓ State COMPLETED (Dengan Rekam Medis Klinis) untuk Sarah Annisa");
  }

  // --- SEED 2: Sesi Sedang Berjalan Hari Ini (State: IN_SESSION) ---
  // Kita jadwalkan slot hari ini pada jam sekarang atau rentang yang aktif hari ini
  if (sarah) {
    // Current time WIB
    const now = new Date();
    const currentHour = (now.getUTCHours() + 7) % 24;
    const startHourStr = String(Math.max(0, currentHour - 1)).padStart(2, "0");
    const s2 = await insertSchedule(sarah.id, today, `${startHourStr}:00:00`, "booked");
    await insertBookingWithTx({
      schedule: s2,
      counselor: sarah,
      screeningId: screeningHighRisk.id,
      patientName: "Budi Wicaksono",
      patientEmail: "budi.wicaksono@gmail.com",
      patientPhone: "081987654321",
      initialNotes: "Mengalami stres berat akibat pemutusan hubungan kerja dan butuh ruang aman untuk bercerita.",
      bookingStatus: "confirmed", // resolveSessionTimingAndStatus menjadikannya 'in_session' jika dalam rentang jam, atau admin bisa melihat aktif
      paymentProvider: "manual",
      paymentMethod: "Transfer Bank BCA (Manual)",
      txStatus: "PAID",
      grossAmount: 150000,
      netAmount: 150000,
      referenceNumber: "TRX-BCA-889911",
      adminNotes: "Sudah dikonfirmasi oleh Admin via mutasi rekening.",
    });
    console.log("   ✓ State IN_SESSION / AKTIF HARI INI untuk Sarah Annisa");
  }

  // --- SEED 3: Sesi Mendatang Terkonfirmasi (State: CONFIRMED / UPCOMING) ---
  if (sarah) {
    const s3 = await insertSchedule(sarah.id, tomorrow, "10:00:00", "booked");
    await insertBookingWithTx({
      schedule: s3,
      counselor: sarah,
      screeningId: screeningNormal.id,
      patientName: "Citra Lestari",
      patientEmail: "citra.lestari@gmail.com",
      patientPhone: "085611223344",
      initialNotes: "Quarter-life crisis dan ragu mengambil tawaran beasiswa studi lanjut.",
      bookingStatus: "confirmed",
      paymentProvider: "xendit",
      paymentMethod: "BCA Virtual Account",
      txStatus: "PAID",
      grossAmount: 150000,
      netAmount: 150000,
    });
    console.log("   ✓ State CONFIRMED (Mendatang) untuk Sarah Annisa");
  }

  // --- SEED 4: Sesi Menunggu Pembayaran Transfer Manual (State: PENDING_PAYMENT) ---
  if (dimas) {
    const s4 = await insertSchedule(dimas.id, tomorrow, "14:00:00", "reserved", new Date(Date.now() + 60 * 60 * 1000));
    await insertBookingWithTx({
      schedule: s4,
      counselor: dimas,
      screeningId: screeningNormal.id,
      patientName: "Dika Pratama",
      patientEmail: "dika.pratama@yahoo.com",
      patientPhone: "087799881122",
      initialNotes: "Sulit membagi waktu kuliah dan kerja paruh waktu.",
      bookingStatus: "pending_payment",
      paymentProvider: "manual",
      paymentMethod: "Transfer Bank Mandiri (Manual)",
      txStatus: "PENDING",
      grossAmount: 85000,
      netAmount: 49000,
      includeZoom: false, // Belum generate zoom karena belum bayar
      referenceNumber: "MANUAL-TRF-0912",
      adminNotes: "Menunggu verifikasi bukti transfer dari pasien.",
    });
    console.log("   ✓ State PENDING_PAYMENT (Menunggu Bayar Transfer Manual) untuk Dimas Pratama");
  }

  // --- SEED 5: Sesi Kadaluarsa (State: EXPIRED) ---
  if (rian) {
    // Tanggal kemarin atau jam lampau dengan status pending_payment -> resolveSessionTimingAndStatus otomatis menjadi 'expired'
    const s5 = await insertSchedule(rian.id, yesterday, "09:00:00", "available");
    await insertBookingWithTx({
      schedule: s5,
      counselor: rian,
      screeningId: screeningNormal.id,
      patientName: "Eko Prasetyo",
      patientEmail: "eko.prasetyo@gmail.com",
      patientPhone: "081344556677",
      initialNotes: "Ingin konsultasi pola komunikasi dengan orang tua.",
      bookingStatus: "pending_payment",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      txStatus: "EXPIRED",
      grossAmount: 85000,
      netAmount: 49000,
      includeZoom: false,
    });
    console.log("   ✓ State EXPIRED (Kadaluarsa karena tidak dibayar sebelum sesi) untuk Rian Hidayat");
  }

  // --- SEED 6: Sesi Dibatalkan (State: CANCELLED) ---
  if (nadia) {
    const s6 = await insertSchedule(nadia.id, tomorrow, "16:00:00", "cancelled");
    await insertBookingWithTx({
      schedule: s6,
      counselor: nadia,
      screeningId: screeningModerate.id,
      patientName: "Fani Rahmawati",
      patientEmail: "fani.rahma@gmail.com",
      patientPhone: "082199887766",
      initialNotes: "Ada jadwal dinas mendadak dari kantor sehingga membatalkan sesi.",
      bookingStatus: "cancelled",
      paymentProvider: "xendit",
      paymentMethod: "Credit Card",
      txStatus: "FAILED",
      grossAmount: 150000,
      netAmount: 150000,
      includeZoom: false,
    });
    console.log("   ✓ State CANCELLED (Sesi Dibatalkan) untuk Dr. Nadia Larasati");
  }

  // --- SEED 7: Sesi Selesai Kemarin Namun Belum Isi Catatan Laporan (State: COMPLETED / NO REPORT) ---
  if (dimas) {
    const s7 = await insertSchedule(dimas.id, yesterday, "16:00:00", "booked");
    await insertBookingWithTx({
      schedule: s7,
      counselor: dimas,
      screeningId: screeningHighRisk.id,
      patientName: "Gading Danuarta",
      patientEmail: "gading.danu@gmail.com",
      patientPhone: "081266778899",
      initialNotes: "Krisis emosional pasca perpisahan hubungan.",
      bookingStatus: "completed",
      paymentProvider: "manual",
      paymentMethod: "Transfer Bank BCA (Manual)",
      txStatus: "PAID",
      grossAmount: 85000,
      netAmount: 49000,
      referenceNumber: "BCA-MANUAL-7721",
    });
    console.log("   ✓ State COMPLETED tanpa Rekam Medis (Menunggu Input Konselor) untuk Dimas Pratama");
  }

  // --- SEED 8: Sesi High Risk Suicidal Mendatang (State: HIGH_RISK CONFIRMED) ---
  if (dimas) {
    const s8 = await insertSchedule(dimas.id, in2Days, "13:30:00", "booked");
    await insertBookingWithTx({
      schedule: s8,
      counselor: dimas,
      screeningId: screeningHighRisk.id,
      patientName: "Hana Salsabila",
      patientEmail: "hana.salsa@gmail.com",
      patientPhone: "087811223344",
      initialNotes: "Merasa putus asa dan butuh bantuan segera.",
      bookingStatus: "confirmed",
      paymentProvider: "xendit",
      paymentMethod: "BCA Virtual Account",
      txStatus: "PAID",
      grossAmount: 85000,
      netAmount: 49000,
      bypassedRecommendation: true,
    });
    console.log("   ✓ State CONFIRMED dengan HIGH RISK Flag untuk Dimas Pratama");
  }

  // --- SEED 9: Multi Slot Tersedia untuk Reservasi Klien (State: AVAILABLE) ---
  console.log("🌟 4. Menambahkan slot praktik TERSEDIA (AVAILABLE) untuk seluruh konselor...");
  const slotHours = ["09:00:00", "11:00:00", "13:30:00", "15:30:00", "19:00:00"];

  for (const c of counselors) {
    // Tambahkan 3 slot besok
    await insertSchedule(c.id, tomorrow, "19:00:00", "available");
    
    // Tambahkan 4 slot lusa
    await insertSchedule(c.id, in2Days, "09:00:00", "available");
    await insertSchedule(c.id, in2Days, "11:00:00", "available");
    await insertSchedule(c.id, in2Days, "15:30:00", "available");
    await insertSchedule(c.id, in2Days, "19:00:00", "available");

    // Tambahkan slot di +3 dan +4 hari
    await insertSchedule(c.id, in3Days, "13:30:00", "available");
    await insertSchedule(c.id, in3Days, "15:30:00", "available");
    await insertSchedule(c.id, in4Days, "10:00:00", "available");
    await insertSchedule(c.id, in4Days, "14:00:00", "available");
  }

  // --- SEED 10: Slot Sedang Di-Hold Pembayaran (State: RESERVED) ---
  if (rian) {
    await insertSchedule(
      rian.id,
      tomorrow,
      "13:30:00",
      "reserved",
      new Date(Date.now() + 15 * 60 * 1000) // Reserved hold 15 menit ke depan
    );
    console.log("   ✓ State RESERVED (Holding Slot 17-min window) untuk Rian Hidayat");
  }

  // 5. Verifikasi ringkasan data hasil seed
  const totalSchedules = await sql`SELECT count(*) FROM schedules`;
  const totalBookings = await sql`SELECT count(*) FROM bookings`;
  const totalTx = await sql`SELECT count(*) FROM transactions`;
  const totalReports = await sql`SELECT count(*) FROM session_reports`;
  const statusSummarySchedules = await sql`SELECT status, count(*) FROM schedules GROUP BY status`;
  const statusSummaryBookings = await sql`SELECT status, count(*) FROM bookings GROUP BY status`;

  console.log("\n=======================================================");
  console.log("🎉 SEEDING JADWAL & SESI BERHASIL DILAKUKAN!");
  console.log("=======================================================");
  console.log(`Total Schedules : ${totalSchedules[0].count}`);
  console.log(`Total Bookings  : ${totalBookings[0].count}`);
  console.log(`Total Transaksi : ${totalTx[0].count}`);
  console.log(`Total Rekam Medis: ${totalReports[0].count}`);
  console.log("\nDistribusi Status Schedules:");
  for (const row of statusSummarySchedules) {
    console.log(` - ${row.status.padEnd(12)}: ${row.count}`);
  }
  console.log("\nDistribusi Status Bookings:");
  for (const row of statusSummaryBookings) {
    console.log(` - ${row.status.padEnd(16)}: ${row.count}`);
  }
  console.log("=======================================================\n");
}

runSeed()
  .catch((err) => {
    console.error("❌ Terjadi kegagalan saat seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
