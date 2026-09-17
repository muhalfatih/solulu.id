"use client"

import * as React from "react"
import {
  MOCK_APPLICANTS,
  MOCK_ACTIVE_COUNSELORS,
  CounselorApplicant,
} from "../mock-data"
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  UserCheck,
  GraduationCap,
  Award,
  Clock,
  ExternalLink,
  Filter,
} from "lucide-react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function DistilledCounselorsPage() {
  const [applicants, setApplicants] = React.useState<CounselorApplicant[]>(MOCK_APPLICANTS)
  const [activeCounselors, setActiveCounselors] = React.useState(MOCK_ACTIVE_COUNSELORS)
  const [previewDoc, setPreviewDoc] = React.useState<{ name: string; type: string; applicantName: string } | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "suspended">("all")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleApprove = (id: string, name: string, email: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as const } : app))
    )
    showToast(`Undangan aktivasi akun berhasil dikirimkan ke ${email}.`)
  }

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`Lamaran atas nama ${name} ditolak.`)
  }

  const toggleCounselorStatus = (id: string) => {
    setActiveCounselors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    )
    showToast("Status praktik konselor berhasil diperbarui.")
  }

  const pendingApplicants = applicants.filter((a) => a.status === "pending")
  const filteredCounselors = activeCounselors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "active" ? c.isActive : !c.isActive
    return matchesSearch && matchesStatus
  })

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Page Header & Tab Controls */}
      <Tabs defaultValue="applicants" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Direktori & Antrean Mitra Konselor
              </h1>
              <Badge variant="outline" className="text-xs font-mono py-0.5 px-2">
                ADR-0001
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Audit kualifikasi berkas legalitas WNI dan kelola izin operasional konselor aktif.
            </p>
          </div>

          <TabsList className="bg-muted p-1 rounded-xl shrink-0 h-9">
            <TabsTrigger value="applicants" className="flex items-center gap-2 text-xs px-3">
              <span>Antrean Berkas</span>
              {pendingApplicants.length > 0 && (
                <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {pendingApplicants.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2 text-xs px-3">
              <span>Konselor Terdaftar</span>
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground">
                {activeCounselors.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: APPLICANTS AUDIT DECK */}
        <TabsContent value="applicants" className="flex flex-col gap-5 mt-0">
          {/* Telemetry bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>
                Dokumen tersimpan aman di Cloudflare R2 Private Bucket (akses bertenggat 15 menit).
              </span>
            </div>
            <span className="tabular-nums font-medium text-foreground">
              {pendingApplicants.length} pelamar menunggu evaluasi
            </span>
          </div>

          {/* Cards Grid: Balanced rhythm and clear visual grouping without stacked borders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {applicants.map((app) => (
              <div
                key={app.id}
                className={`rounded-2xl border bg-card p-6 flex flex-col justify-between gap-6 transition-all ${
                  app.status === "approved"
                    ? "border-primary/40 bg-primary/5"
                    : app.status === "rejected"
                    ? "border-destructive/30 bg-destructive/5 opacity-70"
                    : "border-border shadow-xs"
                }`}
              >
                {/* Upper Section: Profile & Credentials */}
                <div className="flex flex-col gap-5">
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-foreground text-base tracking-tight">
                          {app.name}
                        </h2>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                          {app.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3 text-muted-foreground/80" />
                          <span>{app.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3 text-muted-foreground/80" />
                          <span>{app.phone}</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 pt-0.5">
                      {app.appliedAt}
                    </span>
                  </div>

                  {/* Academic & STR Profile Block */}
                  <div className="flex flex-col gap-2 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70">
                    <div className="flex items-start gap-2 text-foreground">
                      <GraduationCap className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="leading-snug">{app.education}</span>
                    </div>

                    {app.strNumber && (
                      <div className="flex items-center gap-2 font-mono text-xs pt-1 border-t border-border/50">
                        <Award className="size-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground">No. STR:</span>
                        <span className="font-semibold text-foreground">{app.strNumber}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                          Terdaftar
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Bio Quote */}
                  <div className="text-xs text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-primary/30">
                    &ldquo;{app.bio}&rdquo;
                  </div>

                  {/* Document Audit Deck */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium text-foreground">
                      <span>Dokumen Kualifikasi Unggahan</span>
                      <span className="text-[11px] text-muted-foreground">Klik untuk audit</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          setPreviewDoc({
                            name: "KTP Elektronik (WNI)",
                            type: "ktp",
                            applicantName: app.name,
                          })
                        }
                        className="h-8 justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">KTP.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          setPreviewDoc({
                            name: "Ijazah Profesi / Akademik",
                            type: "diploma",
                            applicantName: app.name,
                          })
                        }
                        className="h-8 justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">Ijazah.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          setPreviewDoc({
                            name: "Curriculum Vitae",
                            type: "cv",
                            applicantName: app.name,
                          })
                        }
                        className="h-8 justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">CV.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        disabled={!app.documents.str}
                        onClick={() =>
                          app.documents.str &&
                          setPreviewDoc({
                            name: "Surat Tanda Registrasi (STR/SIP)",
                            type: "str",
                            applicantName: app.name,
                          })
                        }
                        className="h-8 justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Award className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">STR.pdf</span>
                        </span>
                        {app.documents.str ? (
                          <Eye className="size-3 text-muted-foreground shrink-0" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">-</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bottom Decision Bar: Clear generous separation from content */}
                <div className="pt-4 border-t border-border mt-2">
                  {app.status === "pending" ? (
                    <div className="flex items-center gap-2.5">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 text-xs font-medium h-9"
                      >
                        <UserCheck className="size-3.5 mr-1.5" />
                        <span>Setujui & Kirim Undangan</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(app.id, app.name)}
                        className="text-xs text-destructive hover:bg-destructive/10 h-9 px-3"
                      >
                        Tolak Berkas
                      </Button>
                    </div>
                  ) : app.status === "approved" ? (
                    <div className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="size-4" />
                      <span>Akun Mitra Terverifikasi</span>
                    </div>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center justify-center gap-2">
                      <XCircle className="size-4" />
                      <span>Lamaran Ditolak</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: REGISTERED COUNSELORS DIRECTORY (Unified Surface) */}
        <TabsContent value="active" className="flex flex-col gap-0 mt-0">
          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
            {/* Integrated Toolbar Header: Filter + Search + Stats in one surface */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama konselor atau spesialisasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-card"
                  aria-label="Cari nama konselor"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-background text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      statusFilter === "active"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("suspended")}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      statusFilter === "suspended"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ditangguhkan
                  </button>
                </div>

                <span className="text-xs text-muted-foreground tabular-nums pl-2">
                  {filteredCounselors.length} mitra
                </span>
              </div>
            </div>

            {/* Table Body */}
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/60">
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Konselor</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kualifikasi</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kontak</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Total Sesi</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Fokus Layanan</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCounselors.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors border-border/60">
                    <TableCell className="py-3.5 px-3.5">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.title}</div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {c.type}
                      </Badge>
                      {c.strNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          STR: {c.strNumber}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3.5 px-3 text-[11px]">
                      <div className="text-foreground font-mono">{c.email}</div>
                      <div className="text-muted-foreground font-mono">{c.phone}</div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 tabular-nums font-semibold text-foreground">
                      {c.totalSessions} sesi
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          c.isActive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            c.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                          }`}
                        />
                        <span>{c.isActive ? "Praktik Aktif" : "Ditangguhkan"}</span>
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => toggleCounselorStatus(c.id)}
                        className="h-7 text-xs"
                      >
                        {c.isActive ? "Tangguhkan" : "Aktifkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal: Realistic Document Viewer Layout */}
      {previewDoc && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>{previewDoc.name}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pemilik berkas: <span className="text-foreground font-medium">{previewDoc.applicantName}</span>
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setPreviewDoc(null)} className="size-6 p-0">
                ✕
              </Button>
            </div>

            {/* Simulated Document Canvas */}
            <div className="p-6 bg-muted/20 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <FileText className="size-8" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Pratinjau Dokumen PDF Aman
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Tervalidasi via tautan sementara Cloudflare R2
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                <Clock className="size-3 text-amber-500" />
                <span>Tautan kedaluwarsa dalam 14:52 menit</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground font-mono">
                SHA-256: Verified
              </span>
              <Button size="sm" onClick={() => setPreviewDoc(null)} className="h-8 text-xs">
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


