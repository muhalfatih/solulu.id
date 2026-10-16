# Spec 0003: Master SOP Counseling System Revamp (7 Fixed Slots, 4 Zoom Hybrid Dispatcher, 4-Role RBAC, Dual Payments & Decoupled Payroll)

Label: `ready-for-agent`  
Branch: `feat/master-counseling-sop-revamp`  
Supersedes: `docs/specs/0002-admin-counselors-and-manual-booking.md`  
Architecture Reference: `docs/adr/0005-master-sop-fixed-slots-4-zoom-dispatcher-and-rbac.md` & `CONTEXT.md`

---

## Problem Statement

Platform Solulu saat ini beroperasi dengan model penjadwalan dinamis 90 menit dan penjagaan konkurensi 2 akun Zoom yang fleksibel namun rentan terhadap *race condition*, ketidakteraturan jadwal kerja mitra konselor, serta hambatan operasional klinik:
1. **Ketiadaan Jadwal Operasional Baku**: Sesi konseling bebas dimulai di sembarang jam, menyulitkan konselor mengatur komitmen mingguan dan membingungkan klien saat memilih jadwal.
2. **Keterbatasan Kapasitas Zoom**: Hanya memiliki 2 akun Zoom mandiri tanpa pengelolaan ruang bersama, sehingga membatasi kapasitas maksimal klinik pada jam-jam sibuk (*peak hours*).
3. **Pencampuran Hak Akses & Pelanggaran Privasi Medis**: Admin sebelumnya memiliki akses tidak terbatas ke catatan sesi, sedangkan konselor dan operator tidak memiliki batas kewenangan yang tegas. Laporan sesi juga belum memisahkan antara bagian yang boleh dibaca klien vs catatan rahasia medis konselor.
4. **Halaman Backend Lama yang Usang (*Legacy UI*)**: Halaman di `app/admin` dan `app/counselor` dibangun dengan CSS manual/hardcoded yang tidak konsisten, minim aksesibilitas, dan sulit dipelihara.
5. **Ketiadaan Mekanisme Extend Session & Pembayaran Fleksibel**: Sesi yang melebihi 90 menit belum memiliki aturan tagihan terstruktur per blok waktu, dan opsi pembayaran terbatas pada gateway otomatis tanpa dukungan transfer bank manual.
6. **Kebutuhan Audit Finansial yang Terpisah dari Penggajian Otomatis**: Manajemen klinik membutuhkan laporan rekapitulasi sesi dan pendapatan yang transparan dan dapat diekspor, tanpa membebani sistem dengan mesin penggajian internal yang rumit (*payroll decoupled*).

---

## Solution

Mengimplementasikan perombakan arsitektur sistem konseling menyeluruh berbasis **Dokumen Master SOP Sistem Konseling** dengan standar antarmuka **Shadcn UI App Shell** dan prinsip **Database-First & Zero-Mock Policy**:

1. **Standarisasi 7 Slot Harian Tetap (08.00–22.00 WIB)**:
   - Sesi terbagi ke dalam 7 slot 2 jam baku: Slot 1 (08.00–10.00), Slot 2 (10.00–12.00), Slot 3 (12.00–14.00), Slot 4 (14.00–16.00), Slot 5 (16.00–18.00), Slot 6 (18.00–20.00), dan Slot 7 (20.00–22.00 WIB).
   - Penguncian pemesanan baru dan ubah jadwal mandiri pada **Cutoff H-4 Jam** sebelum slot dimulai.
   - Kuota default maksimal 10 sesi bersamaan per slot.

2. **Dispatcher 4 Akun Zoom Pro Hybrid**:
   - **Sesi 1–3**: Menggunakan Akun Zoom 1, 2, dan 3 (mandiri via *Join Before Host*, konselor memegang 6-digit *Host Key*).
   - **Sesi 4 (jika total slot ≤ 4)**: Menggunakan Akun Zoom 4 secara mandiri tanpa operator.
   - **Sesi 4–10 (jika total slot > 4)**: Operator bertindak sebagai Host di Akun Zoom 4, memandu *Waiting Room* dan melakukan pemindahan 1-on-1 ke *Breakout Room* privat (`SL-XXXX - Nama Konselor`) dilengkapi fitur **1-Click Copy Room Name**.
   - Tautan rapat yang diterima klien bersifat permanen sejak pesanan terkonfirmasi.

