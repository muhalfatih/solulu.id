# Spec: Admin Manual Counselor Management & Zero-Cost Booking Bypass

Label: `ready-for-agent`

## Problem Statement

Saat ini, Admin platform Solulu menghadapi dua hambatan operasional utama dalam mengelola platform:
1. **Tidak ada cara untuk mendaftarkan atau mengedit Mitra Konselor secara manual.** Konselor hanya bisa masuk melalui alur persetujuan pelamar publik (`counselor_applications`), dan halaman daftar konselor di admin masih menampilkan data tiruan (*mock data*). Admin tidak dapat memperbarui profil, gelar, bio, spesialisasi, atau menonaktifkan konselor tanpa menyentuh database secara langsung.
2. **Tidak ada mekanisme bagi Admin untuk mendaftarkan Pasien dan menjadwalkan Sesi Konseling secara langsung tanpa melalui alur pembayaran Xendit.** Ketika ada pasien rujukan darurat, beasiswa, program pro-bono, atau pembayaran tunai di luar sistem, Admin terpaksa harus meminta pasien melalui checkout publik atau melakukan manipulasi database manual yang berisiko merusak integritas relasi dan kuota 2 akun Zoom platform.

## Solution

Menyediakan antarmuka operasional klinis terpadu di Admin Surface (mematuhi prinsip *Clinical Precision & Operational Sanctuary* di `DESIGN.md`):
1. **Halaman Tambah & Edit Konselor Mandiri**:
   - Rute `/admin/counselors/new` dan `/admin/counselors/[id]/edit`.
   - Pembuatan akun Supabase Auth terintegrasi (dengan opsi ketik password manual atau generate acak dan salin ke clipboard).
   - Upload foto avatar langsung ke Cloudflare R2 publik dengan preview lingkaran seketika.
   - Pilihan multi-select spesialisasi/topik (preset standar Solulu + tag kustom).
   - Migrasi tabel konselor admin ke database nyata dengan aksi edit dan toggle status aktif/nonaktif.
2. **Modal Dialog Booking Manual (Admin Bypass)**:
   - Tombol aksi "+ Buat Booking Manual" pada halaman Sesi Konseling admin.
   - Pemilihan slot jadwal yang sudah ada ATAU pembuatan jadwal ad-hoc 90 menit baru.
   - Validasi otomatis terhadap pembatasan 2 akun Zoom Pro (*Concurrency Guard*), dengan opsi *graceful fallback* menggunakan tautan rapat manual jika kuota Zoom penuh.
   - Pencatatan transaksi Rp0 (`netAmount: 0`) dengan audit trail alasan bypass (`adminNotes`) dan penerbitan Token Sesi 32 karakter seketika.
   - Toggle opsional pembuatan ruang Zoom dan pengiriman email konfirmasi ke pasien & konselor.

---

## User Stories

### Manajemen Mitra Konselor (Admin)

1. As an Admin, I want to access a dedicated page `/admin/counselors/new`, so that I have a clean and focused form to register a new Mitra Konselor manually.
2. As an Admin, I want to input the counselor's Full Name, Professional Title (e.g. S.Psi or M.Psi., Psikolog), and Counselor Type (Konselor Sebaya vs Psikolog Klinis), so that their profile accurately reflects their professional credentials.
3. As an Admin, I want to provide the counselor's email address and specify an initial password or click "Generate Password Acak", so that I can immediately provision their dashboard account.
4. As an Admin, I want a one-click copy button next to the generated password, so that I can easily send the login credentials to the counselor via WhatsApp or email.
5. As an Admin, I want to select specializations from Solulu's predefined topics and optionally add custom topic tags, so that the counselor's areas of expertise match user needs in the catalog.
6. As an Admin, I want to upload the counselor's photo directly to public Cloudflare R2 storage and see an instant circular preview, so that the counselor's avatar appears polished and verified.
7. As an Admin, I want to write a comprehensive biography in a comfortable textarea, so that patients can read about the counselor's background and approach.
8. As an Admin, I want to toggle the counselor's initial status (Active/Inactive) upon creation, so that I can draft profiles before making them public.
9. As an Admin, I want to access `/admin/counselors/[id]/edit` from the counselors table, so that I can update an existing counselor's title, bio, specializations, avatar, or active status.
10. As an Admin, I want clear breadcrumbs on both new and edit pages, so that I can navigate back to the counselor directory with a single click.
11. As an Admin, I want the admin counselor directory to query real records from the database instead of mock data, so that my additions and edits are immediately visible.
12. As an Admin, I want to toggle a counselor's active status directly from the table row, so that I can pause incoming bookings for a counselor without opening the full edit page.
13. As an Admin, I want clear validation error messages when required fields (name, email, password, title, bio) are missing or invalid, so that I don't submit incomplete records.
14. As an Admin, I want the submit button to display a loading spinner and disabled state while saving, so that I don't accidentally trigger duplicate submissions.

