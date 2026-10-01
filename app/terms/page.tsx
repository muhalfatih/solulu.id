import { Scale, Clock, AlertTriangle, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PublicShell } from "@/components/public/public-shell"

export const metadata = {
  title: "Syarat & Ketentuan Layanan",
  description:
    "Ketentuan penggunaan layanan telekonseling, aturan perubahan jadwal (H-12), dan protokol keselamatan pasien di Solulu.",
}

export default function TermsOfServicePage() {
  return (
    <PublicShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-3 pb-6 border-b border-border/60">
          <Badge variant="outline" className="w-fit text-xs bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
            <Scale className="size-3.5" />
            <span>Ketentuan Hukum &amp; Kesepakatan Layanan Pasien</span>
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance">
            Syarat &amp; Ketentuan Layanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Terakhir diperbarui: 28 September 2026 • Membaca dan menyetujui ketentuan ini merupakan syarat menggunakan layanan Solulu.
          </p>
        </div>

        {/* Highlight Card: Bukan Layanan Gawat Darurat */}
        <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 flex flex-col gap-2.5 text-xs text-destructive leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Pemberitahuan Penting: Batasan Layanan Telekonseling</span>
          </div>
          <p className="leading-relaxed">
            Solulu adalah platform telekonseling terjadwal dan <strong>BUKAN merupakan layanan gawat darurat medis/jiwa</strong>. Jika Anda atau orang di sekitar Anda sedang dalam krisis akut yang mengancam nyawa atau berniat menyakiti diri sendiri, segera hubungi Instalasi Gawat Darurat (IGD) atau fasilitas kesehatan terdekat.
          </p>
        </div>

        {/* Content Sections */}
        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight">
              1. Definisi &amp; Peran Konselor
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground">
              <li>
                <strong>Psikolog Klinis:</strong> Tenaga psikologi profesional yang memiliki Surat Tanda Registrasi (STR) aktif dan izin praktik resmi, berwenang memberikan asesmen psikologis mendalam serta intervensi klinis.
              </li>
              <li>
                <strong>Konselor Sebaya (Peer Counselor):</strong> Lulusan Sarjana Psikologi (S.Psi) yang telah mendapatkan pelatihan pendampingan suportif untuk membantu keluhan stres adaptasi, quarter-life crisis, atau kebutuhan ruang bercerita terarah tanpa resep obat/diagnosis klinis.
              </li>
            </ul>
          </section>

          {/* Section 2: Reschedule Policy H-12 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>2. Kebijakan Perubahan Jadwal (Aturan H-12)</span>
            </h2>
            <p className="text-muted-foreground">
              Demi menghormati alokasi waktu mitra konselor dan menjaga kepastian ketersediaan ruang Zoom berlisensi:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-muted-foreground">
              <li>
                Permohonan perubahan jadwal (*reschedule*) hanya dapat diproses apabila diajukan <strong>minimal 12 jam sebelum waktu sesi dimulai (Aturan H-12)</strong>.
              </li>
              <li>
                Pengajuan perubahan jadwal kurang dari 12 jam sebelum sesi akan ditolak secara otomatis oleh sistem, dan biaya sesi tidak dapat dikembalikan (*non-refundable*).
              </li>
              <li>
                Setiap pemesanan hanya diperkenankan melakukan perubahan jadwal sebanyak maksimal 1 (satu) kali.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight">
              3. Ketepatan Waktu &amp; Toleransi Kehadiran
            </h2>
            <p className="text-muted-foreground">
              Sesi berdurasi standar 90 menit. Klien diimbau untuk bergabung ke ruang Zoom 5 menit sebelum jadwal. Apabila klien terlambat, waktu sesi akan tetap berakhir sesuai jadwal semula guna mencegah tumpang tindih dengan sesi berikutnya. Mitra konselor akan menunggu di ruang Zoom maksimal 15 menit. Jika klien tidak hadir setelah 15 menit tanpa pemberitahuan, sesi dianggap selesai (*no-show*).
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight">
              4. Etika Berkomunikasi &amp; Kebijakan Nol Toleransi
            </h2>
            <p className="text-muted-foreground">
              Solulu menjunjung tinggi keamanan dan kehormatan bersama. Segala bentuk pelecehan seksual, ancaman kekerasan, kata-kata kasar bermuatan SARA, maupun pornografi di dalam sesi konseling akan berakibat pada penghentian sesi seketika oleh konselor tanpa pengembalian dana, serta dapat ditindaklanjuti secara hukum.
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  )
}
