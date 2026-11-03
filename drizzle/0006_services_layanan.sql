-- ADR-0010: Layanan dipisahkan dari Tipe Konselor (#20).
-- Urutan sengaja: buat tabel -> seed Layanan dari tier lama -> tambah kolom booking nullable
-- -> backfill booking lama -> baru kunci NOT NULL. `platform_pricing` dan kolom overtime di
-- `platform_settings` DIPERTAHANKAN (tidak di-drop) sebagai sumber data & jalur rollback;
-- kode aplikasi tidak lagi membacanya. Drop dilakukan di migrasi lanjutan setelah verifikasi.
CREATE TABLE "counselor_service_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"counselor_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"base_price" numeric(12, 2) NOT NULL,
	"promo_price" numeric(12, 2),
	"allow_voucher" boolean DEFAULT true NOT NULL,
	"overtime_rate_per_30_min" numeric(12, 2) NOT NULL,
	"base_payout_percent" integer NOT NULL,
	"overtime_payout_percent" integer NOT NULL,
	"allowed_counselor_types" "counselor_type_enum"[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Seed Layanan dari 2 tier `platform_pricing` agar harga yang dilihat klien tidak berubah.
-- Promo hanya aktif bila `is_sale_active` dan `promo_price` terisi (aturan lama). Bila baris tier
-- tidak ada, dipakai nilai bawaan lama dari kode (peer 85.000/promo 49.000; psikolog 150.000/promo 129.000).
-- Bagi Hasil dan tarif overtime sesuai ADR-0007/0010: Sebaya 70%/80% + Rp35.000; Psikolog 80%/85% + Rp60.000.
INSERT INTO "services" (
	"name", "slug", "description", "base_price", "promo_price", "allow_voucher",
	"overtime_rate_per_30_min", "base_payout_percent", "overtime_payout_percent",
	"allowed_counselor_types", "is_active", "sort_order"
)
SELECT
	'Partner Cerita',
	'partner-cerita',
	'Pendampingan emosional dan teman cerita bersama Konselor Sebaya terlatih.',
	COALESCE(pp."base_price", 85000),
	CASE
		WHEN pp."id" IS NULL THEN 49000
		WHEN pp."is_sale_active" AND pp."promo_price" IS NOT NULL THEN pp."promo_price"
		ELSE NULL
	END,
	COALESCE(pp."allow_voucher", true),
	35000, 70, 80,
	ARRAY['peer']::"counselor_type_enum"[],
	true, 1
FROM (SELECT 1) AS "seed"
LEFT JOIN "platform_pricing" pp ON pp."counselor_type" = 'peer'
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "services" (
	"name", "slug", "description", "base_price", "promo_price", "allow_voucher",
	"overtime_rate_per_30_min", "base_payout_percent", "overtime_payout_percent",
	"allowed_counselor_types", "is_active", "sort_order"
)
SELECT
	'Psikolog Klinis',
	'psikolog-klinis',
	'Konseling dan asesmen klinis mendalam bersama Psikolog Klinis berizin praktik.',
	COALESCE(pp."base_price", 150000),
	CASE
		WHEN pp."id" IS NULL THEN 129000
		WHEN pp."is_sale_active" AND pp."promo_price" IS NOT NULL THEN pp."promo_price"
		ELSE NULL
	END,
	COALESCE(pp."allow_voucher", true),
	60000, 80, 85,
	ARRAY['psychologist']::"counselor_type_enum"[],
	true, 2
FROM (SELECT 1) AS "seed"
LEFT JOIN "platform_pricing" pp ON pp."counselor_type" = 'psychologist'
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "base_price_snapshot" numeric(12, 2);--> statement-breakpoint
-- Backfill booking lama: Layanan = tier lama konselornya; snapshot = tarif pokok yang dibayar
-- klien sebelum voucher (gross pada transaksi pembayaran awal, bukan transaksi perpanjangan),
-- dan bila tidak ada transaksi, tarif aktif Layanan saat migrasi.
UPDATE "bookings" b
SET "service_id" = s."id"
FROM "counselors" c, "services" s
WHERE c."id" = b."counselor_id"
	AND s."slug" = CASE c."counselor_type"::text WHEN 'psychologist' THEN 'psikolog-klinis' ELSE 'partner-cerita' END;--> statement-breakpoint
UPDATE "bookings" b
SET "base_price_snapshot" = COALESCE(
	(
		SELECT t."gross_amount"
		FROM "transactions" t
		WHERE t."booking_id" = b."id" AND COALESCE(t."admin_notes", '') <> 'EXTENSION'
		ORDER BY t."created_at" ASC
		LIMIT 1
	),
	(
		SELECT CASE
			WHEN s."promo_price" IS NOT NULL AND s."promo_price" < s."base_price" THEN s."promo_price"
			ELSE s."base_price"
		END
		FROM "services" s
		WHERE s."id" = b."service_id"
	)
);--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "base_price_snapshot" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "counselor_service_exclusions" ADD CONSTRAINT "counselor_service_exclusions_counselor_id_counselors_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_service_exclusions" ADD CONSTRAINT "counselor_service_exclusions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_counselor_service_exclusion" ON "counselor_service_exclusions" USING btree ("counselor_id","service_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
