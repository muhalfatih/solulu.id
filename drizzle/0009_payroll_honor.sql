CREATE TYPE "public"."payroll_period_status_enum" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "counselor_honors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"counselor_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"base_amount" numeric(12, 2) NOT NULL,
	"overtime_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"base_payout_percent" integer NOT NULL,
	"overtime_payout_percent" integer NOT NULL,
	"base_period_id" uuid,
	"overtime_period_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "counselor_honors_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "payroll_period_status_enum" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "bank_account_holder" text;--> statement-breakpoint
ALTER TABLE "counselor_honors" ADD CONSTRAINT "counselor_honors_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_honors" ADD CONSTRAINT "counselor_honors_counselor_id_counselors_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_honors" ADD CONSTRAINT "counselor_honors_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_honors" ADD CONSTRAINT "counselor_honors_base_period_id_payroll_periods_id_fk" FOREIGN KEY ("base_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_honors" ADD CONSTRAINT "counselor_honors_overtime_period_id_payroll_periods_id_fk" FOREIGN KEY ("overtime_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_counselor_honors_counselor" ON "counselor_honors" USING btree ("counselor_id","session_date");--> statement-breakpoint
CREATE INDEX "idx_counselor_honors_base_period" ON "counselor_honors" USING btree ("base_period_id");--> statement-breakpoint
CREATE INDEX "idx_counselor_honors_overtime_period" ON "counselor_honors" USING btree ("overtime_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payroll_period_start" ON "payroll_periods" USING btree ("start_date");