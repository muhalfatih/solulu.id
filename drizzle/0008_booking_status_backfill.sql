-- Step 2 of 2 (ADR-0008). Runs after 0007 has added the 'no_show' and 'expired' enum values.
-- Data-only and idempotent; no rows are deleted. bookings.is_no_show / no_show_marked_at are kept
-- (deprecated, no longer read or written by the app) so nothing is lost.

-- 1. Bookings the admin flagged No-Show were stored as status 'completed' + is_no_show = true.
UPDATE "bookings"
SET "status" = 'no_show'
WHERE "is_no_show" = true
  AND "status" IN ('confirmed', 'completed');--> statement-breakpoint

-- 2. Holds that lapsed were written as 'cancelled' by the cleanup cron, which also moved their
--    transaction PENDING -> EXPIRED. Admin rejections / cancellations instead leave the transaction
--    FAILED (or the manual payment REJECTED), so they stay 'cancelled'.
UPDATE "bookings" b
SET "status" = 'expired'
WHERE b."status" = 'cancelled'
  AND COALESCE(b."manual_payment_status", 'NONE') <> 'REJECTED'
  AND EXISTS (
    SELECT 1 FROM "transactions" t
    WHERE t."booking_id" = b."id" AND t."status" = 'EXPIRED'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "transactions" t
    WHERE t."booking_id" = b."id" AND t."status" IN ('PAID', 'FAILED')
  );
