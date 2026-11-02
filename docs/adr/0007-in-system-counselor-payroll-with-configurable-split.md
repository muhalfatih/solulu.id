---
status: accepted
---

# 7. Payroll Konselor Dihitung di Dalam Sistem dengan Persentase Bagi Hasil yang Dapat Dikonfigurasi

Date: 2026-11-02

Sebelumnya (spec 0003, tiket 09) payroll sengaja *decoupled*: sistem hanya menyajikan rekap sesi dan manajemen menghitung komisi di luar sistem. PRD v9 §8.3 meminta sistem menghitung **Honor Konselor** sendiri, sehingga kami membalik keputusan itu. Honor dihitung per sesi dari persentase bagi hasil tarif pokok dan overtime; nilai persentasenya disimpan sebagai konfigurasi yang hanya dapat diubah Superadmin (nilai awal dari PRD: Sebaya 70%/80%, Psikolog 80%/85%), bukan konstanta di kode. Honor dikumpulkan per **Periode Payroll** 2 mingguan (tgl 1–15, 16–akhir bulan), ditahan (*Payroll Hold*) selama laporan sesi belum masuk, tetap dibayar penuh untuk klien No-Show, dan diekspor ke CSV (RFC 4180) untuk transfer massal bank. Pencairan dana tetap manual di luar sistem.

## Consequences

- Persentase bagi hasil yang berlaku harus dibekukan pada saat honor dihitung (atau periode dikunci), supaya perubahan konfigurasi oleh Superadmin tidak mengubah honor periode yang sudah ditutup.
- Halaman `/admin/reports/finance` berubah dari rekap audit menjadi laporan laba rugi (Omzet − HPP Honor = Laba Bersih).
