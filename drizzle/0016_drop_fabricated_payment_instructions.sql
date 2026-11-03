ALTER TABLE "platform_settings" ALTER COLUMN "manual_payment_instructions" DROP DEFAULT;--> statement-breakpoint
-- ADR-0013: teks rekening karangan yang sempat tersimpan dikosongkan; Superadmin mengisi rekening asli.
UPDATE "platform_settings" SET "manual_payment_instructions" = NULL WHERE "manual_payment_instructions" LIKE '%123-456-7890%';
