# Audit konten demo / mock / prototype (2026-11-02)

Input untuk spec "Penyelarasan PRD v9". Aturan: ADR-0013 + AGENTS.md (Zero-Mock).

## P0 — keamanan (gagal-terbuka di production)
- Cookie `solulu_demo_role` diterima tanpa cek environment di `lib/supabase/proxy.ts` dan helper auth:
  `app/admin/counselors/actions.ts`, `app/admin/counselors/applications/actions.ts`, `app/admin/settings/actions.ts`,
  `app/admin/zoom-settings/actions.ts`, `app/admin/profile/actions.ts`, `app/operator/actions.ts`, `app/operator/layout.tsx`,
  `lib/settings/platform.ts`, `lib/counselor/auth.ts` (19 referensi). Siapa pun bisa jadi Superadmin dengan set cookie.
- `solulu_demo_counselor_id` + pencarian hardcoded "Sarah Annisa": `app/(auth)/login/actions.ts`, `lib/counselor/auth.ts`, `app/counselor/actions.ts:839-845`.
- Tombol login demo di `app/(auth)/login/page.tsx` (`loginAsDemoAction`).
- `lib/xendit.ts:30` jatuh ke invoice palsu bila `XENDIT_SECRET_KEY` kosong/placeholder — di production booking tak pernah bisa dibayar.
- `lib/cron/handler.ts:27` menerima token `mock-cron-secret` bila secret belum dikonfigurasi.
- `lib/fulfillment/emails.ts:37,106` dan `lib/fulfillment/qstash.ts:32` melapor "sukses" palsu bila API key kosong.
- `lib/r2.ts:47` memakai kredensial `mock_r2_*` bila env kosong.

## P1 — data palsu yang tampil ke pengguna
- Link Zoom acak `https://zoom.us/j/88…Math.random()`: `app/admin/page.tsx:218`, `app/admin/sessions/page.tsx:299,324`,
  `app/admin/sessions/components/admin-manual-booking-modal.tsx:299`.
- Nominal fallback `150000` bila transaksi kosong: `app/admin/page.tsx:137`, `app/admin/sessions/page.tsx:200`.
- Label fallback "Transfer Bank Manual", "09:00 - 10:30 WIB", "Konselor": `app/admin/page.tsx`, `app/admin/sessions/page.tsx`, `lib/session/access.ts:358`.
- Email palsu `pasien@example.com` dikirim ke Xendit: `lib/session/access.ts:540`.
- Nomor referensi manual dikarang `REF-/MANUAL-${random}`: `app/admin/sessions/components/manual-payment-modal.tsx:83`,
  `app/admin/manual-payments/ManualPaymentsClient.tsx:148`, `app/admin/manual-payments/actions.ts:293`.
- Kontrol "Simulasi Transisi Waktu (Uji SOP)" di `components/counselor/FloatingTimer.tsx:664`.
- Default kolom yang mengarang data klien: `bookings.gender` "Lainnya", `bookings.age` 25, `bookings.bookingCode` "SL-1001",
  `session_reports.mainIssue` "Konsultasi Emosional & Stres" (`db/schema.ts:265-365`).

## P2 — sisa prototype / repo
- Screenshot QA di root repo (`admin-*.png`, `counselor-*.png`, `test-*.png`, `verified-*.png`) dan `.scratch/*.png`; `dev-server.log`.
- `prd.md`, `prd-new.md`, folder `alur-booking-dan-jobdesk` di root (cek relevansi).
- Branch `prototype/admin-dashboard` (Sep, sudah ter-merge) dan `prototype/admin-dashboard-v9` (acuan, jangan di-merge).
- Placeholder form "Contoh: Sarah Annisa, M.Psi." boleh tetap (contoh input, bukan data).

## Bukan masalah
- Generator password acak (`counselors/new`, `ApplicationsClient`) — fitur sah.
- Komentar "Zero-Mock Policy" di directory/finance/bookings.
