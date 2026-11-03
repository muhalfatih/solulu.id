ALTER TABLE "bookings" ADD COLUMN "source" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "booking_cepat_hold_minutes" integer DEFAULT 60 NOT NULL;