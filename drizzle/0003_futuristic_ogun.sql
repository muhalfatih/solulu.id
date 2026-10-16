ALTER TYPE "public"."role_enum" ADD VALUE 'superadmin' BEFORE 'admin';--> statement-breakpoint
ALTER TYPE "public"."role_enum" ADD VALUE 'operator' BEFORE 'counselor';--> statement-breakpoint
DROP INDEX "idx_schedule_lookup";--> statement-breakpoint
ALTER TABLE "session_reports" ALTER COLUMN "action_plan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "booking_code" text DEFAULT 'SL-1001' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "gender" text DEFAULT 'Lainnya';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "age" integer DEFAULT 25;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "domicile" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "religion" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "informed_consent_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "zoom_account_number" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "zoom_allocation_mode" text DEFAULT 'standalone';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "zoom_host_key" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "breakout_room_name" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "operator_admitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_followed_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "followed_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_no_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "no_show_marked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "domicile" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "experience_years" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "himpsi_number" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "custom_fee_rate" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "counselor_commission_rate" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "sipp_number" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "sipp_expires_at" date;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "str_expires_at" date;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "ktp_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "cv_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "diploma_s1_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "diploma_profesi_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "str_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "sipp_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "certificate_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "verification_status" text DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "weekly_slot_target" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "booking_cutoff_hours" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "reschedule_cutoff_hours" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "payment_hold_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "max_slot_quota" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "min_counselor_weekly_slots" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "no_show_timeout_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "base_price" numeric(12, 2) DEFAULT '150000' NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "slot_index" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "is_leave" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "leave_reason" text;--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "actual_duration_minutes" integer DEFAULT 90;--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "timer_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "timer_stopped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "zoom_accounts" ADD COLUMN "account_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "zoom_accounts" ADD COLUMN "host_key" text;--> statement-breakpoint
CREATE INDEX "idx_schedule_lookup" ON "schedules" USING btree ("date","slot_index","status");