3. **Model 4 Peran Internal (RBAC) & Privasi Laporan Klinis**:
   - **Superadmin**: Mengatur parameter sistem, kuota slot, tarif extend, dan 4 akun Zoom.
   - **Admin**: Memverifikasi 21 profil data & 8 berkas legalitas konselor (pantau STR/SIPP), memverifikasi transfer bank manual, dan memantau laporan rekapitulasi. Dilarang membaca catatan klinis rahasia.
   - **Operator**: Memantau jadwal harian pasca H-4 jam, mengirim link Zoom pengingat via WhatsApp, memandu *Waiting Room* & *Breakout Room*. Bebas akses dari laporan medis dan transaksi keuangan.
   - **Mitra Konselor**: Mengisi komitmen minimal 10 sesi/minggu, menyalakan *Timer Melayang* (peringatan 85/90/120 menit), dan mengisi Laporan Sesi (*Permasalahan Utama*, *Ringkasan Dinamika Sesi*, *Saran*, *Catatan Internal Rahasia*, dan *Bukti Foto Kehadiran*).

4. **Aturan Perpanjangan Sesi (Extend Session > 90 Menit)**:
   - Dihitung per blok 30 menit dengan batas toleransi (*grace period*) 5 menit (menit 0–95 bebas biaya tambahan; menit 96–120 dihitung 1 blok 30 menit).
   - Tarif default: **Rp 35.000 / 30m** untuk Konselor Sebaya dan **Rp 50.000 / 30m** untuk Psikolog Klinis (dapat diubah dinamis oleh Superadmin).

5. **Dukungan Pembayaran Ganda (Dual Payment)**:
   - Mendukung **Otomatis Xendit** (QRIS/VA) dan **Transfer Bank Manual** (BCA Klinik) baik pada saat *booking awal* maupun saat *pelunasan extend session*.
   - Konsol Admin dilengkapi antrean verifikasi bukti transfer manual dengan tombol aksi *Konfirmasi Lunas* dan *Tolak*.

6. **Laporan Audit Keuangan & Rekapitulasi Sesi (*Payroll Decoupled*)**:
   - Sistem tidak menjalankan mesin kalkulasi penggajian otomatis internal.
   - Menyajikan *Ledger Table* audit transparan yang merinci durasi riil sesi, biaya dasar, biaya extend, kanal pembayaran, dan status sesi, yang dapat diekspor ke format CSV untuk perhitungan komisi manajemen secara terpisah.

7. **Rekonstruksi Antarmuka Backend Menggunakan Shadcn UI**:
   - Mengeliminasi kode backend lama di `app/admin` dan `app/counselor`.
   - Mengimplementasikan tata letak modern berbasis `SidebarProvider`, `Sidebar`, `Breadcrumbs`, `Table`, `Dialog`, `Badge`, `Card`, dan `Sonner`.

---

## User Stories

### A. Alur Pemesanan & Pembayaran Klien (Guest Experience)

