CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"is_screening_required" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" text NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"anonymous_display" text NOT NULL,
	"session_code" text,
	"counselor_name" text NOT NULL,
	"counselor_type" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"quote_highlight" text NOT NULL,
	"comment" text NOT NULL,
	"topic" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "screening_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "bypassed_recommendation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "xendit_invoice_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "xendit_payment_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselor_applications" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "platform_pricing" ADD COLUMN "is_sale_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_pricing" ADD COLUMN "allow_voucher" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_provider" text DEFAULT 'xendit' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "reference_number" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "admin_notes" text;