ALTER TABLE "bookings" ALTER COLUMN "schedule_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "counselor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pool_date" date;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pool_slot_index" integer;