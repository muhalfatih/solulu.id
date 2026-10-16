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

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

async function runSeed() {
  console.log("🌱 Menjalankan Seeder Master SOP (Zero-Mock Real Data)...");

  // 1. Platform Settings
  await sql`
    INSERT INTO platform_settings (
      id, is_screening_required, booking_cutoff_hours, reschedule_cutoff_hours, 
      payment_hold_minutes, max_slot_quota, min_counselor_weekly_slots, 
      no_show_timeout_minutes, base_price, updated_at
    ) VALUES (
      'default', false, 4, 4, 15, 10, 10, 30, 150000, now()
    ) ON CONFLICT (id) DO UPDATE SET
      booking_cutoff_hours = EXCLUDED.booking_cutoff_hours,
      reschedule_cutoff_hours = EXCLUDED.reschedule_cutoff_hours,
      payment_hold_minutes = EXCLUDED.payment_hold_minutes,
      max_slot_quota = EXCLUDED.max_slot_quota,
      min_counselor_weekly_slots = EXCLUDED.min_counselor_weekly_slots,
      no_show_timeout_minutes = EXCLUDED.no_show_timeout_minutes,
      base_price = EXCLUDED.base_price,
      updated_at = now();
  `;
  console.log("✓ Platform settings seeded.");

  // 2. 4 Zoom Pro Accounts
  const zoomData = [
    { num: 1, name: "Akun Zoom Pro 1 (Private Sesi 1)", email: "zoom1@solulu.id", hostKey: "849201" },
    { num: 2, name: "Akun Zoom Pro 2 (Private Sesi 2)", email: "zoom2@solulu.id", hostKey: "592810" },
    { num: 3, name: "Akun Zoom Pro 3 (Private Sesi 3)", email: "zoom3@solulu.id", hostKey: "319482" },
    { num: 4, name: "Akun Zoom Pro 4 (Breakout & Standalone)", email: "zoom4@solulu.id", hostKey: "729104" },
  ];

  for (const z of zoomData) {
    await sql`
      INSERT INTO zoom_accounts (
        id, account_number, name, email, account_id, client_id, 
        client_secret_encrypted, host_key, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${z.num}, ${z.name}, ${z.email}, 
        'ACC_' || ${z.num}, 'CLI_' || ${z.num}, 'enc_dummy_secret_' || ${z.num}, 
        ${z.hostKey}, true, now(), now()
      ) ON CONFLICT (email) DO UPDATE SET
        account_number = EXCLUDED.account_number,
        name = EXCLUDED.name,
        host_key = EXCLUDED.host_key,
        updated_at = now();
    `;
  }
  console.log("✓ 4 Zoom Pro accounts seeded.");

  // 3. Ensure at least 4 Counselors with 21 data fields exist
  const counselorData = [
    {
      userId: "00000000-0000-0000-0000-000000000001",
      fullName: "Dr. Sarah Annisa, M.Psi., Psikolog",
      title: "M.Psi., Psikolog",
      email: "sarah.annisa@solulu.id",
      phone: "081234567891",
      domicile: "Jakarta Selatan",
      type: "psychologist",
      edu: "S2 Magister Profesi Psikologi Universitas Indonesia",
      years: 8,
      bio: "Fokus mendalam pada penanganan stres akademik, kecemasan kerja, dan trauma relasi dengan pendekatan CBT & ACT.",
      himpsi: "HIMPSI-102938",
      sipp: "503/SIPP/DKI/2022",
      sippExp: "2027-12-31",
      str: "12093847291",
      strExp: "2028-06-30",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
      specs: ["Kecemasan & Stres", "Depresi & Mood", "Trauma & PTSD"],
      customFee: 150000,
      commRate: 100000,
    },
    {
      userId: "00000000-0000-0000-0000-000000000002",
      fullName: "Dimas Danang, S.Psi",
      title: "S.Psi",
      email: "dimas.danang@solulu.id",
      phone: "081234567892",
      domicile: "Bandung",
      type: "peer",
      edu: "S1 Psikologi Universitas Padjadjaran",
      years: 3,
      bio: "Pendengar aktif berempati tinggi untuk masalah quarter-life crisis, kejenuhan karier, dan dinamika pertemanan.",
      himpsi: "HIMPSI-948201",
      sipp: null,
      sippExp: null,
      str: null,
      strExp: null,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
      specs: ["Quarter-Life Crisis", "Karier & Pekerjaan", "Burnout & Motivasi"],
      customFee: 85000,
      commRate: 60000,
    },
    {
      userId: "00000000-0000-0000-0000-000000000003",
      fullName: "Rizky Firmansyah, M.Psi., Psikolog",
      title: "M.Psi., Psikolog",
      email: "rizky.firmansyah@solulu.id",
      phone: "081234567893",
      domicile: "Surabaya",
      type: "psychologist",
      edu: "S2 Profesi Psikologi Universitas Airlangga",
      years: 6,
      bio: "Spesialis konseling pasangan, komunikasi interpersonal, dan resolusi konflik rumah tangga.",
      himpsi: "HIMPSI-829103",
      sipp: "401/SIPP/JATIM/2021",
      sippExp: "2026-11-15", // Mendekati expired untuk menguji warning badge Admin
      str: "92837192831",
      strExp: "2027-04-20",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
      specs: ["Hubungan & Asmara", "Keluarga & Relasi", "Komunikasi Efektif"],
      customFee: 160000,
      commRate: 110000,
    },
    {
      userId: "00000000-0000-0000-0000-000000000004",
      fullName: "Nadia Safira, S.Psi",
      title: "S.Psi",
      email: "nadia.safira@solulu.id",
      phone: "081234567894",
      domicile: "Yogyakarta",
      type: "peer",
      edu: "S1 Psikologi Universitas Gadjah Mada",
      years: 4,
      bio: "Konselor pendamping sebaya ramah dan hangat untuk self-esteem, penerimaan diri, dan manajemen emosi harian.",
      himpsi: "HIMPSI-617283",
      sipp: null,
      sippExp: null,
      str: null,
      strExp: null,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600",
      specs: ["Self-Esteem & Percaya Diri", "Kecemasan Sosial", "Manajemen Emosi"],
      customFee: 90000,
      commRate: 65000,
    },
  ];

  const counselorIds = [];
  for (const c of counselorData) {
    const res = await sql`
      INSERT INTO counselors (
        id, user_id, full_name, title, email, phone, domicile, counselor_type,
        education, experience_years, bio, himpsi_number, sipp_number, sipp_expires_at,
        str_number, str_expires_at, avatar_r2_url, specializations, custom_fee_rate,
        counselor_commission_rate, verification_status, weekly_slot_target, is_active, is_featured, created_at
      ) VALUES (
        gen_random_uuid(), ${c.userId}, ${c.fullName}, ${c.title}, ${c.email}, ${c.phone},
        ${c.domicile}, ${c.type}, ${c.edu}, ${c.years}, ${c.bio}, ${c.himpsi},
        ${c.sipp}, ${c.sippExp}, ${c.str}, ${c.strExp}, ${c.avatar}, ${c.specs},
        ${c.customFee}, ${c.commRate}, 'verified', 10, true, true, now()
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        title = EXCLUDED.title,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        domicile = EXCLUDED.domicile,
        education = EXCLUDED.education,
        experience_years = EXCLUDED.experience_years,
        bio = EXCLUDED.bio,
        himpsi_number = EXCLUDED.himpsi_number,
        sipp_number = EXCLUDED.sipp_number,
        sipp_expires_at = EXCLUDED.sipp_expires_at,
        str_number = EXCLUDED.str_number,
        str_expires_at = EXCLUDED.str_expires_at,
        avatar_r2_url = EXCLUDED.avatar_r2_url,
        specializations = EXCLUDED.specializations,
        custom_fee_rate = EXCLUDED.custom_fee_rate,
        counselor_commission_rate = EXCLUDED.counselor_commission_rate,
        verification_status = EXCLUDED.verification_status,
        weekly_slot_target = EXCLUDED.weekly_slot_target
      RETURNING id;
    `;
    counselorIds.push(res[0].id);
  }
  console.log(`✓ ${counselorIds.length} Verified Counselors seeded.`);

  // 4. Generate 7 Fixed Slots for Today & Tomorrow
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  const fixedSlots = [
    { idx: 1, start: "08:00:00", end: "10:00:00" },
    { idx: 2, start: "10:00:00", end: "12:00:00" },
    { idx: 3, start: "12:00:00", end: "14:00:00" },
    { idx: 4, start: "14:00:00", end: "16:00:00" },
    { idx: 5, start: "16:00:00", end: "18:00:00" },
    { idx: 6, start: "18:00:00", end: "20:00:00" },
    { idx: 7, start: "20:00:00", end: "22:00:00" },
  ];

  const scheduleMap = {}; // key: `${date}_${slotIdx}_${counselorId}` => scheduleId
  for (const d of [today, tomorrow]) {
    for (const cId of counselorIds) {
      for (const s of fixedSlots) {
        const rows = await sql`
          INSERT INTO schedules (
            id, counselor_id, date, slot_index, start_time, end_time, status, is_leave, created_at
          ) VALUES (
            gen_random_uuid(), ${cId}, ${d}, ${s.idx}, ${s.start}, ${s.end}, 'available', false, now()
          ) RETURNING id;
        `;
        scheduleMap[`${d}_${s.idx}_${cId}`] = rows[0].id;
      }
    }
  }
  console.log("✓ 7 Fixed Slots generated for today and tomorrow.");

  // Fetch Zoom Accounts for assignment
  const zoomAccountsList = await sql`
    SELECT id, account_number, host_key FROM zoom_accounts ORDER BY account_number ASC;
  `;
  const zoomByNumber = {};
  for (const za of zoomAccountsList) {
    zoomByNumber[za.account_number] = za;
  }

  // 5. Seed Bookings demonstrating both Standalone (Slot 3) & Breakout Mode (Slot 6)
  // Scenario A: Slot 3 (12.00–14.00) has 3 bookings -> Zoom 1, 2, 3 (Standalone)
  console.log("Seeding Scenario A: Slot 3 Standalone sessions...");
  for (let i = 0; i < 3; i++) {
    const cId = counselorIds[i];
    const sId = scheduleMap[`${today}_3_${cId}`];
    const zoomAcc = zoomByNumber[i + 1];
    const bCode = `SL-300${i + 1}`;
    const token = `demo_token_slot3_${i + 1}_${Date.now().toString(36)}`;

    await sql`
      INSERT INTO bookings (
        id, access_token, booking_code, patient_name, patient_email, patient_phone,
        gender, age, domicile, religion, initial_notes, informed_consent_accepted_at,
        schedule_id, counselor_id, zoom_account_id, zoom_account_number,
        zoom_allocation_mode, zoom_join_url, zoom_start_url, zoom_host_key,
        breakout_room_name, status, reschedule_count, is_followed_up, is_no_show, created_at
      ) VALUES (
        gen_random_uuid(), ${token}, ${bCode}, ${`Klien Uji Coba ${i + 1}`}, ${`klien${i + 1}@example.com`},
        '08129999000' || ${i + 1}, 'Perempuan', 24 + ${i}, 'Jakarta', 'Islam', 
        'Konsultasi manajemen stres dan overthinking kerja.', now(),
        ${sId}, ${cId}, ${zoomAcc?.id || null}, ${i + 1}, 'standalone',
        'https://zoom.us/j/91028374' || ${i + 1}, 'https://zoom.us/s/91028374' || ${i + 1},
        ${zoomAcc?.host_key || "849201"}, null, 'confirmed', 0, false, false, now()
      );
    `;
    await sql`UPDATE schedules SET status = 'booked' WHERE id = ${sId};`;
  }

  // Scenario B: Slot 6 (18.00–20.00) has 6 bookings -> Zoom 1, 2, 3 Standalone, Zoom 4 Breakout Mode (Sessions 4, 5, 6)
  console.log("Seeding Scenario B: Slot 6 Breakout sessions (> 4 sessions)...");
  for (let i = 0; i < 6; i++) {
    const cId = counselorIds[i % counselorIds.length];
    const sId = scheduleMap[`${today}_6_${cId}`];
    const zoomNumber = i < 3 ? i + 1 : 4;
    const isBreakout = i >= 3;
    const zoomAcc = zoomByNumber[zoomNumber];
    const bCode = `SL-600${i + 1}`;
    const token = `demo_token_slot6_${i + 1}_${Date.now().toString(36)}`;
    const counselorName = counselorData[i % counselorData.length].fullName.split(",")[0];
    const roomName = isBreakout ? `${bCode} - ${counselorName}` : null;

    const bRes = await sql`
      INSERT INTO bookings (
        id, access_token, booking_code, patient_name, patient_email, patient_phone,
        gender, age, domicile, religion, initial_notes, informed_consent_accepted_at,
        schedule_id, counselor_id, zoom_account_id, zoom_account_number,
        zoom_allocation_mode, zoom_join_url, zoom_start_url, zoom_host_key,
        breakout_room_name, status, reschedule_count, is_followed_up, is_no_show, created_at
      ) VALUES (
        gen_random_uuid(), ${token}, ${bCode}, ${`Klien Peserta ${i + 1}`}, ${`peserta${i + 1}@example.com`},
        '08571111000' || ${i + 1}, ${i % 2 === 0 ? "Laki-laki" : "Perempuan"}, 26, 'Bandung', 'Islam',
        'Konsultasi relasi keluarga dan rencana karier ke depan.', now(),
        ${sId}, ${cId}, ${zoomAcc?.id || null}, ${zoomNumber}, 
        ${isBreakout ? "breakout_room" : "standalone"},
        'https://zoom.us/j/99008877' || ${zoomNumber}, 'https://zoom.us/s/99008877' || ${zoomNumber},
        ${zoomAcc?.host_key || "729104"}, ${roomName}, 'confirmed', 0, false, false, now()
      ) RETURNING id;
    `;
    await sql`UPDATE schedules SET status = 'booked' WHERE id = ${sId};`;

    // Seed one completed session with report
    if (i === 0) {
      await sql`
        INSERT INTO session_reports (
          id, booking_id, counselor_id, summary, action_plan, internal_notes,
          actual_duration_minutes, created_at
        ) VALUES (
          gen_random_uuid(), ${bRes[0].id}, ${cId},
          'Klien mengalami distres emosional terkait beban kerja dan ekspektasi keluarga. Klien merespons positif latihan pernapasan diafragma dan teknik restrukturisasi kognitif.',
          '1. Melanjutkan latihan jurnal rasa cemas harian.\n2. Mengurangi screen time 1 jam sebelum tidur.\n3. Sesi lanjutan direkomendasikan 2 minggu mendatang.',
          'Catatan Internal: Waspadai dinamika perfeksionisme tinggi. Hubungan dengan orang tua agak tegang namun suportif.',
          90, now()
        );
      `;
    }
  }

  console.log("🎉 Seeding Master SOP selesai sempurna dengan data PostgreSQL real!");
  await sql.end();
}

runSeed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
