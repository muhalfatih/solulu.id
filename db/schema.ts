import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  time,
  date,
  integer,
  numeric,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================================================
// ENUMS
// =============================================================================
export const roleEnum = pgEnum("role_enum", [
  "superadmin",
  "admin",
  "operator",
  "counselor",
]);
export const scheduleModeEnum = pgEnum("schedule_mode_enum", [
  "manual",
  "automatic",
]);
export const counselorTypeEnum = pgEnum("counselor_type_enum", ["peer", "psychologist"]);
export const scheduleStatusEnum = pgEnum("schedule_status_enum", [
  "available",
  "reserved",
  "booked",
  "cancelled",
]);
export const bookingStatusEnum = pgEnum("booking_status_enum", [
  "pending_payment",
  "confirmed",
  "completed",
  "cancelled",
]);
export const transactionStatusEnum = pgEnum("transaction_status_enum", [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
]);
export const applicationStatusEnum = pgEnum("application_status_enum", [
  "pending",
  "approved",
  "rejected",
]);

// =============================================================================
// 1. ZOOM ACCOUNTS (4 PRO ACCOUNTS MANAGED IN-APP)
// =============================================================================
export const zoomAccounts = pgTable("zoom_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountNumber: integer("account_number").default(1).notNull(), // 1, 2, 3, or 4
  name: text("name").notNull(), // e.g., "Akun Zoom Pro 1"
  email: text("email").notNull().unique(),
  accountId: text("account_id").notNull(),
  clientId: text("client_id").notNull(),
  clientSecretEncrypted: text("client_secret_encrypted").notNull(), // AES-256-GCM encrypted
  cachedAccessToken: text("cached_access_token"), // Cache token S2S OAuth (TTL 3500s)
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  hostKey: text("host_key"), // 6-digit Host Key for Counselors to claim host
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 2. PRICING & VOUCHERS
// =============================================================================
export const platformPricing = pgTable("platform_pricing", {
  id: uuid("id").defaultRandom().primaryKey(),
  counselorType: counselorTypeEnum("counselor_type").notNull().unique(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  promoPrice: numeric("promo_price", { precision: 12, scale: 2 }),
  isSaleActive: boolean("is_sale_active").default(false).notNull(),
  allowVoucher: boolean("allow_voucher").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  isScreeningRequired: boolean("is_screening_required").default(false).notNull(),
  bookingCutoffHours: integer("booking_cutoff_hours").default(4).notNull(), // Cutoff H-4 jam pemesanan
  rescheduleCutoffHours: integer("reschedule_cutoff_hours").default(4).notNull(), // Cutoff H-4 jam reschedule
  paymentHoldMinutes: integer("payment_hold_minutes").default(15).notNull(), // Kunci jadwal 15-30 menit
  maxSlotQuota: integer("max_slot_quota").default(10).notNull(), // Maks. 10 sesi per slot
  minCounselorWeeklySlots: integer("min_counselor_weekly_slots").default(10).notNull(), // Min 10 sesi / minggu
  noShowTimeoutMinutes: integer("no_show_timeout_minutes").default(30).notNull(), // Batas tunggu hadir 30 menit
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).default("150000").notNull(),
  counselorExtendFeePer30Min: numeric("counselor_extend_fee_per_30_min", { precision: 12, scale: 2 }).default("35000").notNull(), // Rp 35k/30m
  psychologistExtendFeePer30Min: numeric("psychologist_extend_fee_per_30_min", { precision: 12, scale: 2 }).default("50000").notNull(), // Rp 50k/30m
  isManualPaymentEnabled: boolean("is_manual_payment_enabled").default(true).notNull(),
  manualPaymentInstructions: text("manual_payment_instructions").default("Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'fixed' | 'percentage'
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
  quota: integer("quota").notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 3. CLINICAL SCREENING (SRQ-20)
// =============================================================================
export const screenings = pgTable("screenings", {
  id: uuid("id").defaultRandom().primaryKey(),
  answers: jsonb("answers").notNull(), // Array of 20 boolean answers
  totalScore: integer("total_score").notNull(),
  hasSuicidalThoughts: boolean("has_suicidal_thoughts").notNull(), // Question 17
  recommendedType: counselorTypeEnum("recommended_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 4. COUNSELOR APPLICATION & VERIFIED COUNSELORS (21 DATA & 8 BERKAS)
// =============================================================================
export const counselorApplications = pgTable("counselor_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  counselorType: counselorTypeEnum("counselor_type").notNull(),
  bio: text("bio").notNull(),

  // Private Cloudflare R2 Keys (Bucket: solulu-private)
  cvR2Key: text("cv_r2_key").notNull(),
  ktpR2Key: text("ktp_r2_key").notNull(), // Mandatory for all applicants per spec
  diplomaR2Key: text("diploma_r2_key").notNull(), // Mandatory for all applicants per spec
  strR2Key: text("str_r2_key"), // Mandatory if psychologist

  status: applicationStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  agreedToTermsAt: timestamp("agreed_to_terms_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const counselors = pgTable("counselors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(), // Linked to Supabase Auth UID
  fullName: text("full_name").notNull(), // (1) Nama & Gelar
  title: text("title").notNull(), // Gelar e.g. "S.Psi", "M.Psi., Psikolog"
  email: text("email"), // (2) Email
  phone: text("phone"), // (3) Nomor WhatsApp
  domicile: text("domicile"), // (4) Domisili
  specializations: text("specializations").array(), // (5) Area Fokus & Spesialisasi
  education: text("education"), // (6) Riwayat Pendidikan
  experienceYears: integer("experience_years").default(1), // (7) Pengalaman (tahun)
  bio: text("bio").notNull(), // (8) Bio & Pendekatan Konseling
  himpsiNumber: text("himpsi_number"), // (9) Keanggotaan HIMPSI
  customFeeRate: numeric("custom_fee_rate", { precision: 12, scale: 2 }), // Tarif Khusus
  counselorCommissionRate: numeric("counselor_commission_rate", { precision: 12, scale: 2 }), // Komisi Konselor

  // Izin Praktik (4 Data)
  sippNumber: text("sipp_number"), // (10) Nomor SIPP / SILP / SIPPK
  sippExpiresAt: date("sipp_expires_at"), // (11) Tanggal Kadaluarsa SIPP
  strNumber: text("str_number"), // (12) Nomor STR / SSP
  strExpiresAt: date("str_expires_at"), // (13) Tanggal Kadaluarsa STR

  // Lampiran Berkas (8 File R2 Keys)
  avatarR2Url: text("avatar_r2_url"), // (14) Foto Formal (Bucket: solulu-public)
  ktpR2Key: text("ktp_r2_key"), // (15) Berkas KTP (Bucket: solulu-private)
  cvR2Key: text("cv_r2_key"), // (16) Berkas CV Terbaru (Bucket: solulu-private)
  diplomaS1R2Key: text("diploma_s1_r2_key"), // (17) Berkas Ijazah S1 Psikologi
  diplomaProfesiR2Key: text("diploma_profesi_r2_key"), // (18) Berkas Ijazah Profesi Psikolog
  strR2Key: text("str_r2_key"), // (19) Berkas STR / SSP
  sippR2Key: text("sipp_r2_key"), // (20) Berkas SIPP / SILP / SIPPK
  certificateR2Key: text("certificate_r2_key"), // (21) Berkas Sertifikat / Dokumen Pendukung (opsional)

  // Status & Operasional
  counselorType: counselorTypeEnum("counselor_type").notNull(),
  verificationStatus: text("verification_status").default("verified").notNull(), // 'pending' | 'verified' | 'rejected'
  weeklySlotTarget: integer("weekly_slot_target").default(10).notNull(), // Min 10 sesi/minggu
  scheduleMode: scheduleModeEnum("schedule_mode").default("manual").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 4B. SPECIALIZATIONS & FOCUS DIRECTORY (MANAGEABLE IN ADMIN)
// =============================================================================
export const specializations = pgTable("specializations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 4C. COUNSELOR WEEKLY TEMPLATES (RECURRING BLUEPRINT 7x7 SLOTS)
// =============================================================================
export const counselorWeeklyTemplates = pgTable(
  "counselor_weekly_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    counselorId: uuid("counselor_id")
      .references(() => counselors.id, { onDelete: "cascade" })
      .notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 1 (Senin) s/d 7 (Minggu)
    slotIndex: integer("slot_index").notNull(), // 1 s/d 7
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_counselor_weekly_template_unique").on(
      table.counselorId,
      table.dayOfWeek,
      table.slotIndex
    ),
    index("idx_counselor_weekly_template_counselor").on(table.counselorId),
  ]
);

// =============================================================================
// 5. SCHEDULES (7 FIXED 2-HOUR SLOTS DAILY)
// =============================================================================
export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    counselorId: uuid("counselor_id")
      .references(() => counselors.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    slotIndex: integer("slot_index").default(1).notNull(), // 1 s/d 7
    startTime: time("start_time").notNull(), // 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00
    endTime: time("end_time").notNull(), // 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
    status: scheduleStatusEnum("status").default("available").notNull(),
    isLeave: boolean("is_leave").default(false).notNull(), // Cuti / izin mingguan
    leaveReason: text("leave_reason"),
    reservedUntil: timestamp("reserved_until", { withTimezone: true }), // 15-30 menit hold window
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_schedule_lookup").on(table.date, table.slotIndex, table.status),
    index("idx_schedule_counselor").on(table.counselorId, table.date),
  ]
);

// =============================================================================
// 6. BOOKINGS (GUEST SESSIONS WITH 8 CLIENT DATA & ZOOM ALLOCATION)
// =============================================================================
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  accessToken: text("access_token").notNull().unique(), // Nanoid(32) for URL /session/[token]
  bookingCode: text("booking_code").notNull().default("SL-1001"), // e.g. "SL-4821" for Zoom display name

  // Client Identity (8 Data + Informed Consent)
  patientName: text("patient_name").notNull(), // (1) Nama Lengkap / Panggilan
  patientEmail: text("patient_email").notNull(), // (2) Email
  patientPhone: text("patient_phone").notNull(), // (3) Nomor WhatsApp
  gender: text("gender").default("Lainnya"), // (4) Jenis Kelamin
  age: integer("age").default(25), // (5) Umur
  domicile: text("domicile"), // (6) Domisili
  religion: text("religion"), // (7) Agama
  initialNotes: text("initial_notes"), // (8) Catatan / Keluhan Awal
  informedConsentAcceptedAt: timestamp("informed_consent_accepted_at", { withTimezone: true }), // Checkbox Persetujuan

  scheduleId: uuid("schedule_id")
    .references(() => schedules.id)
    .notNull(),
  counselorId: uuid("counselor_id")
    .references(() => counselors.id)
    .notNull(),
  screeningId: uuid("screening_id").references(() => screenings.id),

  // Triage / Screening Audit (Informative)
  bypassedRecommendation: boolean("bypassed_recommendation").default(false),
  waiverAcceptedAt: timestamp("waiver_accepted_at", { withTimezone: true }),

  // 4 Zoom Pro Accounts Dispatcher Info
  zoomAccountId: uuid("zoom_account_id").references(() => zoomAccounts.id),
  zoomAccountNumber: integer("zoom_account_number").default(1), // 1, 2, 3, or 4
  zoomAllocationMode: text("zoom_allocation_mode").default("standalone"), // 'standalone' | 'breakout_room'
  zoomMeetingId: text("zoom_meeting_id"),
  zoomJoinUrl: text("zoom_join_url"), // Permanent Link for Client
  zoomStartUrl: text("zoom_start_url"), // Link for Counselor / Host
  zoomHostKey: text("zoom_host_key"), // 6-digit Host Key for Counselor
  breakoutRoomName: text("breakout_room_name"), // e.g. "SL-4821 - Dimas (Konselor)"
  operatorAdmittedAt: timestamp("operator_admitted_at", { withTimezone: true }), // Time admitted to breakout room

  // Payment Method & Manual Verification (Booking Awal)
  paymentMethod: text("payment_method").default("xendit").notNull(), // 'xendit' | 'manual_bank_transfer'
  manualPaymentProofR2Key: text("manual_payment_proof_r2_key"),
  manualPaymentStatus: text("manual_payment_status").default("NONE"), // 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  // Extend Session (>90 Menit: Rp 35k Sebaya / Rp 50k Psikolog per 30 Menit)
  isExtended: boolean("is_extended").default(false).notNull(),
  extensionMinutes: integer("extension_minutes").default(0).notNull(), // 0, 30, 60
  extensionFee: numeric("extension_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  extensionPaymentStatus: text("extension_payment_status").default("NONE").notNull(), // 'NONE' | 'PENDING' | 'PAID'
  extensionPaymentMethod: text("extension_payment_method"), // 'xendit' | 'manual_bank_transfer'
  extensionProofR2Key: text("extension_proof_r2_key"),

  // Lifecycle & Reschedule
  status: bookingStatusEnum("status").default("pending_payment").notNull(),
  rescheduleCount: integer("reschedule_count").default(0).notNull(), // Maksimal 1 kali
  isFollowedUp: boolean("is_followed_up").default(false).notNull(), // Ditandai setelah Admin kirim WA link laporan
  followedUpAt: timestamp("followed_up_at", { withTimezone: true }),
  isNoShow: boolean("is_no_show").default(false).notNull(), // Toleransi hadir 30 menit
  noShowMarkedAt: timestamp("no_show_marked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 7. TRANSACTIONS (XENDIT & MANUAL INTEGRATION)
// =============================================================================
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id)
    .notNull(),
  voucherId: uuid("voucher_id").references(() => vouchers.id),
  xenditInvoiceId: text("xendit_invoice_id").unique(),
  xenditPaymentUrl: text("xendit_payment_url"),
  paymentProvider: text("payment_provider").default("xendit").notNull(), // 'xendit' | 'manual_bank_transfer'
  paymentMethod: text("payment_method"),
  referenceNumber: text("reference_number"),
  adminNotes: text("admin_notes"),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("PENDING").notNull(),
  manualProofR2Key: text("manual_proof_r2_key"),
  isManualVerification: boolean("is_manual_verification").default(false).notNull(),
  manualVerifiedBy: uuid("manual_verified_by"),
  manualVerifiedAt: timestamp("manual_verified_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 8. CLINICAL SESSION REPORTS (STRICT SEPARATION: CLIENT vs INTERNAL vs ADMIN)
// =============================================================================
export const sessionReports = pgTable("session_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id)
    .notNull()
    .unique(),
  counselorId: uuid("counselor_id")
    .references(() => counselors.id)
    .notNull(),

  // Client-Visible Fields (Tampil di Web & Cetak PDF Klien)
  mainIssue: text("main_issue").notNull().default("Konsultasi Emosional & Stres"), // Permasalahan Utama
  summary: text("summary").notNull(), // Ringkasan Dinamika Sesi
  actionPlan: text("action_plan"), // Saran / Tindak Lanjut (Opsional)
  followUpRecommendation: text("follow_up_recommendation"),

  // Confidential Fields (RAHASIA: Disembunyikan dari Klien & Admin)
  internalNotes: text("internal_notes"), // Catatan Internal Konselor

  // Internal Documentation Proof (>1 Foto Dokumentasi Bukti Sesi, Bukan untuk PDF Klien)
  attachmentR2Keys: text("attachment_r2_keys").array(), // Bucket: solulu-private

  // Floating Timer Metadata (Durasi riil sesi 0-120 menit)
  actualDurationMinutes: integer("actual_duration_minutes").default(90),
  timerStartedAt: timestamp("timer_started_at", { withTimezone: true }),
  timerStoppedAt: timestamp("timer_stopped_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 9. PUBLIC DOCUMENTATIONS (GALERI PRIVACY-FIRST)
// =============================================================================
export const publicDocumentations = pgTable("public_documentations", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageUrl: text("image_url").notNull(), // Bucket: solulu-public
  caption: text("caption").notNull(),
  isCensoredAndConsented: boolean("is_censored_and_consented").notNull(), // Legal audit requirement
  isPublished: boolean("is_published").default(true).notNull(),
  uploadedBy: uuid("uploaded_by").notNull(), // Admin User ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 10. TESTIMONIALS (CLIENT REVIEWS)
// =============================================================================
export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: text("client_name").notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  anonymousDisplay: text("anonymous_display").notNull(), // e.g. "R.A."
  sessionCode: text("session_code"),
  counselorName: text("counselor_name").notNull(),
  counselorType: text("counselor_type"), // 'Psikolog Klinis' | 'Konselor Sebaya'
  rating: integer("rating").default(5).notNull(),
  quoteHighlight: text("quote_highlight").notNull(),
  comment: text("comment").notNull(),
  topic: text("topic").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================
export const counselorsRelations = relations(counselors, ({ many }) => ({
  schedules: many(schedules),
  bookings: many(bookings),
  sessionReports: many(sessionReports),
  weeklyTemplates: many(counselorWeeklyTemplates),
}));

export const counselorWeeklyTemplatesRelations = relations(
  counselorWeeklyTemplates,
  ({ one }) => ({
    counselor: one(counselors, {
      fields: [counselorWeeklyTemplates.counselorId],
      references: [counselors.id],
    }),
  })
);

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  counselor: one(counselors, {
    fields: [schedules.counselorId],
    references: [counselors.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  schedule: one(schedules, {
    fields: [bookings.scheduleId],
    references: [schedules.id],
  }),
  counselor: one(counselors, {
    fields: [bookings.counselorId],
    references: [counselors.id],
  }),
  screening: one(screenings, {
    fields: [bookings.screeningId],
    references: [screenings.id],
  }),
  zoomAccount: one(zoomAccounts, {
    fields: [bookings.zoomAccountId],
    references: [zoomAccounts.id],
  }),
  sessionReport: one(sessionReports, {
    fields: [bookings.id],
    references: [sessionReports.bookingId],
  }),
  transaction: one(transactions, {
    fields: [bookings.id],
    references: [transactions.bookingId],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  booking: one(bookings, {
    fields: [transactions.bookingId],
    references: [bookings.id],
  }),
  voucher: one(vouchers, {
    fields: [transactions.voucherId],
    references: [vouchers.id],
  }),
}));

export const sessionReportsRelations = relations(sessionReports, ({ one }) => ({
  booking: one(bookings, {
    fields: [sessionReports.bookingId],
    references: [bookings.id],
  }),
  counselor: one(counselors, {
    fields: [sessionReports.counselorId],
    references: [counselors.id],
  }),
}));

// Type helpers inferred from schema
export type CounselorWeeklyTemplate = typeof counselorWeeklyTemplates.$inferSelect;
export type NewCounselorWeeklyTemplate = typeof counselorWeeklyTemplates.$inferInsert;
export type ScheduleMode = (typeof scheduleModeEnum.enumValues)[number];

