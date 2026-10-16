# 09: Admin Financial Ledger and Decoupled Payroll

**What to build:**
A transparent session and financial audit ledger at `/admin/reports/finance`. Instead of running an automated internal payroll engine, this page presents an aggregated audit table of completed sessions, actual durations, base fees, extend fees, payment channels (Xendit vs Manual Transfer), and provides a 1-click "Ekspor CSV Rekap" button so clinic management can calculate counselor commissions externally.

**Blocked by:** 08-admin-manual-payments-and-booking-lifecycle

**Status:** completed

- [x] Route `/admin/reports/finance` aggregates operational data across bookings, schedules, counselors, and transactions.
- [x] Top metric cards display: Total Sesi Terjadwal, Total Pendapatan Kotor (Base + Extend), Sesi Perpanjangan, and Kanal Pembayaran.
- [x] Displays prominent policy notice informing administrators that internal automated payroll calculation is intentionally decoupled from the system.
- [x] Ledger table displays columns: Kode Booking, Tanggal & Slot, Klien (Nama & WA), Mitra Konselor, Tipe Konselor, Durasi Riil (Menit), Biaya Sesi Dasar, Biaya Extend, Total Pembayaran, Metode Bayar (Xendit/Transfer Manual), dan Status Sesi.
- [x] Filters by date range, counselor type (Peer Counselor vs Clinical Psychologist), and payment method.
- [x] "Ekspor CSV Rekap" button downloads a standard comma-separated file formatted for external spreadsheet commission calculation.
- [x] Vitest test asserts accurate revenue calculation and CSV string formatting.
