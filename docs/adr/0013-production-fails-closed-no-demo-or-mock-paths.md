---
status: accepted
---

# 13. Production Gagal-Tertutup: Tanpa Jalur Demo atau Mock

Date: 2026-11-02

Kode saat ini punya jalur kemudahan pengembangan yang aktif tanpa cek environment: cookie `solulu_demo_role` memberi peran apa pun (termasuk Superadmin), tombol login demo, invoice Xendit palsu saat kunci kosong, token cron `mock-cron-secret`, email/QStash yang melapor sukses palsu, serta link Zoom dan nominal yang dikarang di UI. Kami memutuskan aplikasi **gagal-tertutup**: di luar `NODE_ENV=test`, tidak ada jalur demo maupun mock. Konfigurasi yang hilang menghentikan proses dengan galat yang jelas (bukan berpura-pura sukses), autentikasi hanya lewat Supabase, dan UI tidak pernah menampilkan nilai karangan; data kosong ditampilkan sebagai keadaan kosong. Pengujian memakai `vi.mock()` di `tests/` dan akun Supabase lokal/staging yang nyata, bukan cookie demo. Ini memperluas kebijakan Zero-Mock di `AGENTS.md` ke jalur autentikasi dan integrasi pihak ketiga.

## Consequences

- Prototype tetap di branch `prototype/*` dan tidak pernah di-merge; komponen seperti `PrototypeSwitcher` tidak masuk `main`.
- Kolom database tidak boleh punya default yang mengarang data klien (mis. umur 25, gender "Lainnya", kode booking "SL-1001").
- Daftar temuan awal: `.scratch/prd-v9-alignment/demo-audit.md`.
