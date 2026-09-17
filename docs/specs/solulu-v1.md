# Spec: Solulu v1 — Zero-Cost Teleconsultation Platform

Label: `ready-for-agent`

## Problem Statement

Calon klien di Indonesia membutuhkan layanan konseling mental yang terjangkau, cepat (*frictionless*), dan aman secara privasi. Mereka tidak mau membuat akun, tidak mau proses panjang, dan sedang dalam kondisi emosional yang rentan. Di sisi lain, operator platform hanya memiliki 2 akun Zoom Pro pribadi dan zero budget untuk server — seluruh arsitektur harus berjalan di atas free tier layanan modern.

Saat ini tidak ada kode bisnis: proyek adalah scaffold Next.js 16 kosong dengan shadcn radix-vega preset dan satu komponen `Button`.

## Solution

Membangun platform telekonseling web lengkap (Solulu v1) yang memungkinkan:
- **Pasien** memesan sesi konseling 90 menit tanpa registrasi akun, membayar via Xendit, dan mengakses ruang Zoom melalui tautan unik.
- **Mitra Konselor** mengelola jadwal, memulai sesi Zoom, dan mencatat rekam medis pasca-sesi.
- **Admin** mengelola alokasi 2 akun Zoom dengan safety lock, memverifikasi pelamar mitra, mengatur tarif/voucher, dan memoderasi galeri publik.

Seluruh platform berjalan di atas Vercel (Hobby untuk dev, Pro untuk production), Supabase Free, Cloudflare R2, Upstash QStash + Redis, Resend, dan Xendit — dengan guardrails arsitektur yang mematuhi setiap batas free tier.

## User Stories

### Pasien (Guest)

1. As a Pasien, I want to view a landing page with clear value proposition, counselor highlights, pricing, gallery, and FAQ, so that I understand what Solulu offers and feel confident to proceed.
2. As a Pasien, I want to browse a catalog of verified Mitra Konselor filtered by type (Konselor Sebaya / Psikolog Klinis) and by date availability, so that I can find someone suitable who has open slots.
3. As a Pasien, I want to see each counselor's photo, name, title, bio, specializations, type, and pricing on their profile card, so that I can make an informed choice.
4. As a Pasien, I want to complete the SRQ-20 screening questionnaire (20 yes/no questions) before booking, so that the system can assess my clinical risk level.
5. As a Pasien, I want to be recommended a Psikolog Klinis if my SRQ-20 score ≥ 8 or question 17 is positive (suicidal ideation), so that I receive appropriate clinical care.
6. As a Pasien flagged as high-risk who still chooses a Konselor Sebaya, I want to see an Emergency Clinical Waiver Modal with crisis hotline numbers (Kemenkes 119 Ext 8, SEJIWA) and a mandatory consent checkbox, so that I am informed of the risks and my choice is audited.
7. As a Pasien, I want to select a date and see available time slots displayed as full ranges (e.g., "19:00 – 20:30 WIB"), so that I know exactly when my 90-minute session starts and ends.
8. As a Pasien, I want slots to be hidden when 2 sessions already overlap that time window across the entire platform, so that I never book a slot without a Zoom account available.
9. As a Pasien, I want to fill in my name, email (with confirmation), WhatsApp number, and optional notes during checkout, so that the platform can reach me and the counselor can prepare.
10. As a Pasien, I want to apply a voucher code during checkout and see the discounted price, so that I can save money.
11. As a Pasien, I want my selected slot to be held (reserved) for 15 minutes while I complete payment via Xendit, so that no one else takes it.
12. As a Pasien, I want to be redirected to Xendit's payment page supporting QRIS, e-Wallet, and Virtual Account, so that I can pay with my preferred method.
13. As a Pasien, I want to see a success page with a prominent "Buka Halaman Sesi Saya Sekarang" button after payment, so that I can immediately access my session page.
14. As a Pasien, I want to receive a confirmation email with my session details and a unique link `/session/[token]`, so that I have a permanent reference.
15. As a Pasien, I want to access `/session/[token]` and see counselor details (name, type, photo, bio, specializations), session date/time, a live countdown, and preparation tips, so that I feel prepared.
16. As a Pasien, I want the "Masuk Ruang Zoom" button to be disabled until 10 minutes before my session, with a clear explanation, so that I don't try to join too early.
17. As a Pasien, I want the Zoom button to turn green and active 10 minutes before my session starts, so that I can join the meeting.
18. As a Pasien, I want a "Kendala Teknis? Hubungi Tim Solulu via WhatsApp" button on my session page, so that I can get help if something goes wrong.
19. As a Pasien, I want to recover my session link at `/cek-sesi` by entering my email and WhatsApp number, so that I can regain access if I lost the original link or email.
20. As a Pasien, I want the recovery response to always say "Jika data Anda terdaftar, tautan sesi telah dikirimkan ke email Anda" regardless of match, so that my privacy is protected from enumeration attacks.
21. As a Pasien, I want `/cek-sesi` to be rate-limited (3 attempts per 15 minutes per IP), so that my data is protected from brute-force lookups.
22. As a Pasien, I want to see the privacy policy at `/privacy` and terms of service at `/terms`, so that I understand how my data is handled.
23. As a Pasien, I want a branded, warm 404 page if I visit an invalid session link, so that I'm guided to recovery options rather than a cold error.
24. As a Pasien whose fulfillment failed (no Zoom link yet), I want the session page to show "Zoom sedang disiapkan" with a WhatsApp support button, so that I'm not abandoned.