1. As a Klien, I want to view available counseling sessions grouped strictly by the 7 Fixed Slots (08.00–22.00 WIB), so that I can easily plan my schedule within predictable 2-hour windows.
2. As a Klien, I want slots starting in less than 4 hours to be locked from booking, so that the clinic has guaranteed operational certainty to assign rooms.
3. As a Klien, I want to choose between automated payment (Xendit QRIS/VA) and Manual Bank Transfer (BCA) during booking checkout, so that I can pay using my preferred payment channel.
4. As a Klien choosing Manual Bank Transfer, I want clear bank account details (BCA 123-456-7890 a.n. Solulu Mental Health) and an upload box for my transfer receipt, so that Admin can verify my payment.
5. As a Klien, I want my selected schedule slot to be temporarily reserved for 15–30 minutes while I complete payment, so that no other client can claim the same slot concurrently.
6. As a Klien, I want to receive a permanent unique Booking Code (e.g. `SL-6001`) and session access token upon payment confirmation, so that I can access my private room at `/session/[token]` without needing an account.
7. As a Klien, I want clear instructions on `/session/[token]` to set my Zoom Display Name to `[Kode Booking] - [Nama Panggilan]`, so that the clinic Operator can immediately route me from the Waiting Room to my counselor.
8. As a Klien, I want to be able to reschedule my session at least 4 hours before the slot begins (maximum 1 time), so that I can accommodate unforeseen schedule conflicts fairly.
9. As a Klien who experienced an extended session (>90m), I want to receive an extension payment invoice payable via Xendit or Manual Bank Transfer, so that I can settle the extra time honorably.
10. As a Klien, I want to verify my registered WhatsApp phone number on `/session/[token]` to unlock my official Session Report, so that my clinical summary is protected from unauthorized access.
11. As a Klien, I want to read the "Permasalahan Utama", "Ringkasan Dinamika Sesi", and "Saran / Tindak Lanjut" on my unlocked report, so that I understand the professional advice given by my counselor.
12. As a Klien, I want a clean print-optimized view (`@media print`) to save my report as a PDF, so that I have a permanent personal record of my counseling journey.

### B. Mitra Konselor (Counselor Portal & Clinical Workflow)

13. As a Mitra Konselor, I want a unified dashboard at `/counselor/dashboard` showing my upcoming sessions for today, so that I know exactly who I am counseling and when.
14. As a Mitra Konselor, I want to see the 6-digit Host Key for my assigned Zoom account on my session card, so that I can claim Host control inside the Zoom client if operating in standalone mode.
15. As a Mitra Konselor, I want a sticky Floating Timer widget that starts when I begin a session, so that I can maintain clinical time discipline without looking at an external clock.
16. As a Mitra Konselor, I want the Floating Timer to alert me at minute 85 (5 minutes before target) and minute 90, so that I can smoothly wrap up the session.
17. As a Mitra Konselor, I want the Floating Timer to indicate a 5-minute grace period (minutes 90–95) where no extension fee is charged, so that closing remarks are not penalized.
18. As a Mitra Konselor, I want the Floating Timer to automatically calculate the 30-minute extension fee at minute 96 (Rp 35.000 for Peer Counselor, Rp 50.000 for Psychologist), so that extension fees are accurately billed.
19. As a Mitra Konselor, I want the Floating Timer to automatically stop and turn red at minute 120 (maximum slot limit), so that neither client nor counselor exceeds room capacity.
20. As a Mitra Konselor, I want a web form to submit my post-session report directly without uploading PDF files, so that clinical documentation is structured and immediate.
21. As a Mitra Konselor, I want a mandatory field for "Permasalahan Utama (*Main Issue*)", so that the core focus of the psychological intervention is explicitly recorded.
22. As a Mitra Konselor, I want separate text fields for "Ringkasan Dinamika Sesi" and "Saran / Tindak Lanjut" that are visible to the client, so that I can provide actionable guidance.
23. As a Mitra Konselor, I want a strictly confidential "Catatan Internal Konselor" field that is hidden from both the client and the admin, so that sensitive diagnostic notes remain protected by medical secrecy.
24. As a Mitra Konselor, I want to upload attendance proof screenshot(s), so that my session completion is validated internally for management reporting.
25. As a Mitra Konselor, I want a weekly schedule commitment manager at `/counselor/schedule` to open at least 10 slots per week, so that I meet the clinic's minimum partnership quota.
26. As a Mitra Konselor, I want to submit leave/permission requests for specific days or recurring weekly slots, so that clients cannot book slots when I am unavailable.

### C. Operator Console (Zoom Dispatcher & Breakout Room Coordination)

