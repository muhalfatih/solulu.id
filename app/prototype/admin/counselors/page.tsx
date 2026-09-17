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
  Download,
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
  const filteredCounselors = activeCounselors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)} className="size-6 p-0">
            ✕
          </Button>
        </div>
      )}

      {/* Page Header & Navigation Tabs */}
      <Tabs defaultValue="applicants" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Mitra Konselor
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Audit kualifikasi berkas legalitas dan kelola status praktik konselor terdaftar
            </p>
          </div>

          <TabsList className="bg-muted p-1 rounded-xl shrink-0">
            <TabsTrigger value="applicants" className="flex items-center gap-2 text-xs">
              <span>Antrean Berkas</span>
              {pendingApplicants.length > 0 && (
                <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground">
                  {pendingApplicants.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2 text-xs">
              <span>Konselor Terdaftar</span>
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-muted-foreground/20 text-muted-foreground">
                {activeCounselors.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: APPLICANTS QUEUE */}
        <TabsContent value="applicants" className="flex flex-col gap-5 mt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>
                Berkas disimpan terenkripsi di Private Bucket Cloudflare R2 (akses presigned 15 menit).
              </span>
            </div>
            <span className="tabular-nums font-medium text-foreground">
              {pendingApplicants.length} pelamar butuh verifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {applicants.map((app) => (
              <div
                key={app.id}
                className={`rounded-2xl border bg-card p-5 flex flex-col justify-between gap-5 transition-colors ${
                  app.status === "approved"
                    ? "border-primary/40 bg-primary/5"
                    : app.status === "rejected"
                    ? "border-destructive/30 bg-destructive/5 opacity-70"
                    : "border-border"
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground text-base">{app.name}</h2>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                          {app.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>{app.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          <span>{app.phone}</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {app.appliedAt}
                    </span>
                  </div>

                  {/* Clinical Background Data: Flat, clean rhythm without nested borders */}
                  <div className="flex flex-col gap-2 text-xs pt-1 border-t border-border/60">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <GraduationCap className="size-3.5 text-foreground shrink-0 mt-0.5" />
                      <span className="text-foreground">{app.education}</span>
                    </div>

                    {app.strNumber && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <Award className="size-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground">STR:</span>
                        <span className="font-semibold text-foreground">{app.strNumber}</span>
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 text-emerald-600 dark:text-emerald-400">
                          Aktif
                        </Badge>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-1">
                      &ldquo;{app.bio}&rdquo;
                    </p>
                  </div>

                  {/* Document Audit Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <span className="text-[11px] font-medium text-foreground">
                      Audit Berkas Unggahan:
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setPreviewDoc({ name: "KTP Elektronik (WNI)", type: "ktp", applicantName: app.name })}
                        className="h-8 justify-between text-xs font-normal"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="size-3 text-primary shrink-0" />
                          <span className="truncate">KTP.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0 ml-1" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setPreviewDoc({ name: "Ijazah Profesi / Akademik", type: "diploma", applicantName: app.name })}
                        className="h-8 justify-between text-xs font-normal"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="size-3 text-primary shrink-0" />
                          <span className="truncate">Ijazah.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0 ml-1" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setPreviewDoc({ name: "Curriculum Vitae", type: "cv", applicantName: app.name })}
                        className="h-8 justify-between text-xs font-normal"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="size-3 text-primary shrink-0" />
                          <span className="truncate">CV.pdf</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0 ml-1" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        disabled={!app.documents.str}
                        onClick={() =>
                          app.documents.str &&
                          setPreviewDoc({ name: "Surat Tanda Registrasi (STR/SIP)", type: "str", applicantName: app.name })
                        }
                        className="h-8 justify-between text-xs font-normal"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Award className="size-3 text-primary shrink-0" />
                          <span className="truncate">STR.pdf</span>
                        </span>
                        {app.documents.str ? (
                          <Eye className="size-3 text-muted-foreground shrink-0 ml-1" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">-</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Audit Decision Controls */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  {app.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 text-xs font-medium h-8"
                      >
                        <UserCheck className="size-3.5 mr-1.5" />
                        <span>Setujui & Kirim Undangan</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(app.id, app.name)}
                        className="text-xs text-destructive hover:bg-destructive/10 h-8"
                      >
                        Tolak Berkas
                      </Button>
                    </>
                  ) : app.status === "approved" ? (
                    <div className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <span>Akun Terverifikasi</span>
                    </div>
                  ) : (
                    <div className="w-full py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center justify-center gap-1.5">
                      <XCircle className="size-3.5" />
                      <span>Lamaran Ditolak</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: REGISTERED COUNSELORS DIRECTORY */}
        <TabsContent value="active" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 flex-1 w-full sm:max-w-sm">
              <Search className="size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama konselor atau bidang spesialisasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground"
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              Menampilkan {filteredCounselors.length} dari {activeCounselors.length} mitra
            </span>
          </div>

          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-2.5 px-4 font-medium">Konselor</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Kualifikasi</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Kontak</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Total Sesi</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Fokus Layanan</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Status</TableHead>
                  <TableHead className="py-2.5 px-4 font-medium text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCounselors.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.title}</div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {c.type}
                      </Badge>
                      {c.strNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          STR: {c.strNumber}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-[11px]">
                      <div className="text-foreground">{c.email}</div>
                      <div className="text-muted-foreground">{c.phone}</div>
                    </TableCell>

                    <TableCell className="py-3 px-3 tabular-nums font-medium text-foreground">
                      {c.totalSessions} sesi
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
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

                    <TableCell className="py-3 px-4 text-right">
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

      {/* Document Preview Modal: Realistic, crisp, no tech jargon */}
      {previewDoc && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>{previewDoc.name}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pemilik berkas: {previewDoc.applicantName}
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setPreviewDoc(null)} className="size-6 p-0">
                ✕
              </Button>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3">
              <FileText className="size-10 text-primary/70" />
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Pratinjau Dokumen PDF Aman
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Tervalidasi via tautan sementara Cloudflare R2
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background px-2.5 py-1 rounded-full border border-border">
                <Clock className="size-3 text-amber-500" />
                <span>Tautan kedaluwarsa dalam 14:52 menit</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Integritas berkas SHA-256: Terverifikasi
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

