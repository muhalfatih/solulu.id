# 1. Zero-Cost Teleconsultation Architecture & Guardrails

Date: 2026-09-17

## Status

Accepted

## Context

Solulu membutuhkan platform telekonseling kesehatan mental dengan biaya server Rp 0/bulan (*zero-cost baseline*) menggunakan tier gratis (Vercel Hobby, Supabase Free, Cloudflare R2, Upstash QStash, Resend, Xendit), sembari melayani konsultasi aman dengan 2 akun Zoom Pro pribadi tanpa risiko *double booking* atau *timeout*.

## Decisions

1. **Decoupled Asynchronous Fulfillment:** Webhook Xendit (`/api/webhooks/xendit`) merespons `< 1` detik untuk mematuhi *10-second timeout* Vercel Hobby, mendelegasikan pembuatan meeting Zoom dan pengiriman email ke worker Upstash QStash (`/api/jobs/fulfill-booking`).
2. **Concurrency Guard & 2 Zoom Accounts:** Membatasi sesi bersamaan platform maksimal 2 sesi pada jam yang sama (`< 2`). Admin Zoom settings dilindungi *Safety Lock* jika masih ada sesi aktif mendatang.
3. **Guest-First Checkout with Nanoid Token:** Pasien tidak diwajibkan membuat akun; akses sesi dikontrol melalui URL unik ber-token `/session/[token]` dan pemulihan mandiri di `/cek-sesi`.
4. **Dual-Bucket Storage:** Pemisahan mutlak Cloudflare R2 publik (`solulu-public` dengan atribut `unoptimized={true}`) dan privat (`solulu-private` via Presigned GET URL 15 menit).
5. **SRQ-20 Triage & Emergency Waiver:** Skrining klinis mandiri dengan audit trail dan modal rujukan darurat Hotline 119 Ext 8 jika butir 17 positif.
6. **Slot Reservation Hold & Cron Cleanup:** Penguncian slot 15 menit saat pembayaran, dibersihkan berkala oleh QStash Scheduler tiap 2 menit (`/api/cron/cleanup-slots`).

## Consequences

- Arsitektur sepenuhnya mematuhi batas free tier tanpa biaya operasional tetap.
- Alur kerja latar belakang bergantung pada ketersediaan QStash dan webhook callback token.
- Seluruh kode agen rekayasa (`implement`, `to-tickets`, `to-spec`) wajib mengacu pada terminologi di `CONTEXT.md` dan keputusan di ADR ini.
