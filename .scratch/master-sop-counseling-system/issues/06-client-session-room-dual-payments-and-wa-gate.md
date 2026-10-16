# 06: Client Session Room, Dual Payments and WhatsApp Report Gate

**What to build:**
A dedicated, guest-first session room at `/session/[token]` where clients access their Zoom link, view guidance for their Zoom Display Name, settle extend session bills via Dual Payments (Xendit vs Manual Bank Transfer BCA), and unlock their official session report by verifying their registered WhatsApp phone number, complete with clean PDF printing.

**Blocked by:** 05-counselor-session-reports-and-privacy-guard

**Status:** completed

- [x] Route `/session/[token]` securely loads booking details for the guest client using the nanoid(32) token without requiring account login.
- [x] Displays prominent banner with Zoom Display Name formatting requirement: `[Kode Booking] - [Nama Panggilan]`.
- [x] Button to enter Zoom meeting opens the permanent join link assigned during confirmation.
- [x] Dual Payment interface for session extension allows choosing between automated Xendit (QRIS/VA) and Manual Bank Transfer (BCA 123-456-7890).
- [x] When Manual Bank Transfer is selected, displays bank details and allows uploading transfer proof, setting `extension_payment_status: 'PENDING'`.
- [x] "Baca & Cetak Laporan (PDF)" button opens a modal requesting the client's registered WhatsApp phone number.
- [x] Server action validates normalized phone number; upon match, unlocks the official session report displaying "Permasalahan Utama", "Ringkasan Dinamika Sesi", and "Saran / Tindak Lanjut".
- [x] Confidential counselor notes and internal attendance photos are completely masked.
- [x] "Cetak / Simpan sebagai PDF" button triggers `@media print` formatted view for clean client archiving.
- [x] Vitest test verifies WhatsApp phone verification security gate and field isolation.