### Booking Manual Pasien (Admin Bypass)

15. As an Admin, I want to see a prominent "+ Buat Booking Manual" button in the Sessions management header, so that I can quickly initiate an offline or pro-bono booking.
16. As an Admin, I want the booking form to open in a structured modal dialog without leaving the sessions page, so that my operational flow remains fast and uninterrupted.
17. As an Admin, I want to select a Mitra Konselor from an active counselors dropdown, so that I can assign the session to the appropriate professional.
18. As an Admin, I want the modal to load the selected counselor's available upcoming 90-minute slots, so that I can pick an existing opening.
19. As an Admin, I want an option to create an ad-hoc custom schedule (Date and Start Time) if no suitable slot is currently open, so that I can accommodate urgent or special appointment requests.
20. As an Admin, I want the system to calculate the 90-minute end time automatically (e.g., 19:00 -> 20:30 WIB) when entering an ad-hoc start time, so that scheduling rules remain consistent.
21. As an Admin, I want the system to check Zoom account concurrency (maximum 2 overlapping active sessions) before confirming the booking, so that our 2 Zoom Pro accounts never experience collision.
22. As an Admin, I want a graceful warning if Zoom concurrency is saturated, with the ability to proceed by entering a manual meeting link (e.g. Google Meet), so that urgent patient consultations are not blocked.
23. As an Admin, I want to fill in the Patient's Full Name, Email, and WhatsApp Phone number, so that the patient receives their session access and identity.
24. As an Admin, I want an optional field for initial patient notes or complaints, so that the counselor receives adequate context for the session.
25. As an Admin, I want clinical SRQ-20 screening to be optional or skipped by default during admin manual booking, so that emergency or proxy bookings are not encumbered by a 20-question survey.
26. As an Admin, I want to specify an admin audit note (e.g., "Beasiswa Mahasiswa", "Rujukan Darurat", "Pembayaran Tunai"), so that there is accountability for the zero-cost bypass.
27. As an Admin, I want checkboxes for `[x] Buat ruang Zoom otomatis` and `[x] Kirim email konfirmasi ke pasien & konselor`, so that I have complete control over side-effects.
28. As an Admin, I want a confirmed booking to generate an instant 32-character nanoid session token (`/session/[token]`), so that the patient can access their session space seamlessly.
29. As an Admin, I want the newly created manual booking to immediately appear in the sessions table with a "Confirmed" status and a badge indicating manual/pro-bono origin, so that my session roster stays synchronized.
30. As a Pasien who received a manual booking, I want to open `/session/[token]` and see my counselor details, session time, live countdown, and Zoom room link, so that my experience is identical to a standard paying guest.

---

## Implementation Decisions

### Architectural Seams & Contracts

1. **Counselor Management Seam**:
   - `createCounselorAction`: Accepts validated form payload. Executes Supabase Auth user creation via Admin API (`supabase.auth.admin.createUser`) with confirmed email and role metadata. Generates or receives avatar R2 key, inserts into the `counselors` table, and revalidates `/admin/counselors` and public `/counselors`.
   - `updateCounselorAction`: Accepts counselor ID and updated fields (fullName, title, counselorType, bio, specializations, avatarR2Url, isActive). Updates record in `counselors` table and revalidates relevant paths.
   - `getCounselorsAdminAction`: Fetches all counselors ordered by creation date, including their active slot count and completed session count.
   - `toggleCounselorActiveAction`: Flips `isActive` status with single-query efficiency.

