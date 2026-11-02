---
status: accepted
---

# 8. Status Booking Minimal yang Disimpan, Tahap Siklus Lainnya Diturunkan

Date: 2026-11-02

PRD v9 §11.1 menggambarkan 11 status booking (DRAFT, HOLDING, CONFIRMED, ASSIGNED, RESCHEDULED, IN_SESSION, NO_SHOW, COMPLETED, REPORT_SUBMITTED, CLOSED_PAYROLL, EXPIRED). Kami **tidak** menyimpan ke-11 status itu di satu kolom, karena sebagian besar adalah fakta yang sudah tercatat di tempat lain dan menyimpannya dua kali membuat status bisa bertentangan dengan datanya (mis. `REPORT_SUBMITTED` padahal laporan dihapus). Kolom status hanya menyimpan tahap yang tidak dapat diturunkan: `pending_payment`, `confirmed`, `completed`, `no_show`, `cancelled`, `expired`. Tahap lain diturunkan: ASSIGNED = konselor sudah ditetapkan, RESCHEDULED = jadwal pernah diubah, IN_SESSION = timer sesi dimulai, REPORT_SUBMITTED = laporan sesi ada, CLOSED_PAYROLL = sesi masuk Periode Payroll yang terkunci. UI tetap boleh menampilkan label 11 tahap PRD.

## Considered Options

- **Enum 11 status penuh**: ditolak; setiap aksi harus memperbarui dua tempat, dan cron/webhook yang gagal di tengah meninggalkan status palsu.