### Mitra Konselor

25. As a prospective Mitra Konselor, I want to apply at `/apply` by submitting my name, email, phone, counselor type, bio, CV, KTP, Ijazah, and STR (if Psikolog), so that I can be considered for the platform.
26. As a prospective Mitra Konselor, I want to upload documents directly to secure private storage (not through the server), so that large files don't fail due to server limits.
27. As a prospective Mitra Konselor, I want to agree to terms of cooperation with a recorded timestamp, so that there's a legal audit trail.
28. As a verified Mitra Konselor, I want to receive an email invitation to set my password and access `/counselor/dashboard`, so that I can start using the platform.
29. As a Mitra Konselor, I want to create schedule slots by selecting a date and one or more start times, with end times auto-calculated as start + 90 minutes, so that I don't have to do the math.
30. As a Mitra Konselor, I want the system to reject overlapping slots for my own schedule, so that I don't accidentally double-book myself.
31. As a Mitra Konselor, I want to cancel an available slot (set to cancelled), but not a reserved or booked one, so that active transactions aren't disrupted.
32. As a Mitra Konselor, I want to see a list of my upcoming sessions (today + 7 days) with patient name, initial notes, SRQ-20 score, suicidal ideation flag, and bypass flag, so that I can prepare clinically.
33. As a Mitra Konselor, I want a "Mulai Zoom" button that opens `zoom_start_url` in a new tab, so that I can start the meeting with one click.
34. As a Mitra Konselor, I want a "Tandai Selesai & Buat Catatan" button that marks the booking as completed and takes me to the report form, so that the workflow is seamless.
35. As a Mitra Konselor, I want to submit a session report with summary (min 20 chars), action plan (min 20 chars), follow-up recommendation, and optional private attachments, so that there's a clinical record.
36. As a Mitra Konselor, I want to edit my profile (bio, specializations, title) at `/counselor/profile`, so that my public listing stays current.
37. As a Mitra Konselor, I want to upload my own avatar to the public bucket, so that patients see my real photo.
38. As a Mitra Konselor, I want to receive an email when a new booking is confirmed for my session, so that I know without checking the dashboard.
39. As a Mitra Konselor, I want my session reports to be visible only to me and the Admin (Row Level Security), so that patient clinical data stays confidential.

### Admin

40. As an Admin, I want a dashboard showing today's total sessions, pending payments, this month's revenue, and the 10 most recent bookings, so that I have operational awareness.
41. As an Admin, I want to search/filter bookings by patient name, email, or status, so that I can find specific bookings quickly.
42. As an Admin, I want to manage the list of verified counselors, view their profiles, and deactivate them if needed, so that I maintain platform quality.
43. As an Admin, I want to review counselor applications, view their uploaded documents (via time-limited private URLs), and approve or reject them, so that only qualified counselors join.
44. As an Admin, I want approved counselors to automatically receive a Supabase Auth invite email and have their counselor record created, so that onboarding is streamlined.
45. As an Admin, I want to see informative error messages if the Supabase Auth invite rate limit (4/hour) is hit, so that I know to wait.
46. As an Admin, I want to configure 2 Zoom accounts (name, email, account ID, client ID, client secret) with the client secret encrypted at rest (AES-256-GCM), so that credentials are secure.
47. As an Admin, I want the system to prevent editing or deleting a Zoom account that has upcoming confirmed or reserved sessions (Safety Lock), with a clear message explaining why, so that active sessions aren't disrupted.
48. As an Admin, I want to set base price and optional promo price per counselor type (peer / psychologist), so that pricing is centrally managed.
49. As an Admin, I want to create and manage voucher codes with discount type (fixed/percentage), value, quota, expiry, and active status, so that I can run promotions.
50. As an Admin, I want to upload gallery photos to the public bucket with a mandatory consent checkbox ("faces censored and client consented"), so that privacy is legally protected.
51. As an Admin, I want to reschedule a booking by selecting a new available slot from a dropdown, with the system automatically sending the patient an email with the new session link, so that reschedules are handled efficiently.
52. As an Admin, I want reschedule to be blocked if the session is less than 12 hours away, so that last-minute disruptions are prevented.

