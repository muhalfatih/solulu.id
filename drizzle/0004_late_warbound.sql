CREATE TYPE "public"."schedule_mode_enum" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TABLE "counselor_weekly_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"counselor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot_index" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_method" text DEFAULT 'xendit' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "manual_payment_proof_r2_key" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "manual_payment_status" text DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_extended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_fee" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_payment_status" text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_payment_method" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_proof_r2_key" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "schedule_mode" "schedule_mode_enum" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "counselor_extend_fee_per_30_min" numeric(12, 2) DEFAULT '35000' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "psychologist_extend_fee_per_30_min" numeric(12, 2) DEFAULT '50000' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "is_manual_payment_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "manual_payment_instructions" text DEFAULT 'Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.';--> statement-breakpoint
ALTER TABLE "session_reports" ADD COLUMN "main_issue" text DEFAULT 'Konsultasi Emosional & Stres' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "manual_proof_r2_key" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_manual_verification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "manual_verified_by" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "manual_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "counselor_weekly_templates" ADD CONSTRAINT "counselor_weekly_templates_counselor_id_counselors_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_counselor_weekly_template_unique" ON "counselor_weekly_templates" USING btree ("counselor_id","day_of_week","slot_index");--> statement-breakpoint
CREATE INDEX "idx_counselor_weekly_template_counselor" ON "counselor_weekly_templates" USING btree ("counselor_id");