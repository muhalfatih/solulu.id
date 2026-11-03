ALTER TABLE "session_reports" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
-- Backfill: laporan yang benar-benar diisi konselor dianggap sudah diserahkan.
-- Baris buatan Floating Timer (main_issue kosong) tetap null sehingga honor tertahan.
UPDATE "session_reports" SET "submitted_at" = "created_at" WHERE "main_issue" <> '';--> statement-breakpoint
UPDATE "session_reports" SET "summary" = '' WHERE "main_issue" = '' AND "summary" = 'Sesi konseling telah terekam melalui Floating Timer.';
