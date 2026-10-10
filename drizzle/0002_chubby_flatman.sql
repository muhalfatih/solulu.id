CREATE TABLE "specializations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "education" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "str_number" text;--> statement-breakpoint
ALTER TABLE "counselors" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;