27. As an Operator, I want a dedicated console at `/operator` showing the 7 Fixed Slots for the current day, so that I can monitor clinic capacity in real time.
28. As an Operator, I want each slot to display an automatic badge indicating whether it is running in Standalone Mode (≤4 sessions) or Breakout Mode (>4 sessions), so that I know whether my active presence as Host is required.
29. As an Operator, I want a 1-Click Copy icon next to every Breakout Room name (`SL-XXXX - Nama Konselor`), so that I can paste it instantly into the Zoom desktop client without typing.
30. As an Operator, I want a "Batch Copy All Breakout Names" button for a given slot, so that I can prepare all rooms before participants arrive.
31. As an Operator, I want a 1-click button to copy a pre-formatted chat message for Waiting Room participants whose names are invalid, so that I can guide them quickly to rename themselves.
32. As an Operator, I want an "Admit" button next to each client in Breakout Mode that marks them as admitted in the real database, so that the team can track live attendance status.
33. As an Operator, I want my access strictly isolated so that I cannot read clinical notes or financial transactions, ensuring HIPAA/medical privacy compliance.

### D. Admin Console (Verification, Manual Payments & Financial Reporting)

34. As an Admin, I want an App Shell with a Shadcn collapsible Sidebar at `/admin`, so that I have a standard, modern navigation across all operational sub-pages.
35. As an Admin, I want a dedicated verification table at `/admin/counselors` displaying all 21 profile fields and 8 Cloudflare R2 compliance attachments, so that I can thoroughly vet counselors.
36. As an Admin, I want automated warning badges for psychologists whose STR or SIPP license expires in less than 60 days, so that no counselor practices with expired legal credentials.
37. As an Admin, I want a dedicated queue at `/admin/manual-payments` showing all pending manual bank transfers for both initial bookings and extend sessions, so that I can review transfer slips against bank mutation.
38. As an Admin, I want 1-click "Konfirmasi Lunas" and "Tolak" actions for manual payments, so that valid bookings are instantly confirmed into the schedule.
39. As an Admin, I want a comprehensive "Laporan Sesi & Keuangan" ledger table at `/admin/reports/finance` showing booking codes, client details, counselor credentials, actual session duration, base fee, extend fee, payment method, and completion status.
40. As an Admin, I want an "Ekspor CSV Rekap" button on the financial ledger, so that the clinic management can calculate counselor commissions externally (*decoupled payroll*).
41. As an Admin, I want a 1-click WhatsApp follow-up button (`wa.me`) next to completed sessions to send the report link to the client and automatically mark the session as `isFollowedUp: true`.
42. As an Admin, I want to mark a booking as No-Show if the client fails to enter Zoom within 30 minutes of slot start, so that the slot is archived without penalizing the counselor.
43. As an Admin, I want my access restricted so that I can see the completion status and documentation photos of session reports, but cannot read the counselor's confidential clinical notes.

### E. Superadmin Console (System Configuration & Zoom Integration)

44. As a Superadmin, I want a central settings panel at `/admin/settings` to adjust core parameters: Cutoff Pemesanan Baru (H-4 jam), Cutoff Reschedule (H-4 jam), Payment Hold Duration (15–30 menit), Kuota Maksimal per Slot (10 sesi), and Toleransi No-Show (30 menit).
45. As a Superadmin, I want inputs to set the default Extend Session Fee per 30 minutes separately for Konselor Sebaya (default Rp 35.000) and Psikolog Klinis (default Rp 50.000), so that pricing changes can be executed without code redeployments.
46. As a Superadmin, I want a toggle to enable/disable Manual Bank Transfer and a textarea to edit the clinic bank account instructions, so that payment instructions are always up to date.
47. As a Superadmin, I want a management panel for the 4 Zoom Pro accounts at `/admin/zoom` displaying account numbers, email credentials, OAuth status, and 6-digit Host Keys, so that video infrastructure is completely visible.

---

## Implementation Decisions

