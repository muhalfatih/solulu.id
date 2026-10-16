# 05: Counselor Session Reports and Privacy Guard

**What to build:**
A structured web form for post-session clinical reporting without requiring PDF file uploads. The form enforces the mandatory "Permasalahan Utama (*Main Issue*)" field, client-visible "Ringkasan Dinamika Sesi" and "Saran / Tindak Lanjut", alongside strictly confidential "Catatan Internal Konselor" and attendance proof photo uploads. Upon completion, the booking transitions to `completed`.

**Blocked by:** 04-counselor-console-floating-timer-and-extend-fee

**Status:** completed

- [x] Route `/counselor/sessions/[id]/report` (and modal launcher) presents the clinical report form connected to real database records.
- [x] Field "Permasalahan Utama (*Main Issue*)" is mandatory and clearly labeled as visible on the official client report.
- [x] Fields "Ringkasan Dinamika Sesi" (mandatory) and "Saran / Rekomendasi" (optional) are persisted to `summary` and `action_plan`.
- [x] Field "Catatan Internal Konselor" is marked as strictly confidential and stored in `internal_notes`.
- [x] Confidentiality guard: `internal_notes` is strictly excluded from all client-facing queries and admin-facing payloads.
- [x] Upload box for internal attendance proof screenshots stores keys in `attachment_r2_keys` (Cloudflare R2 private bucket).
- [x] Submitting the report updates the booking status to `completed` in the database and shows confirmation toast.
- [x] Vitest test asserts that `internal_notes` is never returned in client session queries and verifies report submission.
