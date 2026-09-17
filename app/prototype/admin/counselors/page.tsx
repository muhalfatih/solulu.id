"use client"

import * as React from "react"
import {
  MOCK_APPLICANTS,
  MOCK_ACTIVE_COUNSELORS,
  CounselorApplicant,
} from "../mock-data"
import {
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Eye,
  Shield,
  Clock,
  Mail,
  Phone,
  UserCheck,
  Award,
} from "lucide-react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
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

export default function FreshCounselorsAdminPage() {
  const [applicants, setApplicants] = React.useState<CounselorApplicant[]>(MOCK_APPLICANTS)
  const [activeCounselors, setActiveCounselors] = React.useState(MOCK_ACTIVE_COUNSELORS)
  const [previewDoc, setPreviewDoc] = React.useState<{ name: string; type: string } | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [searchActive, setSearchActive] = React.useState("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleApprove = (id: string, name: string, email: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as const } : app))
    )
    showToast(`✅ Undangan Supabase Auth dikirim ke ${email}. Akun mitra terverifikasi!`)
  }

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`❌ Pelamar ${name} ditolak.`)
  }

  const toggleCounselorStatus = (id: string) => {
    setActiveCounselors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    )
    showToast("Status keaktifan mitra diperbarui.")
  }

  const pendingCount = applicants.filter((a) => a.status === "pending").length

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-7">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      {/* Page Title & Tab Switcher */}
      <Tabs defaultValue="applicants" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Verifikasi Pelamar & Direktori Mitra Konselor
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Review dokumen kredensial WNI & kelola lisensi praktik mitra konselor aktif.
            </p>
          </div>

          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="applicants" className="flex items-center gap-2 text-xs">
              <span>Pelamar Menunggu Review</span>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2 text-xs">
              <span>Mitra Terverifikasi ({activeCounselors.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: APPLICANTS */}
        <TabsContent value="applicants" className="flex flex-col gap-5 mt-0">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-primary shrink-0" />
              <span>
                Seluruh berkas pelamar (KTP, Ijazah, CV, STR) tersimpan di <strong>Cloudflare R2 Private Bucket</strong>.
                Akses dokumen diverifikasi menggunakan tautan presigned URL bertenggat 15 menit.
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline-flex">
              ADR-0002
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applicants.map((app) => (
              <Card
                key={app.id}
                className={`p-6 flex flex-col justify-between gap-4 transition-all ${
                  app.status === "approved"
                    ? "bg-primary/5 border-primary/40"
                    : app.status === "rejected"
                    ? "bg-destructive/5 border-destructive/30 opacity-70"
                    : "hover:border-border/80"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-bold text-foreground text-base">{app.name}</h2>
                      <Badge variant="outline" className="mt-1 text-[11px]">
                        {app.type}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5" />
                      <span>{app.appliedAt}</span>
                    </span>
                  </div>

                  <div className="text-xs text-foreground bg-muted/30 p-3.5 rounded-xl border border-border flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span>{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="text-muted-foreground pt-1">
                      <span className="text-foreground font-semibold">Pendidikan:</span>{" "}
                      {app.education}
                    </div>
                    {app.strNumber && (
                      <div className="text-primary font-mono text-[11px] font-bold">
                        STR: {app.strNumber} (Aktif)
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1 italic line-clamp-2">
                      &ldquo;{app.bio}&rdquo;
                    </p>
                  </div>

                  {/* Document Inspection Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[11px] font-semibold text-foreground">
                      Inspeksi Berkas Unggahan:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc({ name: "KTP WNI", type: "ktp" })}
                        className="justify-between h-9 text-xs"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="size-3.5 text-primary" /> KTP.pdf
                        </span>
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc({ name: "Ijazah Terakhir", type: "diploma" })}
                        className="justify-between h-9 text-xs"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="size-3.5 text-primary" /> Ijazah.pdf
                        </span>
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc({ name: "Curriculum Vitae", type: "cv" })}
                        className="justify-between h-9 text-xs"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="size-3.5 text-primary" /> CV.pdf
                        </span>
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!app.documents.str}
                        onClick={() =>
                          app.documents.str && setPreviewDoc({ name: "Surat Tanda Registrasi", type: "str" })
                        }
                        className="justify-between h-9 text-xs"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Award className="size-3.5 text-primary" /> STR.pdf
                        </span>
                        {app.documents.str && <Eye className="size-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border flex items-center gap-2.5">
                  {app.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 text-xs font-semibold gap-1.5"
                      >
                        <UserCheck className="size-4" />
                        <span>Setujui & Undang</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(app.id, app.name)}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Tolak
                      </Button>
                    </>
                  ) : app.status === "approved" ? (
                    <div className="w-full py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs text-center font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      <span>Akun Mitra Terverifikasi</span>
                    </div>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs text-center font-bold flex items-center justify-center gap-1.5">
                      <XCircle className="size-4" />
                      <span>Lamaran Ditolak</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: ACTIVE DIRECTORY */}
        <TabsContent value="active" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama konselor, spesialisasi..."
                value={searchActive}
                onChange={(e) => setSearchActive(e.target.value)}
                className="h-8 text-xs bg-transparent"
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Menampilkan {activeCounselors.length} Mitra Konselor
            </span>
          </div>

          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-3.5 px-4">Nama & Gelar</TableHead>
                  <TableHead className="py-3.5 px-3">Tipe & STR</TableHead>
                  <TableHead className="py-3.5 px-3">Kontak</TableHead>
                  <TableHead className="py-3.5 px-3">Total Sesi</TableHead>
                  <TableHead className="py-3.5 px-3">Spesialisasi</TableHead>
                  <TableHead className="py-3.5 px-3">Status</TableHead>
                  <TableHead className="py-3.5 px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCounselors.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-4 px-4">
                      <div className="font-bold text-foreground text-sm">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.title}</div>
                    </TableCell>
                    <TableCell className="py-4 px-3">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {c.type}
                      </Badge>
                      {c.strNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          STR: {c.strNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-3 text-[11px]">
                      <div className="text-foreground font-medium">{c.email}</div>
                      <div className="text-muted-foreground">{c.phone}</div>
                    </TableCell>
                    <TableCell className="py-4 px-3 font-bold text-foreground">
                      {c.totalSessions} sesi
                    </TableCell>
                    <TableCell className="py-4 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-3">
                      <Badge variant={c.isActive ? "default" : "outline"} className="text-[10px]">
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <Button
                        variant={c.isActive ? "outline" : "default"}
                        size="xs"
                        onClick={() => toggleCounselorStatus(c.id)}
                        className="text-[11px]"
                      >
                        {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>Simulasi Preview Berkas: {previewDoc.name}</span>
              </h2>
              <Button variant="ghost" size="xs" onClick={() => setPreviewDoc(null)}>
                ✕
              </Button>
            </div>

            <div className="p-8 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center text-center gap-3">
              <FileText className="size-12 text-muted-foreground animate-pulse" />
              <div className="font-bold text-foreground text-sm">
                [Dokumen Terenkripsi Presigned Cloudflare R2]
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Tautan presigned URL aman digenerate dengan masa berlaku 15 menit. Admin dapat
                memverifikasi keaslian dokumen tanpa perlu mendownload permanen di server Vercel.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setPreviewDoc(null)}>
                Tutup Preview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
