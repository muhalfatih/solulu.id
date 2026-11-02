---
status: accepted
---

# 10. Layanan Dipisahkan dari Tipe Konselor

Date: 2026-11-02

Tarif semula melekat pada Tipe Konselor (`platform_pricing` per `peer`/`psychologist`), sehingga layanan baru seperti Konseling Pra-Nikah (PRD v9 §8.1) tidak punya tempat. Kami memperkenalkan **Layanan** sebagai entitas dinamis yang dikelola Superadmin: masing-masing membawa tarif dasar, tarif promo, izin voucher, tarif overtime per 30 menit, dan Bagi Hasil pokok/overtime, serta menyebut Tipe Konselor mana yang boleh menanganinya. Tipe Konselor tetap dua dan tetap menentukan kewajiban legalitas (STR/SIPP) serta rekomendasi skrining SRQ-20. Durasi semua Layanan tetap 90 menit karena 7 Slot Harian Tetap. Layanan tidak pernah dihapus, hanya dinonaktifkan, karena booking dan payroll lama merujuknya.

## Consequences

- Tarif dasar/promo pindah dari `platform_pricing`, dan tarif overtime pindah dari `platform_settings`, ke data Layanan; booking menyimpan Layanan yang dibeli.
- Konselor otomatis menawarkan semua Layanan aktif yang sesuai tipenya; Admin dapat mematikan Layanan tertentu per konselor.
