# 04: Cron Maintenance & Ekstensi Buffer Otomatis Mingguan

**What to build:**
Mekanisme pemeliharaan otomatis latar belakang (background maintenance) yang memastikan konselor dengan mode otomatis aktif selalu memiliki ketersediaan slot 4 minggu ke depan secara berkesinambungan tanpa perlu melakukan klik simpan berulang kali. Fungsi ini diintegrasikan ke dalam endpoint cron yang sudah ada guna mematuhi batasan kuota gratis QStash/Vercel.

**Blocked by:** 03-counselor-schedule-tabs-and-template-ui

**Status:** done

- [x] Integrasi fungsi pemeliharaan rolling window ke dalam pipeline cron platform (misal `/api/cron/cleanup-slots` atau handler cron berkala terkait jadwal).
- [x] Cron memindai seluruh konselor aktif yang memiliki `schedule_mode = 'automatic'` dan memanggil fungsi materializer untuk memastikan 4 minggu ke depan dari tanggal sekarang selalu terisi.
- [x] Cron berjalan secara idempoten: tidak membuat duplikat baris slot yang sudah ada dan tidak mengganggu slot yang sudah berstatus `booked` atau `reserved`.
- [x] Pengujian Vitest memverifikasi eksekusi pemeliharaan cron berjalan idempoten dan memperpanjang buffer slot untuk konselor mode otomatis.

