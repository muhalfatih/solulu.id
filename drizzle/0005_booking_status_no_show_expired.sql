-- Step 1 of 2 (ADR-0008). New enum values cannot be used in the same transaction that adds them,
-- so the data backfill lives in the next migration (0006_booking_status_backfill).
ALTER TYPE "public"."booking_status_enum" ADD VALUE IF NOT EXISTS 'no_show';--> statement-breakpoint
ALTER TYPE "public"."booking_status_enum" ADD VALUE IF NOT EXISTS 'expired';