### 1. Unified App Shell Architecture (Eliminating Legacy Backend UI)
- **Elimination of Legacy Code**: All old pages in `app/admin` and `app/counselor` with custom, non-standard CSS are removed or rewritten.
- **Shadcn UI Standard**:
  - Main portal layout uses `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, and `SidebarFooter`.
  - Header displays dynamic `Breadcrumb` trail, notification badge, and role avatar.
  - Interactive states use `Dialog`, `Sheet`, `Table`, `Badge`, `Card`, `Input`, `Textarea`, `Tabs`, and `Sonner` toasts.

### 2. Route Hierarchy & RBAC Enforcement

```
app/
├── (public)/                       # Landing page, catalog, /book, /apply, /terms, /privacy
├── session/
│   └── [token]/
│       ├── page.tsx                # Guest Session Room (Timer, Zoom Link, Dual Payment, WA Report Gate)
│       └── actions.ts              # Guest actions (WA verification, manual payment slip upload)
├── operator/
│   ├── layout.tsx                  # Dedicated Operator minimal layout
│   └── page.tsx                    # 7-Slot Matrix, Zoom 4 Dispatcher, 1-Click Copy, Waiting Room Guide
├── counselor/
│   ├── layout.tsx                  # Counselor App Shell (Sidebar)
│   ├── dashboard/page.tsx          # Today's Sessions, Host Key, Floating Timer
│   ├── schedule/page.tsx           # Weekly 7-Slot Commitment (Min 10) & Leave Requests
│   ├── sessions/
│   │   └── [id]/report/page.tsx    # Clinical Session Report Form (Main Issue, Dynamic, Confidential)
│   └── profile/page.tsx            # 21-Data Profile, Avatar R2 upload, Bio, Specializations
└── admin/
    ├── layout.tsx                  # Admin & Superadmin App Shell (Sidebar with Collapsible Sections)
    ├── dashboard/page.tsx          # High-level Metrics, Today's Slot Overview
    ├── counselors/
    │   ├── page.tsx                # Verified Counselors Table with STR/SIPP Expiry Radar
    │   └── [id]/page.tsx           # Full 21-Data & 8 R2 Files Inspector
    ├── manual-payments/page.tsx    # Manual Bank Transfer Verification Queue (Confirm/Reject)
    ├── reports/
    │   └── finance/page.tsx        # Comprehensive Session & Financial Ledger (Export CSV, Decoupled Payroll)
    ├── bookings/page.tsx           # All Bookings, Reschedule Helper, No-Show Marker
    └── settings/page.tsx           # Superadmin System Parameters, Extend Fees, 4 Zoom Accounts
