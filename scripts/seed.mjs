import postgres from "/home/muhalfatih/solulu-web/node_modules/postgres/src/index.js";
import fs from "fs";
import path from "path";
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
  connect_timeout: 10,
});

function getDateStr(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

async function seed() {
  console.log("🌱 Memulai seeding database Supabase PostgreSQL...");

  // 1. Platform Pricing
  console.log("1. Seeding Platform Pricing...");
  await sql`
    INSERT INTO platform_pricing (id, counselor_type, base_price, promo_price, is_sale_active, allow_voucher, updated_at)
    VALUES 
      (gen_random_uuid(), 'peer', 85000, 49000, true, false, now()),
      (gen_random_uuid(), 'psychologist', 150000, 129000, true, true, now())
    ON CONFLICT (counselor_type) DO UPDATE SET
      base_price = EXCLUDED.base_price,
      promo_price = EXCLUDED.promo_price,
      is_sale_active = EXCLUDED.is_sale_active,
      allow_voucher = EXCLUDED.allow_voucher,
      updated_at = now();
  `;

  // 2. Platform Settings
  console.log("2. Seeding Platform Settings...");
  await sql`
    INSERT INTO platform_settings (id, is_screening_required, updated_at)
    VALUES ('default', false, now())
    ON CONFLICT (id) DO UPDATE SET
      is_screening_required = EXCLUDED.is_screening_required,
      updated_at = now();
  `;

  // 3. Counselors & Schedules
  console.log("3. Seeding Counselors & Available Schedules...");
  const counselorsData = [
    {
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa",
      counselorType: "psychologist",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout). Berpengalaman lebih dari 5 tahun mendampingi pasien.",
      specializations: ["Kecemasan (Anxiety)", "Depresi", "Trauma", "Burnout Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
      isActive: true,
      slots: [
        { dayOffset: 1, startTime: "09:00:00", endTime: "10:30:00" },
        { dayOffset: 1, startTime: "19:00:00", endTime: "20:30:00" },
        { dayOffset: 2, startTime: "13:30:00", endTime: "15:00:00" },
        { dayOffset: 3, startTime: "10:00:00", endTime: "11:30:00" },
      ]
    },
    {
      fullName: "Rian Hidayat, S.Psi",
      title: "Konselor Sebaya Senior",
      counselorType: "peer",
      bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
      specializations: ["Quarter-life Crisis", "Stres Kuliah & Kerja", "Relasi Asmara", "Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
      isActive: true,
      slots: [
        { dayOffset: 1, startTime: "11:00:00", endTime: "12:30:00" },
        { dayOffset: 1, startTime: "15:30:00", endTime: "17:00:00" },
        { dayOffset: 2, startTime: "19:00:00", endTime: "20:30:00" },
        { dayOffset: 3, startTime: "14:00:00", endTime: "15:30:00" },
      ]
    },
    {
      fullName: "Dr. Nadia Larasati, M.Psi",
      title: "Psikolog Klinis Dewasa",
      counselorType: "psychologist",
      bio: "Pendekatan berbasis bukti ilmiah untuk penanganan depresi ringan hingga sedang, pemulihan luka masa kecil, serta peningkatan self-esteem dan penerimaan diri.",
      specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri", "Regulasi Emosi"],
      avatarR2Url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
      isActive: true,
      slots: [
        { dayOffset: 2, startTime: "10:00:00", endTime: "11:30:00" },
        { dayOffset: 2, startTime: "14:00:00", endTime: "15:30:00" },
        { dayOffset: 3, startTime: "16:00:00", endTime: "17:30:00" },
      ]
    },
    {
      fullName: "Nabila Safitri, S.Psi",
      title: "Konselor Sebaya Remaja",
      counselorType: "peer",
      bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
      specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
      avatarR2Url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600",
      isActive: true,
      slots: [
        { dayOffset: 1, startTime: "13:30:00", endTime: "15:00:00" },
        { dayOffset: 2, startTime: "16:00:00", endTime: "17:30:00" },
        { dayOffset: 3, startTime: "19:00:00", endTime: "20:30:00" },
      ]
    }
  ];

  for (const c of counselorsData) {
    const existing = await sql`
      SELECT id FROM counselors WHERE full_name = ${c.fullName} LIMIT 1
    `;
    let counselorId;
    if (existing.length > 0) {
      counselorId = existing[0].id;
      console.log(`   - Konselor "${c.fullName}" sudah ada (ID: ${counselorId})`);
    } else {
      const dummyUserId = crypto.randomUUID();
      const [inserted] = await sql`
        INSERT INTO counselors (
          id, user_id, full_name, title, counselor_type, bio, specializations, avatar_r2_url, is_active, created_at
        ) VALUES (
          gen_random_uuid(), ${dummyUserId}, ${c.fullName}, ${c.title}, ${c.counselorType},
          ${c.bio}, ${c.specializations}, ${c.avatarR2Url}, ${c.isActive}, now()
        ) RETURNING id
      `;
      counselorId = inserted.id;
      console.log(`   + Menambahkan konselor "${c.fullName}" (ID: ${counselorId})`);
    }

    // Insert schedules
    for (const s of c.slots) {
      const slotDate = getDateStr(s.dayOffset);
      const slotExists = await sql`
        SELECT id FROM schedules 
        WHERE counselor_id = ${counselorId} AND date = ${slotDate} AND start_time = ${s.startTime}
      `;
      if (slotExists.length === 0) {
        await sql`
          INSERT INTO schedules (id, counselor_id, date, start_time, end_time, status, created_at)
          VALUES (gen_random_uuid(), ${counselorId}, ${slotDate}, ${s.startTime}, ${s.endTime}, 'available', now())
        `;
      }
    }
  }

  // 4. Testimonials (Synchronized with Public Frontend & Homepage)
  console.log("4. Seeding Testimonials...");
  const testimonials = [
    {
      clientName: "Mahasiswa, 21 tahun",
      isAnonymous: true,
      anonymousDisplay: "Mahasiswa, 21 tahun",
      sessionCode: "SES-9821",
      counselorName: "Sarah Annisa, M.Psi., Psikolog",
      counselorType: "Psikolog Klinis",
      rating: 5,
      quoteHighlight: "Tidak merasa sendirian lagi",
      comment: "Awalnya sempat ragu mau cerita karena takut dinilai lebay. Tapi konselornya sangat menenangkan sejak menit awal, dan durasi 90 menit beneran bikin lega tanpa rasa diburu-buru.",
      topic: "Kecemasan Kuliah & Ujian",
      isActive: true,
      isFeatured: true,
    },
    {
      clientName: "Karyawan Swasta, 26 tahun",
      isAnonymous: true,
      anonymousDisplay: "Karyawan Swasta, 26 tahun",
      sessionCode: "SES-8412",
      counselorName: "Rian Hidayat, S.Psi",
      counselorType: "Konselor Sebaya",
      rating: 5,
      quoteHighlight: "Punya arah keluar dari masalah",
      comment: "Tekanan kerja sempat bikin kepala buntu banget. Lewat sesi ini, beban pikiran pelan-pelan diurai jadi langkah nyata yang masuk akal buat langsung saya jalanin.",
      topic: "Capek Kerja & Bingung Arah",
      isActive: true,
      isFeatured: true,
    },
    {
      clientName: "Lulusan Baru Kuliah, 23 tahun",
      isAnonymous: true,
      anonymousDisplay: "Lulusan Baru Kuliah, 23 tahun",
      sessionCode: "SES-7193",
      counselorName: "Dr. Nadia Larasati, M.Psi",
      counselorType: "Psikolog Klinis",
      rating: 5,
      quoteHighlight: "Punya cara tenang saat cemas datang",
      comment: "Konselingnya terarah dan bikin adem. Kami latihan cara menenangkan diri yang langsung ngebantu waktu rasa cemas tiba-tiba muncul di malam hari.",
      topic: "Pikiran Cemas & Berputar",
      isActive: true,
      isFeatured: true,
    },
    {
      clientName: "Clara Wijaya",
      isAnonymous: true,
      anonymousDisplay: "Clara, 24 (Freelancer)",
      sessionCode: "SES-6632",
      counselorName: "Nabila Safitri, S.Psi",
      counselorType: "Konselor Sebaya",
      rating: 5,
      quoteHighlight: "Tempat aman untuk bercerita tanpa takut merasa dihakimi.",
      comment: "Privasi benar-benar terjaga tanpa perlu bikin akun yang ribet. Sesi 90 menit sangat cukup untuk mencurahkan semua beban pikiran.",
      topic: "Keluarga & Relasi Emosional",
      isActive: true,
      isFeatured: false,
    }
  ];

  for (const t of testimonials) {
    const exists = await sql`
      SELECT id FROM testimonials WHERE session_code = ${t.sessionCode} LIMIT 1
    `;
    if (exists.length === 0) {
      await sql`
        INSERT INTO testimonials (
          id, client_name, is_anonymous, anonymous_display, session_code,
          counselor_name, counselor_type, rating, quote_highlight,
          comment, topic, is_active, is_featured, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${t.clientName}, ${t.isAnonymous}, ${t.anonymousDisplay},
          ${t.sessionCode}, ${t.counselorName}, ${t.counselorType}, ${t.rating},
          ${t.quoteHighlight}, ${t.comment}, ${t.topic}, ${t.isActive}, ${t.isFeatured},
          now(), now()
        )
      `;
    }
  }

  // 5. Zoom Accounts
  console.log("5. Seeding Zoom Accounts (Safety Lock ready)...");
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

  const zoomAccountsList = [
    {
      name: "Akun Zoom Pro 1",
      email: "zoom1@solulu.id",
      accountId: "zm_acc_pro_1",
      clientId: "zm_cli_99281726",
      clientSecret: "zm_sec_live_018293819283",
      isActive: true,
    },
    {
      name: "Akun Zoom Pro 2",
      email: "zoom2@solulu.id",
      accountId: "zm_acc_pro_2",
      clientId: "zm_cli_88172635",
      clientSecret: "zm_sec_live_983719283712",
      isActive: true,
    },
  ];

  for (const acc of zoomAccountsList) {
    const encSecret = encryptSecret(acc.clientSecret);
    await sql`
      INSERT INTO zoom_accounts (id, name, email, account_id, client_id, client_secret_encrypted, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), ${acc.name}, ${acc.email}, ${acc.accountId}, ${acc.clientId}, ${encSecret}, ${acc.isActive}, now(), now())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        account_id = EXCLUDED.account_id,
        client_id = EXCLUDED.client_id,
        client_secret_encrypted = EXCLUDED.client_secret_encrypted,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    `;
  }

  // 6. Public Documentations (Gallery)
  console.log("6. Seeding Public Documentations (Galeri)...");
  const galleryDocs = [
    {
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
      caption: "Sesi Webinar Edukasi Kesehatan Mental Bersama Psikolog Klinis Solulu",
      isCensoredAndConsented: true,
      isPublished: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
      caption: "Workshop Manajemen Stres dan Regulasi Emosi untuk Mahasiswa Akhir",
      isCensoredAndConsented: true,
      isPublished: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
      caption: "Simulasi Konseling Empatik dan Peer Support Training Komunitas",
      isCensoredAndConsented: true,
      isPublished: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
      caption: "Diskusi Terbuka Pencegahan Burnout dan Self-Care Lingkungan Kampus",
      isCensoredAndConsented: true,
      isPublished: true,
    },
  ];

  for (const doc of galleryDocs) {
    const existing = await sql`
      SELECT id FROM public_documentations WHERE image_url = ${doc.imageUrl} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO public_documentations (id, image_url, caption, is_censored_and_consented, is_published, uploaded_by, created_at)
        VALUES (gen_random_uuid(), ${doc.imageUrl}, ${doc.caption}, ${doc.isCensoredAndConsented}, ${doc.isPublished}, gen_random_uuid(), now())
      `;
    }
  }

  // 7. Counselor Applications (Pendaftar Baru)
  console.log("7. Seeding Counselor Applications...");
  const sampleApplicants = [
    {
      fullName: "Maya Pratiwi, M.Psi., Psikolog",
      email: "maya.pratiwi@example.com",
      phone: "0813-9876-5432",
      counselorType: "psychologist",
      bio: "Lulusan Magister Profesi Psikologi Klinis Universitas Indonesia dengan peminatan kecemasan, gangguan mood, dan konseling pra-nikah.",
      cvR2Key: "counselor-applications/cv/maya-cv.pdf",
      ktpR2Key: "counselor-applications/ktp/maya-ktp.jpg",
      diplomaR2Key: "counselor-applications/diploma/maya-ijazah.pdf",
      strR2Key: "counselor-applications/str/maya-str.pdf",
    },
    {
      fullName: "Budi Santoso, S.Psi",
      email: "budi.santoso@example.com",
      phone: "0812-7766-5544",
      counselorType: "peer",
      bio: "Fasilitator peer support terlatih berpengalaman 2 tahun mendampingi mahasiswa dalam manajemen stres akademik dan adaptasi sosial.",
      cvR2Key: "counselor-applications/cv/budi-cv.pdf",
      ktpR2Key: "counselor-applications/ktp/budi-ktp.jpg",
      diplomaR2Key: "counselor-applications/diploma/budi-ijazah.pdf",
      strR2Key: null,
    },
  ];

  for (const app of sampleApplicants) {
    const exists = await sql`
      SELECT id FROM counselor_applications WHERE email = ${app.email} LIMIT 1
    `;
    if (exists.length === 0) {
      await sql`
        INSERT INTO counselor_applications (
          id, full_name, email, phone, counselor_type, bio,
          cv_r2_key, ktp_r2_key, diploma_r2_key, str_r2_key,
          status, agreed_to_terms_at, created_at
        ) VALUES (
          gen_random_uuid(), ${app.fullName}, ${app.email}, ${app.phone},
          ${app.counselorType}, ${app.bio}, ${app.cvR2Key}, ${app.ktpR2Key},
          ${app.diplomaR2Key}, ${app.strR2Key}, 'pending', now(), now()
        )
      `;
    }
  }

  console.log("✅ Seeding selesai! Database Supabase PostgreSQL sekarang terisi data nyata lengkap.");
}

seed()
  .catch((err) => {
    console.error("❌ Seeding gagal:", err);
  })
  .finally(async () => {
    await sql.end();
  });

