CREATE TABLE "whatsapp_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"template_id" uuid,
	"template_key" text NOT NULL,
	"sent_by" uuid NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_dispatches" ADD CONSTRAINT "whatsapp_dispatches_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_dispatches" ADD CONSTRAINT "whatsapp_dispatches_template_id_whatsapp_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."whatsapp_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_wa_dispatch_booking" ON "whatsapp_dispatches" USING btree ("booking_id","template_key","sent_at");--> statement-breakpoint
INSERT INTO "whatsapp_templates" ("key", "name", "body") VALUES
	('dispatch_link_sesi', 'Dispatch Link Sesi', 'Halo Kak {{nama_klien}}, sesi konseling Solulu Anda dijadwalkan pada {{tanggal}} pukul {{slot}} bersama {{nama_konselor}}. Masuk ke ruang sesi melalui tautan berikut: {{link_sesi}}. Sampai jumpa!'),
	('laporan_siap', 'Laporan Siap', 'Halo Kak {{nama_klien}}, laporan sesi konseling Anda bersama {{nama_konselor}} pada {{tanggal}} telah tersedia dan dapat diakses melalui tautan berikut: {{link_sesi}}. Terima kasih telah mempercayakan kesehatan mental Anda bersama Solulu.')
ON CONFLICT ("key") DO NOTHING;
