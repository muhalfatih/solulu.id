# 03: Antarmuka Tab & Manajemen Template di Portal Konselor

**What to build:**
Pengalaman pengguna terpadu pada portal jadwal konselor di `/counselor/schedule` yang memisahkan antara kalender operasional mingguan aktif dan cetak biru template berulang melalui antarmuka Tab. Konselor dapat mengatur pola mingguan rutin dengan feedback visual langsung terhadap target kuota 10 slot, mengaktifkan/menonaktifkan otomatisasi dengan switch intuitif, dan tetap memiliki kemampuan untuk melakukan override pada tanggal kalender riil tanpa kebingungan.

**Blocked by:** 02-template-server-actions-and-validation

**Status:** completed

- [x] Halaman `/counselor/schedule` dilengkapi dengan dua tab utama: "Kalender Mingguan (Aktif)" dan "Template Otomatis (Rutin)".
- [x] Tab "Template Otomatis (Rutin)" menampilkan matriks 7 hari (Senin s/d Minggu) dengan 7 Slot Harian Tetap (08.00–22.00 WIB) yang responsif.
- [x] Di dalam tab template, terdapat ringkasan kuota komitmen (indikator progress target 10 slot, status terpenuhi/belum, dan tombol switch pengaktifan mode otomatis).
- [x] Konselor dapat melakukan klik toggle pada sel template dengan respons optimistik UI instan dan feedback notifikasi toast.
- [x] Tombol "Simpan Template" disabled atau memberikan peringatan jika mode otomatis dicentang namun slot aktif < 10.
- [x] Pada Tab "Kalender Mingguan (Aktif)", terdapat badge/banner penanda status bahwa jadwal konselor menggunakan mode otomatis, dengan panduan bahwa perubahan klik slot pada kalender berfungsi sebagai override minggu tersebut.