2. **Manual Booking Seam**:
   - `createAdminManualBookingAction`: Accepts patient information, counselor ID, schedule selection (existing slot ID or ad-hoc date + start time), admin notes, and toggles (auto Zoom, send email).
   - If ad-hoc schedule: checks platform-wide overlap count `COUNT(*) < 2` for active bookings in the `[startTime, startTime + 90min)` window. If valid, creates the schedule record and locks it to `booked`.
   - Generates 32-character nanoid `accessToken`.
   - Inserts into `bookings` table with status `confirmed`.
   - Inserts into `transactions` table with `paymentProvider: 'admin_bypass'`, `grossAmount: [Tarif]`, `discountAmount: [Tarif]`, `netAmount: 0`, status `PAID`, and `adminNotes`.
   - If auto Zoom enabled: allocates Zoom host and creates Zoom meeting via Zoom API; if disabled: stores custom meeting URL.
   - If send email enabled: dispatches asynchronous confirmation email to patient and notification email to counselor.

3. **Storage & Avatar Direct Upload**:
   - Leverages existing `generatePresignedPutUrl` in `lib/r2` pointing to public bucket `solulu-public`. The browser uploads the avatar image file directly to Cloudflare R2, receiving the public CDN URL for immediate preview and form submission.

4. **UI & Design System Adherence (`DESIGN.md`, `shadcn`, `frontend-design`, `web-design-guidelines`)**:
   - Strictly Obsidian Ink (`oklch(0.21 0.006 285.885)`) and Calming Slate (`oklch(0.967 0.001 286.375)`); no Violet `#7c3aed` inside admin.
   - All operational buttons use `rounded-md`, never `rounded-full`.
   - Tabular data, dates, and times strictly styled with `tabular-nums`.
   - Form fields composed using `FieldGroup`, `Field`, `FieldLabel`, `Input`, `Textarea`, `Select`, `Switch`.
   - Spacing strictly implemented via `flex flex-col gap-*` (no `space-y-*`).
   - Sizing strictly implemented via `size-*` for symmetrical items (avatars, icons).
   - Full keyboard accessibility, clear ARIA states (`data-invalid`, `aria-invalid`), and dialog titles.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify external behavior and business invariants through public actions/functions, never internal implementation trivia.
- Tests verify:
  1. Zod input validation constraints for new counselor creation and manual booking.
  2. Supabase Auth creation integration and rollback behavior on failure.
  3. Zoom concurrency checks (allowing <= 1 overlap, blocking >= 2 overlaps unless manual link provided).
  4. Financial transaction invariants: `netAmount === 0`, `status === 'PAID'`, `paymentProvider === 'admin_bypass'`.
  5. Schedule slot generation: auto-computation of `endTime = startTime + 90 minutes`.

### Modules Tested
- Validation schemas (`lib/validations/counselor-admin.ts`, `lib/validations/admin-manual-booking.ts`).
- Admin counselor actions and permissions (`app/admin/counselors/actions.ts`).
- Admin manual booking fulfillment action (`app/admin/sessions/manual-booking-actions.ts`).

### Prior Art
- `tests/counselor-application.test.ts` (mocked Supabase admin and Drizzle query patterns).
- `tests/counselor-schedule-concurrency.test.ts` (90-minute session overlap guard testing).
- `tests/admin-portal-operations.test.ts` (manual payment confirmation and admin validations).

---

## Out of Scope

1. Bulk importing counselors via CSV/Excel (single manual entry only).
2. Public registration of patients by admin (patient remains guest-first checkout).
3. Modifying historical transaction financial values retroactively.
4. Redesigning the counselor public landing page or public booking flow.

---

## Further Notes

- All timestamps and appointment displays strictly reference Western Indonesia Time (WIB / UTC+7).
- If Cloudflare R2 credentials or Zoom credentials are not set in a local test environment, actions must gracefully mock or degrade without crashing.
