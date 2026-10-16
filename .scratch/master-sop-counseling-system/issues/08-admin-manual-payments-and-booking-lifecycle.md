# 08: Admin Manual Payments and Booking Lifecycle

**What to build:**
A dedicated manual payments verification queue at `/admin/manual-payments` and operational booking oversight at `/admin/bookings`. Admins verify bank transfer slips submitted for both initial bookings and extend sessions with 1-click "Konfirmasi Lunas" or "Tolak", mark sessions as No-Show after 30 minutes, and trigger WhatsApp follow-up links to clients that automatically record `is_followed_up: true`.

**Blocked by:** 06-client-session-room-dual-payments-and-wa-gate, 07-admin-counselor-directory-and-str-radar

**Status:** completed

- [x] Route `/admin/manual-payments` renders a verification queue of bookings and extensions with `manual_payment_status: 'PENDING'` or `extension_payment_status: 'PENDING'`.
- [x] Displays client name, booking code, counselor name, bank transfer slip preview, and nominal amount.
- [x] "Konfirmasi Lunas" action validates payment, sets `manual_payment_status: 'VERIFIED'`, transitions booking status to `confirmed`, and triggers Zoom room allocation.
- [x] "Tolak" action marks payment as `REJECTED` with an optional admin rejection reason.
- [x] Route `/admin/bookings` lists all bookings with filters for slot index, status, and counselor.
- [x] "Tandai No-Show" button flags sessions where clients fail to arrive within 30 minutes of slot start time (`is_no_show: true`, `status: 'completed'`).
- [x] "Kirim WA Laporan" button opens pre-filled `wa.me` message with the client's session report link and updates `is_followed_up: true` and `followed_up_at: NOW()`.
- [x] Vitest test asserts payment approval transitions and No-Show lifecycle mutations.
