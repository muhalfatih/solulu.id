# 10: Superadmin System Settings and Zoom Manager

**What to build:**
A central administrative configuration panel at `/admin/settings` and `/admin/zoom` for Superadmins. Superadmins adjust core business parameters in real-time (booking cutoff H-4h, reschedule cutoff H-4h, payment hold minutes, slot quota, no-show timeout), configure extend session rates (Rp 35.000 Sebaya & Rp 50.000 Psikolog per 30m), manage manual bank transfer instructions, and oversee the credentials, OAuth status, and Host Keys of the 4 Zoom Pro accounts.

**Blocked by:** 08-admin-manual-payments-and-booking-lifecycle, 09-admin-financial-ledger-and-decoupled-payroll

**Status:** completed

- [x] Route `/admin/settings` provides form inputs bound to the `platform_settings` table in PostgreSQL.
- [x] Allows editing: Cutoff Pemesanan Baru (default 4 hours), Cutoff Reschedule (default 4 hours), Durasi Kunci Jadwal (15–30 minutes), Kuota Maksimal per Slot (default 10 sessions), and Batas No-Show (default 30 minutes).
- [x] Dedicated section for Extend Session Fees per 30 minutes: Tarif Konselor Sebaya (default Rp 35.000) and Tarif Psikolog Klinis (default Rp 50.000).
- [x] Toggle to enable/disable Manual Bank Transfer and textarea to edit clinic bank account details (BCA 123-456-7890 a.n. Solulu Mental Health).
- [x] Route `/admin/zoom` lists all 4 Zoom Pro accounts with account numbers, active status, OAuth token expiration timestamps, and 6-digit Host Keys.
- [x] Superadmin role verification: only users with `role: 'superadmin'` can update platform settings or view Zoom client secrets.
- [x] Vitest test asserts settings mutation and superadmin RBAC enforcement.