```

### 3. Database Schema & Data Contracts (Supabase PostgreSQL via Drizzle ORM)

All data structures are implemented directly in `db/schema.ts` and migrated to PostgreSQL:

```typescript
// Platform Settings (Superadmin Parameter Control)
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  isScreeningRequired: boolean("is_screening_required").default(false).notNull(),
  bookingCutoffHours: integer("booking_cutoff_hours").default(4).notNull(),
  rescheduleCutoffHours: integer("reschedule_cutoff_hours").default(4).notNull(),
  paymentHoldMinutes: integer("payment_hold_minutes").default(15).notNull(),
  maxSlotQuota: integer("max_slot_quota").default(10).notNull(),
  minCounselorWeeklySlots: integer("min_counselor_weekly_slots").default(10).notNull(),
  noShowTimeoutMinutes: integer("no_show_timeout_minutes").default(30).notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).default("150000").notNull(),
  counselorExtendFeePer30Min: numeric("counselor_extend_fee_per_30_min", { precision: 12, scale: 2 }).default("35000").notNull(),
  psychologistExtendFeePer30Min: numeric("psychologist_extend_fee_per_30_min", { precision: 12, scale: 2 }).default("50000").notNull(),
  isManualPaymentEnabled: boolean("is_manual_payment_enabled").default(true).notNull(),
  manualPaymentInstructions: text("manual_payment_instructions").default("Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Bookings (7 Slots, Zoom Dispatcher, Dual Payments & Extensions)
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  accessToken: text("access_token").notNull().unique(),
  bookingCode: text("booking_code").notNull(), // SL-XXXX
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  gender: text("gender").default("Lainnya"),
  age: integer("age").default(25),
  domicile: text("domicile"),
  religion: text("religion"),
  initialNotes: text("initial_notes"),
  scheduleId: uuid("schedule_id").references(() => schedules.id).notNull(),
  counselorId: uuid("counselor_id").references(() => counselors.id).notNull(),
  zoomAccountId: uuid("zoom_account_id").references(() => zoomAccounts.id),
  zoomAccountNumber: integer("zoom_account_number").default(1),
  zoomAllocationMode: text("zoom_allocation_mode").default("standalone"), // 'standalone' | 'breakout_room'
  zoomJoinUrl: text("zoom_join_url"),
  zoomStartUrl: text("zoom_start_url"),
  zoomHostKey: text("zoom_host_key"),
  breakoutRoomName: text("breakout_room_name"),
  operatorAdmittedAt: timestamp("operator_admitted_at", { withTimezone: true }),
  
  // Dual Payment & Manual Verification
  paymentMethod: text("payment_method").default("xendit").notNull(), // 'xendit' | 'manual_bank_transfer'
  manualPaymentProofR2Key: text("manual_payment_proof_r2_key"),
  manualPaymentStatus: text("manual_payment_status").default("NONE"), // 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  // Extend Session (>90 Menit: 35k Sebaya / 50k Psikolog per 30 Menit)
  isExtended: boolean("is_extended").default(false).notNull(),
  extensionMinutes: integer("extension_minutes").default(0).notNull(),
  extensionFee: numeric("extension_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  extensionPaymentStatus: text("extension_payment_status").default("NONE").notNull(), // 'NONE' | 'PENDING' | 'PAID'
  extensionPaymentMethod: text("extension_payment_method"),
  extensionProofR2Key: text("extension_proof_r2_key"),

  status: bookingStatusEnum("status").default("pending_payment").notNull(),
  rescheduleCount: integer("reschedule_count").default(0).notNull(),
  isFollowedUp: boolean("is_followed_up").default(false).notNull(),
  followedUpAt: timestamp("followed_up_at", { withTimezone: true }),
  isNoShow: boolean("is_no_show").default(false).notNull(),
  noShowMarkedAt: timestamp("no_show_marked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Clinical Session Reports (Strict Separation & Permasalahan Utama)
export const sessionReports = pgTable("session_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull().unique(),
  counselorId: uuid("counselor_id").references(() => counselors.id).notNull(),
  mainIssue: text("main_issue").notNull().default("Konsultasi Emosional & Stres"), // Permasalahan Utama
  summary: text("summary").notNull(), // Ringkasan Dinamika Sesi (Client Visible)
  actionPlan: text("action_plan"), // Saran / Tindak Lanjut (Client Visible)
  internalNotes: text("internal_notes"), // RAHASIA: Hidden from Client & Admin
  attachmentR2Keys: text("attachment_r2_keys").array(), // Internal Attendance Proof
  actualDurationMinutes: integer("actual_duration_minutes").default(90),
  timerStartedAt: timestamp("timer_started_at", { withTimezone: true }),
  timerStoppedAt: timestamp("timer_stopped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 4. 4 Zoom Accounts Hybrid Dispatching Algorithm

When a booking transitions to confirmed (via Xendit webhook or Admin manual verification):
1. Query all confirmed bookings for that date and `slot_index` (1..7) ordered by `created_at ASC`.
2. Count existing bookings `N` in the slot:
   - If `N <= 3`: Assign to `zoomAccounts` matching account number `N + 1`. Mode is `standalone`. Generate unique meeting via S2S OAuth with `join_before_host: true`. Counselor is provided with `host_key`.
   - If `N == 4`:
     - If total projected bookings for the slot (from active holds or confirmed) `<= 4`: Assign to Zoom 4 in `standalone` mode.
     - If total bookings `> 4`: Zoom 4 switches to `breakout_room` mode. Operator acts as Host. Breakout room name is generated: `${bookingCode} - ${counselorName}`.
   - If `N >= 5`: Assign to Zoom 4 in `breakout_room` mode. Link provided to client is Zoom 4 Main Meeting link. Breakout room name generated and displayed to Operator and Counselor.

### 5. Floating Timer & Extend Fee Calculation Rules

- **Client UX**: Timer runs client-side inside the Counselor session console using `useEffect` with background timestamp reconciliation (`performance.now()` / server timestamps).
- **Grace Period (90–95m)**: Free of charge.
- **Extend Block 1 (96–120m)**:
  - If Counselor is `peer`: Fee = `counselorExtendFeePer30Min` (Default: Rp 35.000).
  - If Counselor is `psychologist`: Fee = `psychologistExtendFeePer30Min` (Default: Rp 50.000).
- **Auto-Stop at 120m**: Timer reaches maximum slot boundary (2 hours) and halts. Counselor is prompted to wrap up immediately.

---

## Testing Decisions

### 1. Testing Seams & Philosophy
- **Primary Seam**: **Server Actions & Domain Operations via Vitest** (`tests/master-sop-system.test.ts`).
  - Tests invoke domain server actions with realistic session inputs against real/isolated database schemas.
  - Tests verify external behavior, security constraints (RBAC), and calculations rather than internal component implementation details.
- **Secondary Seam**: **Zod Schema Validation** (`lib/validations/master-sop.ts`).
  - Unit tests validating inputs for 7 slots, cutoff timing calculations, manual transfer receipt inputs, and session report constraints.
- **Third Seam**: **Zero-Mock Database Verification**.
  - All test scenarios verify that relations (e.g., booking to schedule to counselor to sessionReport) uphold database foreign keys without returning dummy fallback arrays.

### 2. Modules to Test
1. **Slot & Cutoff Validation**:
   - Rejection of bookings created `< 4 hours` before slot start time.
   - Rejection of client self-service reschedule requests `< 4 hours` before slot start time.
   - Enforcement of maximum 1-time reschedule rule.
2. **4 Zoom Pro Accounts Dispatcher**:
   - Bookings 1, 2, and 3 assigned to Zoom 1, 2, 3 in standalone mode.
   - Booking 4 assigned to standalone when slot has ≤ 4 sessions.
   - Bookings 4, 5, 6 assigned to Zoom 4 in breakout mode when slot has > 4 sessions.
   - Correct breakout room name string formatting: `SL-XXXX - Nama Konselor`.
3. **Dual Payments (Manual Transfer vs Xendit)**:
   - Initial booking marked `pending_payment` with `paymentMethod: 'manual_bank_transfer'`.
   - Admin verification action transitioning booking status to `confirmed`.
   - Extension fee billing with manual proof submission and admin confirmation.
4. **Extend Session Fee Calculation**:
   - Sesi 92 menit: Extend Fee = Rp 0 (within grace period).
   - Sesi 98 menit: Extend Fee = Rp 35.000 (Konselor Sebaya) or Rp 50.000 (Psikolog Klinis).
   - Sesi 120 menit: Maximum cap respected.
5. **Session Report & Medical Privacy Guard**:
   - `mainIssue` field required upon submission.
   - Client report verification via WhatsApp: phone match unlocks `mainIssue`, `summary`, and `actionPlan`.
   - Client report verification: `internalNotes` and `attachmentR2Keys` are **never** returned in the client-facing payload.
   - Admin view: displays report completion status and attendance photo, but omits `internalNotes`.
6. **Financial Ledger & Decoupled Payroll**:
   - Audit ledger aggregates actual session duration, base fee, extend fee, and payment channels accurately.
   - CSV export structure matches required bookkeeping columns.

---

## Out of Scope

1. **Automated Internal Payroll Engine**: Calculation of individual counselor tax withholdings, counselor bank disbursement APIs, or automatic salary transfers. (Decoupled by policy; solved via CSV reporting).
2. **Zoom Cloud Recording Video Archiving**: Video recordings of clinical sessions are strictly forbidden by Solulu privacy policy; no video storage pipeline is implemented.
3. **Automated WhatsApp Business Bot**: Automated messaging via WhatsApp Cloud API/Twilio is out of scope; notifications use standard `wa.me` links.
4. **Multi-Currency Billing**: All transactions, base fees, and extend fees are denominated strictly in Indonesian Rupiah (IDR).

---

## Further Notes

- All interactive controls adhere to **Shadcn UI accessibility standards** (WAI-ARIA compliant, keyboard navigability, high-contrast states).
- Production implementation will proceed in orderly tracer-bullet tickets (`/to-tickets`), completely clearing old layout debt in `app/admin` and `app/counselor`.
