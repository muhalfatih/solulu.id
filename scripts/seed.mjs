import postgres from "postgres";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  ROLE_CREDENTIALS,
  PLATFORM_SETTINGS,
  PLATFORM_PRICINGS,
  SPECIALIZATIONS,
  VOUCHERS,
  ZOOM_ACCOUNTS,
  COUNSELORS_DATA,
  COUNSELOR_APPLICATIONS,
  SCREENINGS_DATA,
  PUBLIC_DOCUMENTATIONS,
  TESTIMONIALS,
} from "./data/master-data.mjs";

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

// Enkripsi AES-256-GCM untuk Client Secret Zoom
function encryptSecret(plaintext) {
  const rawKey = process.env.APP_ENCRYPTION_KEY || "8823ff37db8ef773ece41596c16c00101309fa354a55a9e0768958dd2f20124c";
  const key = /^[0-9a-fA-F]{64}$/.test(rawKey)
    ? Buffer.from(rawKey, "hex")
    : crypto.createHash("sha256").update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

// Generate NanoId untuk Token Akses Sesi Klien
function generateNanoId(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let res = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    res += chars[randomBytes[i] % chars.length];
  }
  return res;
}

// Date helpers dalam format Asia/Jakarta (WIB)
function getWIBDate(offsetDays = 0) {
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

async function runSeed() {
  console.log("======================================================");
  console.log("🌱 MEMULAI MASTER SEEDING DATABASE SOLULU (POSTGRESQL)");
  console.log("======================================================");
  const startTime = Date.now();

  // ---------------------------------------------------------------------------
  // 1. SINKRONISASI SUPABASE AUTH (4 KREDENSIAL PERAN RESMI)
  // ---------------------------------------------------------------------------
  console.log("\n🔐 1. Sinkronisasi Akun Autentikasi Supabase (4 Peran Resmi)...");
  const authUserIds = {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const cred of ROLE_CREDENTIALS) {
      try {
        // Cek user yang sudah ada via query auth.users
        const existingUsers = await sql`SELECT id, email FROM auth.users WHERE email = ${cred.email} LIMIT 1`;
        let userId = null;

        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
          // Perbarui password dan role metadata
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: cred.password,
            email_confirm: true,
            app_metadata: cred.appMetadata,
            user_metadata: cred.userMetadata,
          });
          console.log(`   ✓ Akun "${cred.email}" [${cred.role}] diperbarui (ID: ${userId})`);
        } else {
          // Buat akun baru via Admin API
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: cred.email,
            password: cred.password,
            email_confirm: true,
            app_metadata: cred.appMetadata,
            user_metadata: cred.userMetadata,
          });

          if (createErr) {
            console.warn(`   ⚠️ Gagal membuat user ${cred.email} via admin API:`, createErr.message);
            userId = crypto.randomUUID();
          } else {
            userId = newUser.user.id;
            console.log(`   + Akun baru "${cred.email}" [${cred.role}] berhasil dibuat (ID: ${userId})`);
          }
        }
        authUserIds[cred.email] = userId;
      } catch (err) {
        console.warn(`   ⚠️ Error sinkronisasi auth untuk ${cred.email}:`, err.message);
        // Fallback jika direct query/admin API bermasalah
        const existing = await sql`SELECT id FROM auth.users WHERE email = ${cred.email} LIMIT 1`;
        authUserIds[cred.email] = existing.length > 0 ? existing[0].id : crypto.randomUUID();
      }
    }
  } else {
    console.log("   ℹ SUPABASE_SERVICE_ROLE_KEY tidak disetel, memeriksa id auth.users eksisting...");
    for (const cred of ROLE_CREDENTIALS) {
      const existing = await sql`SELECT id FROM auth.users WHERE email = ${cred.email} LIMIT 1`;
      authUserIds[cred.email] = existing.length > 0 ? existing[0].id : crypto.randomUUID();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. PLATFORM SETTINGS
  // ---------------------------------------------------------------------------
  console.log("\n⚙️ 2. Seeding Platform Settings...");
  await sql`
    INSERT INTO platform_settings (
      id, is_screening_required, booking_cutoff_hours, reschedule_cutoff_hours,
      payment_hold_minutes, max_slot_quota, min_counselor_weekly_slots,
      no_show_timeout_minutes, base_price, counselor_extend_fee_per_30_min,
      psychologist_extend_fee_per_30_min, is_manual_payment_enabled,
      manual_payment_instructions, updated_at
    ) VALUES (
      ${PLATFORM_SETTINGS.id},
      ${PLATFORM_SETTINGS.isScreeningRequired},
      ${PLATFORM_SETTINGS.bookingCutoffHours},
      ${PLATFORM_SETTINGS.rescheduleCutoffHours},
      ${PLATFORM_SETTINGS.paymentHoldMinutes},
      ${PLATFORM_SETTINGS.maxSlotQuota},
      ${PLATFORM_SETTINGS.minCounselorWeeklySlots},
      ${PLATFORM_SETTINGS.noShowTimeoutMinutes},
      ${PLATFORM_SETTINGS.basePrice},
      ${PLATFORM_SETTINGS.counselorExtendFeePer30Min},
      ${PLATFORM_SETTINGS.psychologistExtendFeePer30Min},
      ${PLATFORM_SETTINGS.isManualPaymentEnabled},
      ${PLATFORM_SETTINGS.manualPaymentInstructions},
      now()
    ) ON CONFLICT (id) DO UPDATE SET
      is_screening_required = EXCLUDED.is_screening_required,
      booking_cutoff_hours = EXCLUDED.booking_cutoff_hours,
      reschedule_cutoff_hours = EXCLUDED.reschedule_cutoff_hours,
      payment_hold_minutes = EXCLUDED.payment_hold_minutes,
      max_slot_quota = EXCLUDED.max_slot_quota,
      min_counselor_weekly_slots = EXCLUDED.min_counselor_weekly_slots,
      no_show_timeout_minutes = EXCLUDED.no_show_timeout_minutes,
      base_price = EXCLUDED.base_price,
      counselor_extend_fee_per_30_min = EXCLUDED.counselor_extend_fee_per_30_min,
      psychologist_extend_fee_per_30_min = EXCLUDED.psychologist_extend_fee_per_30_min,
      is_manual_payment_enabled = EXCLUDED.is_manual_payment_enabled,
      manual_payment_instructions = EXCLUDED.manual_payment_instructions,
      updated_at = now();
  `;
  console.log("   ✓ Platform settings seeded.");

  // ---------------------------------------------------------------------------
  // 3. PLATFORM PRICING
  // ---------------------------------------------------------------------------
  console.log("\n💰 3. Seeding Platform Pricing...");
  for (const p of PLATFORM_PRICINGS) {
    await sql`
      INSERT INTO platform_pricing (
        id, counselor_type, base_price, promo_price, is_sale_active, allow_voucher, updated_at
      ) VALUES (
        gen_random_uuid(), ${p.counselorType}, ${p.basePrice}, ${p.promoPrice},
        ${p.isSaleActive}, ${p.allowVoucher}, now()
      ) ON CONFLICT (counselor_type) DO UPDATE SET
        base_price = EXCLUDED.base_price,
        promo_price = EXCLUDED.promo_price,
        is_sale_active = EXCLUDED.is_sale_active,
        allow_voucher = EXCLUDED.allow_voucher,
        updated_at = now();
    `;
  }
  console.log("   ✓ Platform pricing (Peer & Psychologist) seeded.");

  // ---------------------------------------------------------------------------
  // 4. 10 SPESIALISASI KLINIS
  // ---------------------------------------------------------------------------
  console.log("\n🏷️ 4. Seeding 10 Spesialisasi Klinis...");
  for (const s of SPECIALIZATIONS) {
    await sql`
      INSERT INTO specializations (id, name, description, is_active, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${s.name}, ${s.description}, ${s.isActive}, ${s.sortOrder}, now(), now())
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        updated_at = now();
    `;
  }
  console.log("   ✓ 10 spesialisasi terurut seeded.");

  // ---------------------------------------------------------------------------
  // 5. VOUCHERS
  // ---------------------------------------------------------------------------
  console.log("\n🎟️ 5. Seeding Vouchers...");
  for (const v of VOUCHERS) {
    await sql`
      INSERT INTO vouchers (id, code, discount_type, discount_value, quota, used_count, expires_at, is_active, created_at)
      VALUES (gen_random_uuid(), ${v.code}, ${v.discountType}, ${v.discountValue}, ${v.quota}, ${v.usedCount}, ${v.expiresAt}, ${v.isActive}, now())
      ON CONFLICT (code) DO UPDATE SET
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        quota = EXCLUDED.quota,
        used_count = EXCLUDED.used_count,
        expires_at = EXCLUDED.expires_at,
        is_active = EXCLUDED.is_active;
    `;
  }
  console.log(`   ✓ ${VOUCHERS.length} vouchers seeded.`);

  // ---------------------------------------------------------------------------
  // 6. ZOOM ACCOUNTS (HANYA 4 AKUN PRO RESMI)
  // ---------------------------------------------------------------------------
  console.log("\n🎥 6. Seeding 4 Akun Zoom Pro Resmi (Hapus akun non-resmi)...");
  // Hapus akun non-resmi seperti muhalfatih265@gmail.com
  await sql`
    DELETE FROM zoom_accounts 
    WHERE email NOT IN ('zoom1@solulu.id', 'zoom2@solulu.id', 'zoom3@solulu.id', 'zoom4@solulu.id')
  `;

  const zoomAccountsMap = [];
  for (const z of ZOOM_ACCOUNTS) {
    const encSecret = encryptSecret(z.rawSecret);
    const [inserted] = await sql`
      INSERT INTO zoom_accounts (
        id, account_number, name, email, account_id, client_id, client_secret_encrypted, host_key, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${z.accountNumber}, ${z.name}, ${z.email}, ${z.accountId},
        ${z.clientId}, ${encSecret}, ${z.hostKey}, ${z.isActive}, now(), now()
      ) ON CONFLICT (email) DO UPDATE SET
        account_number = EXCLUDED.account_number,
        name = EXCLUDED.name,
        account_id = EXCLUDED.account_id,
        client_id = EXCLUDED.client_id,
        client_secret_encrypted = EXCLUDED.client_secret_encrypted,
        host_key = EXCLUDED.host_key,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING id, account_number, name, email;
    `;
    zoomAccountsMap.push(inserted);
    console.log(`   - Zoom Pro #${z.accountNumber}: ${z.name} (${z.email})`);
  }
  console.log("   ✓ Tepat 4 Akun Zoom Pro aktif dan terenkripsi AES-256-GCM.");

  // ---------------------------------------------------------------------------
  // 7. COUNSELORS (6 PROFIL LENGKAP 21 FIELDS)
  // ---------------------------------------------------------------------------
  console.log("\n👩‍⚕️ 7. Seeding 6 Konselor Terverifikasi (21 Data Fields)...");
  const counselorIdMap = [];

  for (const c of COUNSELORS_DATA) {
    // Cari user_id yang sesuai
    let targetUserId = authUserIds[c.email];
    if (!targetUserId) {
      const existingUser = await sql`SELECT id FROM auth.users WHERE email = ${c.email} LIMIT 1`;
      targetUserId = existingUser.length > 0 ? existingUser[0].id : crypto.randomUUID();
    }

    // Cek apakah konselor sudah terdaftar berdasarkan user_id atau email
    const existing = await sql`
      SELECT id FROM counselors WHERE user_id = ${targetUserId} OR email = ${c.email} LIMIT 1
    `;

    let counselorId;
    if (existing.length > 0) {
      counselorId = existing[0].id;
      await sql`
        UPDATE counselors SET
          user_id = ${targetUserId},
          full_name = ${c.fullName},
          title = ${c.title},
          email = ${c.email},
          phone = ${c.phone},
          domicile = ${c.domicile},
          counselor_type = ${c.counselorType},
          specializations = ${c.specializations},
          education = ${c.education},
          experience_years = ${c.experienceYears},
          bio = ${c.bio},
          himpsi_number = ${c.himpsiNumber},
          custom_fee_rate = ${c.customFeeRate},
          counselor_commission_rate = ${c.counselorCommissionRate},
          sipp_number = ${c.sippNumber},
          sipp_expires_at = ${c.sippExpiresAt},
          str_number = ${c.strNumber},
          str_expires_at = ${c.strExpiresAt},
          avatar_r2_url = ${c.avatarR2Url},
          ktp_r2_key = ${c.ktpR2Key},
          cv_r2_key = ${c.cvR2Key},
          diploma_s1_r2_key = ${c.diplomaS1R2Key},
          diploma_profesi_r2_key = ${c.diplomaProfesiR2Key},
          str_r2_key = ${c.strR2Key},
          sipp_r2_key = ${c.sippR2Key},
          certificate_r2_key = ${c.certificateR2Key},
          verification_status = ${c.verificationStatus},
          weekly_slot_target = ${c.weeklySlotTarget},
          is_active = ${c.isActive},
          is_featured = ${c.isFeatured}
        WHERE id = ${counselorId}
      `;
      console.log(`   ✓ Memperbarui profil: ${c.fullName} (${c.counselorType})`);
    } else {
      const [inserted] = await sql`
        INSERT INTO counselors (
          id, user_id, full_name, title, email, phone, domicile, counselor_type,
          specializations, education, experience_years, bio, himpsi_number,
          custom_fee_rate, counselor_commission_rate, sipp_number, sipp_expires_at,
          str_number, str_expires_at, avatar_r2_url, ktp_r2_key, cv_r2_key,
          diploma_s1_r2_key, diploma_profesi_r2_key, str_r2_key, sipp_r2_key,
          certificate_r2_key, verification_status, weekly_slot_target,
          is_active, is_featured, created_at
        ) VALUES (
          gen_random_uuid(), ${targetUserId}, ${c.fullName}, ${c.title}, ${c.email},
          ${c.phone}, ${c.domicile}, ${c.counselorType}, ${c.specializations},
          ${c.education}, ${c.experienceYears}, ${c.bio}, ${c.himpsiNumber},
          ${c.customFeeRate}, ${c.counselorCommissionRate}, ${c.sippNumber},
          ${c.sippExpiresAt}, ${c.strNumber}, ${c.strExpiresAt}, ${c.avatarR2Url},
          ${c.ktpR2Key}, ${c.cvR2Key}, ${c.diplomaS1R2Key}, ${c.diplomaProfesiR2Key},
          ${c.strR2Key}, ${c.sippR2Key}, ${c.certificateR2Key}, ${c.verificationStatus},
          ${c.weeklySlotTarget}, ${c.isActive}, ${c.isFeatured}, now()
        ) RETURNING id;
      `;
      counselorId = inserted.id;
      console.log(`   + Menambahkan konselor: ${c.fullName} (${c.counselorType})`);
    }

    counselorIdMap.push({ id: counselorId, ...c });
  }

  // ---------------------------------------------------------------------------
  // 8. SCHEDULES (7 HARI KE DEPAN, 7 SLOT STANDAR PER HARI)
  // ---------------------------------------------------------------------------
  console.log("\n📅 8. Seeding Jadwal Dinamis 7 Hari ke Depan (7 Slot Waktu Harian)...");
  // 7 slot standar 2 jam:
  const STANDARD_SLOTS = [
    { slotIndex: 1, startTime: "08:00:00", endTime: "10:00:00" },
    { slotIndex: 2, startTime: "10:00:00", endTime: "12:00:00" },
    { slotIndex: 3, startTime: "12:00:00", endTime: "14:00:00" },
    { slotIndex: 4, startTime: "14:00:00", endTime: "16:00:00" },
    { slotIndex: 5, startTime: "16:00:00", endTime: "18:00:00" },
    { slotIndex: 6, startTime: "18:00:00", endTime: "20:00:00" },
    { slotIndex: 7, startTime: "20:00:00", endTime: "22:00:00" },
  ];

  const slotsToInsert = [];
  for (const c of counselorIdMap) {
    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const slotDate = getWIBDate(dayOffset);
      for (const slot of STANDARD_SLOTS) {
        const isAssigned = (c.fullName.length + dayOffset + slot.slotIndex) % 2 === 0;
        if (!isAssigned) continue;
        slotsToInsert.push({
          id: crypto.randomUUID(),
          counselor_id: c.id,
          date: slotDate,
          slot_index: slot.slotIndex,
          start_time: slot.startTime,
          end_time: slot.endTime,
          status: "available",
          is_leave: false,
        });
      }
    }
  }

  const createdSchedules = await sql`
    INSERT INTO schedules ${sql(slotsToInsert)}
    RETURNING id, counselor_id, date, slot_index, start_time, end_time, status;
  `;
  console.log(`   ✓ Berhasil batch insert ${createdSchedules.length} slot jadwal aktif untuk 6 konselor.`);

  // ---------------------------------------------------------------------------
  // 9. COUNSELOR APPLICATIONS
  // ---------------------------------------------------------------------------
  console.log("\n📑 9. Seeding Pendaftaran Pelamar Konselor...");
  for (const app of COUNSELOR_APPLICATIONS) {
    await sql`
      INSERT INTO counselor_applications (
        id, full_name, email, phone, counselor_type, bio, cv_r2_key, ktp_r2_key,
        diploma_r2_key, str_r2_key, status, rejection_reason, agreed_to_terms_at, created_at
      ) VALUES (
        gen_random_uuid(), ${app.fullName}, ${app.email}, ${app.phone}, ${app.counselorType},
        ${app.bio}, ${app.cvR2Key}, ${app.ktpR2Key}, ${app.diplomaR2Key}, ${app.strR2Key},
        ${app.status}, ${app.rejectionReason}, now(), now()
      ) ON CONFLICT DO NOTHING;
    `;
  }
  console.log(`   ✓ ${COUNSELOR_APPLICATIONS.length} aplikasi pelamar seeded.`);

  // ---------------------------------------------------------------------------
  // 10. SCREENINGS (SRQ-20)
  // ---------------------------------------------------------------------------
  console.log("\n🩺 10. Seeding Hasil Screening SRQ-20 Klinis...");
  const createdScreenings = [];
  for (const scr of SCREENINGS_DATA) {
    const [inserted] = await sql`
      INSERT INTO screenings (id, answers, total_score, has_suicidal_thoughts, recommended_type, created_at)
      VALUES (
        gen_random_uuid(), ${sql.json(scr.answers)}, ${scr.totalScore},
        ${scr.hasSuicidalThoughts}, ${scr.recommendedType}, now()
      ) RETURNING id, total_score, recommended_type;
    `;
    createdScreenings.push(inserted);
  }
  console.log(`   ✓ ${createdScreenings.length} data screening klinis tersimpan.`);

  // ---------------------------------------------------------------------------
  // 11. BOOKINGS, TRANSACTIONS, & SESSION REPORTS
  // ---------------------------------------------------------------------------
  console.log("\n🎫 11. Seeding Sesi Booking, Transaksi, dan Laporan Klinis...");

  // Skenario 1: Sesi Terkonfirmasi Hari Ini (Sarah Annisa, Zoom Pro 1)
  const sarah = counselorIdMap.find((c) => c.counselorType === "psychologist") || counselorIdMap[0];
  const rian = counselorIdMap.find((c) => c.counselorType === "peer") || counselorIdMap[1];
  const zoom1 = zoomAccountsMap[0];
  const zoom2 = zoomAccountsMap[1];

  // Cari jadwal untuk sesi
  const todayDate = getWIBDate(0);
  const tomorrowDate = getWIBDate(1);
  const yesterdayDate = getWIBDate(-1);

  // Buat 1 slot masa lalu (kemarin) untuk completed session
  const [pastSchedule] = await sql`
    INSERT INTO schedules (id, counselor_id, date, slot_index, start_time, end_time, status, is_leave, created_at)
    VALUES (gen_random_uuid(), ${sarah.id}, ${yesterdayDate}, 2, '10:00:00', '12:00:00', 'booked', false, now())
    RETURNING id;
  `;

  // Update status slot hari ini dan besok menjadi booked
  const todaySlot = createdSchedules.find((s) => s.counselor_id === sarah.id && s.date === todayDate) || createdSchedules[0];
  const tomorrowSlot = createdSchedules.find((s) => s.counselor_id === rian.id && s.date === tomorrowDate) || createdSchedules[1];

  if (todaySlot) {
    await sql`UPDATE schedules SET status = 'booked' WHERE id = ${todaySlot.id}`;
  }
  if (tomorrowSlot) {
    await sql`UPDATE schedules SET status = 'booked' WHERE id = ${tomorrowSlot.id}`;
  }

  // 11.1 Booking Confirmed (Hari ini, Zoom 1 aktif)
  const token1 = generateNanoId(32);
  const [bookingConfirmed] = await sql`
    INSERT INTO bookings (
      id, access_token, booking_code, patient_name, patient_email, patient_phone,
      gender, age, domicile, religion, initial_notes, informed_consent_accepted_at,
      schedule_id, counselor_id, screening_id, bypassed_recommendation,
      zoom_account_id, zoom_account_number, zoom_allocation_mode, zoom_meeting_id,
      zoom_join_url, zoom_start_url, zoom_host_key, payment_method, status, created_at
    ) VALUES (
      gen_random_uuid(), ${token1}, 'SL-4821', 'Rian Kurniawan', 'rian.k@example.com',
      '081298761122', 'Laki-laki', 27, 'Jakarta', 'Islam', 'Sering merasa cemas dan susah tidur memikirkan karir.',
      now(), ${todaySlot ? todaySlot.id : pastSchedule.id}, ${sarah.id}, ${createdScreenings[1].id}, false,
      ${zoom1.id}, 1, 'standalone', '91283719283', 'https://zoom.us/j/91283719283',
      'https://zoom.us/s/91283719283', '849201', 'xendit', 'confirmed', now()
    ) RETURNING id;
  `;

  await sql`
    INSERT INTO transactions (
      id, booking_id, xendit_invoice_id, payment_provider, payment_method,
      gross_amount, discount_amount, net_amount, status, paid_at, created_at
    ) VALUES (
      gen_random_uuid(), ${bookingConfirmed.id}, 'inv_live_xnd_918231', 'xendit', 'QRIS',
      '150000.00', '21000.00', '129000.00', 'PAID', now(), now()
    );
  `;

  // 11.2 Booking Completed dengan Session Report (Kemarin)
  const tokenCompleted = generateNanoId(32);
  const [bookingCompleted] = await sql`
    INSERT INTO bookings (
      id, access_token, booking_code, patient_name, patient_email, patient_phone,
      gender, age, domicile, religion, initial_notes, informed_consent_accepted_at,
      schedule_id, counselor_id, screening_id, zoom_account_id, zoom_account_number,
      zoom_allocation_mode, payment_method, status, is_followed_up, created_at
    ) VALUES (
      gen_random_uuid(), ${tokenCompleted}, 'SL-1001', 'Ananda Putri', 'ananda.putri@example.com',
      '081398127361', 'Perempuan', 24, 'Bandung', 'Islam', 'Kelelahan emosional dan burnout tugas akhir.',
      now(), ${pastSchedule.id}, ${sarah.id}, ${createdScreenings[0].id},
      ${zoom1.id}, 1, 'standalone', 'xendit', 'completed', true, now()
    ) RETURNING id;
  `;

  await sql`
    INSERT INTO transactions (
      id, booking_id, xendit_invoice_id, payment_provider, payment_method,
      gross_amount, discount_amount, net_amount, status, paid_at, created_at
    ) VALUES (
      gen_random_uuid(), ${bookingCompleted.id}, 'inv_live_xnd_100192', 'xendit', 'BCA Virtual Account',
      '150000.00', '0.00', '150000.00', 'PAID', now(), now()
    );
  `;

  await sql`
    INSERT INTO session_reports (
      id, booking_id, counselor_id, main_issue, summary, action_plan, follow_up_recommendation,
      internal_notes, actual_duration_minutes, timer_started_at, timer_stopped_at, created_at
    ) VALUES (
      gen_random_uuid(), ${bookingCompleted.id}, ${sarah.id},
      'Burnout Akademik & Kecemasan Evaluatif',
      'Klien mengalami distres emosional akibat beban tugas akhir dan ekspektasi lingkungan. Klien merespons sangat positif psikoedukasi teknik relaksasi diafragma dan cognitive reframing.',
      '1. Praktik teknik pernapasan 4-7-8 dua kali sehari.\n2. Membuat batasan waktu belajar maksimal 3 jam per sesi.\n3. Jurnal harian restrukturisasi pikiran negatif.',
      'Sesi lanjutan disarankan dalam 2 minggu untuk mengevaluasi progres penerapan restrukturisasi kognitif.',
      'Catatan Rahasia Konselor: Klien kooperatif, insight baik. Tidak ada indikasi ide bunuh diri. Hubungan keluarga cukup suportif namun ekspektasi tinggi.',
      90, now() - interval '90 minutes', now(), now()
    );
  `;

  // 11.3 Booking Pending Payment (Dalam Window Hold 15 Menit)
  const tokenPending = generateNanoId(32);
  const [bookingPending] = await sql`
    INSERT INTO bookings (
      id, access_token, booking_code, patient_name, patient_email, patient_phone,
      gender, age, domicile, religion, initial_notes, schedule_id, counselor_id,
      screening_id, payment_method, status, created_at
    ) VALUES (
      gen_random_uuid(), ${tokenPending}, 'SL-5521', 'Farhan Ramadhan', 'farhan.r@example.com',
      '085291823712', 'Laki-laki', 22, 'Yogyakarta', 'Islam', 'Bingung menentukan arah karir pasca lulus.',
      ${tomorrowSlot ? tomorrowSlot.id : pastSchedule.id}, ${rian.id}, ${createdScreenings[3].id},
      'xendit', 'pending_payment', now()
    ) RETURNING id;
  `;

  await sql`
    INSERT INTO transactions (
      id, booking_id, xendit_invoice_id, payment_provider, gross_amount,
      discount_amount, net_amount, status, created_at
    ) VALUES (
      gen_random_uuid(), ${bookingPending.id}, 'inv_live_xnd_552199', 'xendit',
      '85000.00', '36000.00', '49000.00', 'PENDING', now()
    );
  `;

  // 11.4 Booking Transfer Manual Pending Verifikasi Admin
  const tokenManual = generateNanoId(32);
  const [bookingManual] = await sql`
    INSERT INTO bookings (
      id, access_token, booking_code, patient_name, patient_email, patient_phone,
      gender, age, domicile, religion, initial_notes, schedule_id, counselor_id,
      payment_method, manual_payment_status, manual_payment_proof_r2_key, status, created_at
    ) VALUES (
      gen_random_uuid(), ${tokenManual}, 'SL-9932', 'Dewi Lestari', 'dewi.lestari@example.com',
      '081928374651', 'Perempuan', 29, 'Jakarta', 'Kristen', 'Stres relasi keluarga dan batasan emosional.',
      ${pastSchedule.id}, ${rian.id}, 'manual_bank_transfer', 'PENDING',
      'manual-proofs/dewi-transfer-bca.jpg', 'pending_payment', now()
    ) RETURNING id;
  `;

  await sql`
    INSERT INTO transactions (
      id, booking_id, payment_provider, payment_method, reference_number,
      admin_notes, gross_amount, discount_amount, net_amount, status, is_manual_verification, created_at
    ) VALUES (
      gen_random_uuid(), ${bookingManual.id}, 'manual_bank_transfer', 'Transfer Bank BCA',
      'TRF-BCA-99321', 'Menunggu verifikasi bukti transfer manual oleh Admin',
      '85000.00', '36000.00', '49000.00', 'PENDING', true, now()
    );
  `;

  console.log("   ✓ Sesi booking terkonfirmasi, laporan klinis, dan transaksi pembayaran seeded.");

  // ---------------------------------------------------------------------------
  // 12. PUBLIC DOCUMENTATIONS (GALERI)
  // ---------------------------------------------------------------------------
  console.log("\n🖼️ 12. Seeding Galeri Dokumentasi Publik...");
  const adminUserId = authUserIds["admin@solulu.id"] || crypto.randomUUID();
  for (const doc of PUBLIC_DOCUMENTATIONS) {
    await sql`
      INSERT INTO public_documentations (id, image_url, caption, is_censored_and_consented, is_published, uploaded_by, created_at)
      VALUES (gen_random_uuid(), ${doc.imageUrl}, ${doc.caption}, ${doc.isCensoredAndConsented}, ${doc.isPublished}, ${adminUserId}, now())
      ON CONFLICT DO NOTHING;
    `;
  }
  console.log(`   ✓ ${PUBLIC_DOCUMENTATIONS.length} galeri publik tersimpan.`);

  // ---------------------------------------------------------------------------
  // 13. TESTIMONIALS
  // ---------------------------------------------------------------------------
  console.log("\n⭐ 13. Seeding Testimoni Klien...");
  for (const t of TESTIMONIALS) {
    await sql`
      INSERT INTO testimonials (
        id, client_name, is_anonymous, anonymous_display, session_code, counselor_name,
        counselor_type, rating, quote_highlight, comment, topic, is_active, is_featured, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${t.clientName}, ${t.isAnonymous}, ${t.anonymousDisplay},
        ${t.sessionCode}, ${t.counselorName}, ${t.counselorType}, ${t.rating},
        ${t.quoteHighlight}, ${t.comment}, ${t.topic}, ${t.isActive}, ${t.isFeatured}, now(), now()
      ) ON CONFLICT DO NOTHING;
    `;
  }
  console.log(`   ✓ ${TESTIMONIALS.length} testimoni klien tersimpan.`);

  // ---------------------------------------------------------------------------
  // 14. REKAPITULASI KONDISI DATABASE
  // ---------------------------------------------------------------------------
  console.log("\n======================================================");
  console.log("📊 REKAPITULASI DATA SEED (14 TABEL)");
  console.log("======================================================");

  const ALL_TABLES = [
    "platform_settings",
    "platform_pricing",
    "specializations",
    "vouchers",
    "zoom_accounts",
    "counselors",
    "schedules",
    "counselor_applications",
    "screenings",
    "bookings",
    "transactions",
    "session_reports",
    "public_documentations",
    "testimonials",
  ];

  for (const table of ALL_TABLES) {
    const res = await sql.unsafe(`SELECT count(*) as count FROM "${table}"`);
    console.log(`   - ${table.padEnd(25)}: ${res[0].count} baris`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ MASTER SEEDING BERHASIL DISELESAIKAN DALAM ${elapsed} DETIK!`);
  console.log("======================================================");
  console.log("🔑 KREDENSIAL RESMI SIAP DIGUNAKAN DI /login:");
  for (const cred of ROLE_CREDENTIALS) {
    console.log(`   • [${cred.role.toUpperCase().padEnd(10)}]: ${cred.email.padEnd(25)} / ${cred.password}`);
  }
  console.log("======================================================\n");
}

runSeed()
  .catch((err) => {
    console.error("❌ Master Seeding Gagal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
