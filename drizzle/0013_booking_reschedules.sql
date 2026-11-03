CREATE TABLE "booking_reschedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"initiated_by" text NOT NULL,
	"actor_id" text,
	"from_schedule_id" uuid NOT NULL,
	"to_schedule_id" uuid NOT NULL,
	"from_counselor_id" uuid NOT NULL,
	"to_counselor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "admin_reschedule_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_reschedules" ADD CONSTRAINT "booking_reschedules_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedules" ADD CONSTRAINT "booking_reschedules_from_schedule_id_schedules_id_fk" FOREIGN KEY ("from_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedules" ADD CONSTRAINT "booking_reschedules_to_schedule_id_schedules_id_fk" FOREIGN KEY ("to_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedules" ADD CONSTRAINT "booking_reschedules_from_counselor_id_counselors_id_fk" FOREIGN KEY ("from_counselor_id") REFERENCES "public"."counselors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedules" ADD CONSTRAINT "booking_reschedules_to_counselor_id_counselors_id_fk" FOREIGN KEY ("to_counselor_id") REFERENCES "public"."counselors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_reschedules_booking_idx" ON "booking_reschedules" USING btree ("booking_id","created_at");