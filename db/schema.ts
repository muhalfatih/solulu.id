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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================================================
// ENUMS
// =============================================================================
export const roleEnum = pgEnum("role_enum", ["admin", "counselor"]);
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
// 1. ZOOM ACCOUNTS (MANAGED IN-APP WITH SAFETY LOCK)
// =============================================================================
export const zoomAccounts = pgTable("zoom_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Akun Zoom Pro 1"
  email: text("email").notNull().unique(),
  accountId: text("account_id").notNull(),
  clientId: text("client_id").notNull(),
  clientSecretEncrypted: text("client_secret_encrypted").notNull(), // AES-256-GCM encrypted
  cachedAccessToken: text("cached_access_token"), // Cache token S2S OAuth (TTL 3500s)
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
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
// 4. COUNSELOR APPLICATION & VERIFIED COUNSELORS
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
  agreedToTermsAt: timestamp("agreed_to_terms_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const counselors = pgTable("counselors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(), // Linked to Supabase Auth UID
  fullName: text("full_name").notNull(),
  title: text("title").notNull(), // e.g. "S.Psi", "M.Psi., Psikolog"
  counselorType: counselorTypeEnum("counselor_type").notNull(),
  bio: text("bio").notNull(),
  specializations: text("specializations").array(),
  avatarR2Url: text("avatar_r2_url"), // Bucket: solulu-public
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 5. SCHEDULES (SLOT MANAGEMENT - 90-MINUTE SESSIONS)
// =============================================================================
export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    counselorId: uuid("counselor_id")
      .references(() => counselors.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(), // Auto-computed startTime + 90 minutes
    status: scheduleStatusEnum("status").default("available").notNull(),
    reservedUntil: timestamp("reserved_until", { withTimezone: true }), // 17-minute hold window
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_schedule_lookup").on(table.date, table.startTime, table.status),
    index("idx_schedule_counselor").on(table.counselorId, table.date),
  ]
);

// =============================================================================
// 6. BOOKINGS (GUEST SESSIONS)
// =============================================================================
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  accessToken: text("access_token").notNull().unique(), // Nanoid(32) for URL /session/[token]

  // Patient Identity (Guest Checkout)
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  initialNotes: text("initial_notes"),

  scheduleId: uuid("schedule_id")
    .references(() => schedules.id)
    .notNull(),
  counselorId: uuid("counselor_id")
    .references(() => counselors.id)
    .notNull(),
  screeningId: uuid("screening_id").references(() => screenings.id), // Informative clinical screening

  // Triage / Screening Audit (Informative)
  bypassedRecommendation: boolean("bypassed_recommendation").default(false),
  waiverAcceptedAt: timestamp("waiver_accepted_at", { withTimezone: true }),

  // Zoom Meeting Info
  zoomAccountId: uuid("zoom_account_id").references(() => zoomAccounts.id),
  zoomMeetingId: text("zoom_meeting_id"),
  zoomJoinUrl: text("zoom_join_url"), // For Patient
  zoomStartUrl: text("zoom_start_url"), // For Counselor

  status: bookingStatusEnum("status").default("pending_payment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 7. TRANSACTIONS (XENDIT INTEGRATION)
// =============================================================================
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id)
    .notNull(),
  voucherId: uuid("voucher_id").references(() => vouchers.id), // Nullable FK for voucher tracking and rollback
  xenditInvoiceId: text("xendit_invoice_id").unique(), // Nullable for Manual Bank Transfer
  xenditPaymentUrl: text("xendit_payment_url"), // Nullable for Manual Bank Transfer
  paymentProvider: text("payment_provider").default("xendit").notNull(), // 'xendit' | 'manual'
  paymentMethod: text("payment_method"), // e.g. 'BCA Manual', 'Mandiri Manual', 'QRIS Statis'
  referenceNumber: text("reference_number"), // Manual transfer ref or Xendit external ID
  adminNotes: text("admin_notes"),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("PENDING").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// 8. CLINICAL SESSION REPORTS
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
  summary: text("summary").notNull(),
  actionPlan: text("action_plan").notNull(),
  followUpRecommendation: text("follow_up_recommendation"),
  attachmentR2Keys: text("attachment_r2_keys").array(), // Bucket: solulu-private
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
}));

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