### System / Background

53. As the system, I want the Xendit webhook handler to validate the callback token, check idempotency, update transaction/booking/schedule status, dispatch a QStash message, and return HTTP 200 in under 1 second, so that Vercel's 10-second timeout is never hit.
54. As the system, I want the QStash fulfill-booking worker to allocate a Zoom account dynamically (pick whichever of the 2 accounts has no overlapping confirmed session), create the Zoom meeting, save join/start URLs, and send confirmation + session link emails to patient and counselor, so that fulfillment is decoupled and reliable.
55. As the system, I want Zoom OAuth tokens cached in the database with 3500-second TTL to prevent rate limiting (HTTP 429), so that token requests are minimized.
56. As the system, I want a QStash cron every 5 minutes calling `/api/cron/cleanup-slots` (protected by CRON_SECRET bearer token) to atomically: (1) release expired reserved slots back to available, (2) cancel associated bookings, (3) expire associated transactions, (4) rollback voucher `usedCount`, (5) auto-archive sessions >2 hours past `endTime` as completed, so that stale state is cleaned up.
57. As the system, I want the slot hold `reserved_until` set to NOW() + 17 minutes (2-minute buffer over Xendit's 15-minute invoice expiry), so that webhook latency doesn't cause premature cleanup.
58. As the system, I want middleware to check Supabase Auth session cookies and enforce RBAC: `/admin/*` requires role=admin, `/counselor/*` requires role=counselor, with appropriate redirects, so that protected routes are secure.
59. As the system, I want `/session/[token]` to be publicly accessible without login, validated against the database access_token, so that guest patients can access their sessions.
60. As the system, I want rate limiting on `/cek-sesi` (3 req/15 min/IP) via Upstash Redis + `@upstash/ratelimit`, so that enumeration attacks are prevented.
61. As the system, I want all R2 images in Next.js to use `unoptimized={true}`, so that Vercel's 1000/month image optimization quota is preserved.
62. As the system, I want all file uploads (documents, gallery, avatar) to go directly to Cloudflare R2 via presigned PUT URLs (bypassing Vercel's 4.5MB limit), so that large files work reliably.

## Implementation Decisions

### Database & Schema (Drizzle ORM + Supabase PostgreSQL)

- **Migration strategy**: Versioned SQL migration files via `drizzle-kit generate` + `drizzle-kit migrate`. RLS policies as custom SQL migrations. All tracked in `/drizzle/`.
- **Connection**: Supavisor Transaction Pooler (port 6543) with `pgbouncer=true` flag.
- **Schema changes vs. PRD**:
  - Add `ktpR2Key` (text, not null) to `counselorApplications` — KTP is mandatory for all applicants.
  - Add `diplomaR2Key` (text, not null) to `counselorApplications` — Ijazah is mandatory for all, separate from STR.
  - Add `voucherId` (uuid, nullable, references `vouchers.id`) to `transactions` — for audit and voucher rollback.
  - `schedules.endTime` is auto-computed (`startTime + 90 minutes`) by the server action, not user-input.
  - `schedules.reserved_until` uses NOW() + 17 minutes (not 15).
- **Session duration**: Fixed 90 minutes (overrides PRD's 50+10 and PRODUCT.md's 60).

### Concurrency Guard (Overlap-Based)

- Platform-wide max 2 active sessions (`reserved` or `confirmed`) overlapping any time window on the same date.
- Range overlap check: `existingStart < newStart + 90min AND existingStart + 90min > newStart`.
- Applied in `holdScheduleSlotAction` (booking) and in the public slot visibility query (catalog).

### Voucher Lifecycle

- `usedCount` incremented atomically during slot hold (inside the same transaction).
- Cleanup cron rollbacks `usedCount` when associated booking is cancelled due to expired hold.
- Tracked via `voucherId` on `transactions` table.

### Asynchronous Fulfillment (Decoupled)

- Webhook `/api/webhooks/xendit`: validate, update DB, dispatch QStash, return 200 in <1s.
- Worker `/api/jobs/fulfill-booking`: allocate Zoom host, create meeting, send 2 emails (patient + counselor). QStash 3x retry on failure.
- Failure fallback: session page shows "Zoom sedang disiapkan" + WA support button.

### Cron (`/api/cron/cleanup-slots`)

- Triggered by QStash every 5 minutes (fits within 500 messages/day free tier).
- Atomic transaction: release expired slots → cancel bookings → expire transactions → rollback vouchers → auto-archive sessions >2h past endTime.

### Storage (Cloudflare R2 Dual-Bucket)

- `solulu-public`: avatars, gallery. Public CDN via `cdn.solulu.id`.
- `solulu-private`: KTP, CV, Ijazah, STR, clinical attachments. Presigned GET URLs (15-min expiry).
- All uploads via presigned PUT URLs (bypass Vercel 4.5MB limit).

### Authentication & Authorization

- Supabase Auth. Roles in `app_metadata`: `admin`, `counselor`. Guest = no auth, validated by `access_token`.
- Admin first account: manual seed via Supabase Dashboard (documented in README).
- Middleware RBAC on `/admin/*` and `/counselor/*` with redirect logic.

### Rate Limiting

- Upstash Redis free tier (10k req/day) + `@upstash/ratelimit`.
- `/cek-sesi`: 3 requests per 15 minutes per IP.

### Email

- Resend API. 3 email types in v1: (1) patient booking confirmation + session link, (2) counselor new booking notification, (3) patient session recovery.
- Sufficient within 100 emails/day free tier (~48 emails/day max capacity).

### Hosting

- Development/MVP: Vercel Hobby. Production: upgrade to Vercel Pro ($20/mo) before commercial launch.
- All architectural guardrails (timeout mitigation, QStash, R2 bypass, unoptimized images) remain in effect on Pro.

### UI / Frontend

- shadcn radix-vega preset, Tailwind v4, lucide icons, RSC-enabled.
- Forms use `FieldGroup` + `Field` pattern per shadcn rules.
- Landing page: hero, value prop, cara kerja, konselor featured, pricing, gallery, FAQ, footer.
- Mobile-first, WCAG AA contrast, calming/grounding visual tone.
- `lang="id"` on html element.

### Additional Routes (Beyond PRD)

- `/privacy` and `/terms`: legal compliance pages (static content).
- `/counselor/profile`: counselor self-service profile editing.
- Custom branded 404 and 500 error pages.
- `sitemap.xml`, `robots.txt`, Open Graph meta tags.

### Reschedule

- Admin-only, semi-automatic: dropdown to pick new slot + automatic email to patient.
- Blocked if session is <12 hours away.

## Testing Decisions

### Testing Seams

- **Primary seam: Server Actions.** All business logic is encapsulated in server actions. Tests call actions directly against a test database (Supabase local via Docker or test project). This is the highest testable boundary and covers: concurrency guard, voucher validation, safety lock, slot hold, SRQ-20 triage logic, RBAC enforcement.
- **API Route Handlers** (`/api/webhooks/xendit`, `/api/jobs/fulfill-booking`, `/api/cron/cleanup-slots`): tested via HTTP requests with mock payloads. Validates idempotency, QStash dispatch, cleanup atomicity.
- **Lib modules** (`encryption.ts`, `r2.ts`, `zoom.ts`): unit-testable pure functions and SDK wrappers. AES encrypt/decrypt roundtrip, presigned URL generation, token caching logic.

### What makes a good test

- Test external behavior through the server action interface, not internal implementation details.
- Each test should set up its own data (insert test counselor, schedule, etc.), call the action, and assert the database state and return value.
- Edge cases to cover: concurrent slot hold (race condition), voucher at quota limit, SRQ-20 score boundaries (7 vs 8), safety lock with future sessions, overlap guard with 2 sessions already active.

### No prior art

This is a greenfield project. Tests will establish the patterns for all future work.

## Out of Scope

- Email reminders (H-1 jam before session)
- Email post-session (thank you / follow-up)
- Self-service reschedule for patients (via UI)
- Filter by specialization in counselor catalog
- Visual calendar for counselor dashboard
- Analytics / charts in admin dashboard
- Bulk delete of counselor schedule slots
- WhatsApp Business API integration
- Multi-language support (Bahasa Indonesia only for v1)
- Native mobile app

## Further Notes

- **PRD reconciliation**: The original PRD (`prd.md`) specifies 50+10 minute sessions, simple `(date, startTime)` equality guard, and 2-minute cron intervals. This spec supersedes those with: 90-minute sessions, range overlap guard, and 5-minute cron. The PRD's schema also omits `ktpR2Key`, `diplomaR2Key`, and `voucherId` which are added here.
- **PRODUCT.md reconciliation**: States "60 menit per sesi" which is also superseded by 90 minutes.
- **Domain vocabulary**: All implementation must use terms from `CONTEXT.md`. Key decisions are recorded in `docs/adr/0001-*.md` and `docs/adr/0002-*.md`.
- **shadcn components**: Only `Button` is currently installed. Components should be added incrementally via `npx shadcn@latest add` as needed during implementation.
- **Upstash Redis**: Not currently in the tech stack. Must be added as a new dependency for rate limiting.
