import { ShieldCheck, Lock, FileText, HeartHandshake, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicShell } from "@/components/public/public-shell"

export const metadata = {
  title: "Kebijakan Privasi & Perlindungan Data",
  description:
    "Komitmen perlindungan data pribadi dan kerahasiaan sesi konseling kesehatan mental di Solulu sesuai UU PDP No. 27/2022.",
}

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-3 pb-6 border-b border-border/60">
          <Badge variant="outline" className="w-fit text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1">
            <ShieldCheck className="size-3.5" />
            <span>Kepatuhan UU PDP No. 27/2022 &amp; Standar Etik Psikologi</span>
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Kebijakan Privasi &amp; Kerahasiaan Klinis
          </h1>
          <p className="text-sm text-muted-foreground">
            Terakhir diperbarui: 28 September 2026 • Berlaku efektif untuk seluruh pengguna layanan Solulu.
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col gap-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Lock className="size-4 text-primary" />
            <span>Ringkasan Komitmen Privasi Kami</span>
          </div>
          <p className="text-muted-foreground">
            Di Solulu, kami memahami bahwa kesehatan mental adalah ranah personal yang paling rentan. Kami memegang teguh asas kerahasiaan (*confidentiality*). Data klinis, hasil skrining SRQ-20, serta rekaman percakapan Anda tidak akan pernah dijual, disebarluaskan kepada pihak ketiga, atau digunakan untuk keperluan periklanan bertarget.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              1. Data yang Kami Kumpulkan
            </h2>
            <p className="text-muted-foreground">
              Untuk menyelenggarakan telekonseling yang aman dan bertanggung jawab, kami mengumpulkan data terbatas berikut:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-muted-foreground">
              <li><strong>Data Identitas Tamu (Guest Checkout):</strong> Nama lengkap/panggilan, alamat email aktif, dan nomor kontak WhatsApp untuk pengiriman tautan Zoom dan konfirmasi sesi.</li>
              <li><strong>Informasi Klinis Awal &amp; Skrining SRQ-20:</strong> Jawaban atas 20 pertanyaan skrining mandiri, skor total, indikasi pemikiran bunuh diri (Pertanyaan 17), dan catatan keluhan awal yang ditulis secara sukarela.</li>
              <li><strong>Data Transaksi:</strong> Metode pembayaran yang dipilih, status transaksi Xendit, atau bukti transfer manual (kami tidak menyimpan nomor kartu kredit secara langsung).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              2. Kerahasiaan Percakapan Telekonseling
            </h2>
            <p className="text-muted-foreground">
              Sesi telekonseling diselenggarakan menggunakan integrasi privat Zoom Server-to-Server (S2S) dengan enkripsi <em>end-to-end</em>:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-muted-foreground">
              <li>Platform Solulu <strong>tidak pernah merekam audio ataupun video</strong> sesi konseling secara otomatis di cloud maupun lokal server.</li>
              <li>Catatan sesi klinis (*session reports*) yang dibuat konselor dilindungi oleh <em>Row Level Security</em> (RLS) di basis data dan hanya dapat diakses oleh konselor bersangkutan serta Super Admin berwenang.</li>
              <li>Setiap lampiran dokumen medis disimpan dalam penyimpanan privat terenkripsi (<code className="text-xs bg-muted px-1 py-0.5 rounded">solulu-private</code>) yang hanya dapat diunduh melalui tautan bertanda tangan digital dengan batas waktu akses maksimal 15 menit.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              3. Pengecualian Batas Kerahasiaan (Prosedur Darurat)
            </h2>
            <p className="text-muted-foreground">
              Berdasarkan Kode Etik Psikologi Indonesia dan ketentuan hukum yang berlaku, batas kerahasiaan dapat dikesampingkan semata-mata dalam kondisi berikut:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-muted-foreground">
              <li>Terdapat bahaya nyata, mendesak, dan mengancam nyawa pasien sendiri (indikasi kuat tindakan bunuh diri aktif) atau pihak ketiga lainnya.</li>
              <li>Perintah pengadilan atau kewajiban hukum resmi dari instansi penegak hukum Republik Indonesia.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              4. Hak Pengguna atas Data Pribadi
            </h2>
            <p className="text-muted-foreground">
              Sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU PDP), Anda berhak untuk meminta salinan data, pembaharuan informasi, maupun penghapusan riwayat data identitas dari sistem kami setelah seluruh kewajiban administrasi sesi selesai.
            </p>
            <p className="text-muted-foreground">
              Permohonan penghapusan data dapat diajukan secara tertulis melalui surel resmi Tim Kepatuhan Privasi kami di <a href="mailto:privacy@solulu.id" className="text-primary hover:underline font-medium">privacy@solulu.id</a>.
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  )
}
