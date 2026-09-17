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
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Award,
} from "lucide-react"

export default function CounselorsAdminPage() {
  const [activeTab, setActiveTab] = React.useState<"applicants" | "active">("applicants")
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
    showToast(`✅ Undangan Supabase Auth dikirim ke ${email}. Record konselor dibuat!`)
  }

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`❌ Pelamar ${name} ditolak.`)
  }

  const toggleCounselorStatus = (id: string) => {
    setActiveCounselors((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    )
    showToast("Status keaktifan mitra diperbarui.")
  }

  const pendingCount = applicants.filter((a) => a.status === "pending").length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Verifikasi Pelamar & Direktori Mitra Konselor
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review dokumen kredensial WNI & kelola lisensi mitra konselor aktif.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "applicants"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>Pelamar Menunggu Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "active"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>Mitra Terverifikasi ({activeCounselors.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICANTS PIPELINE */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>
                Seluruh berkas pelamar (KTP, Ijazah, CV, STR) tersimpan di Cloudflare R2 Private Bucket.
                Akses dokumen menggunakan tautan bertenggat 15 menit.
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 hidden sm:inline">ADR-0002 Compliance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {applicants.map((app) => (
              <div
                key={app.id}
                className={`p-5 rounded-2xl border transition-all ${
                  app.status === "approved"
                    ? "bg-emerald-950/20 border-emerald-800/40"
                    : app.status === "rejected"
                    ? "bg-rose-950/15 border-rose-900/30 opacity-70"
                    : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                } space-y-4 shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base">{app.name}</h3>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        app.type === "Psikolog Klinis"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {app.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{app.appliedAt}</span>
                  </span>
                </div>

                <div className="text-xs text-neutral-300 space-y-1 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{app.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{app.phone}</span>
                  </div>
                  <div className="text-neutral-400 pt-1">
                    <span className="text-neutral-200 font-medium">Pendidikan:</span> {app.education}
                  </div>
                  {app.strNumber && (
                    <div className="text-teal-400 font-mono text-[11px]">
                      STR: {app.strNumber} (Terdaftar)
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-400 pt-1 italic line-clamp-2">
                    &ldquo;{app.bio}&rdquo;
                  </p>
                </div>

                {/* Document Inspection Buttons */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-neutral-400">
                    Inspeksi Dokumen Unggahan:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setPreviewDoc({ name: "KTP WNI", type: "ktp" })}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> KTP.pdf
                      </span>
                      <Eye className="w-3 h-3 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => setPreviewDoc({ name: "Ijazah Terakhir", type: "diploma" })}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> Ijazah.pdf
                      </span>
                      <Eye className="w-3 h-3 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => setPreviewDoc({ name: "Curriculum Vitae", type: "cv" })}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> CV.pdf
                      </span>
                      <Eye className="w-3 h-3 text-neutral-500" />
                    </button>
                    <button
                      disabled={!app.documents.str}
                      onClick={() =>
                        app.documents.str && setPreviewDoc({ name: "Surat Tanda Registrasi", type: "str" })
                      }
                      className={`p-2 rounded-lg bg-neutral-950 border flex items-center justify-between text-xs ${
                        app.documents.str
                          ? "border-neutral-800 hover:border-teal-500/50 text-neutral-300 hover:text-white cursor-pointer"
                          : "border-neutral-800/40 text-neutral-600 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-teal-400" /> STR.pdf
                      </span>
                      {app.documents.str && <Eye className="w-3 h-3 text-neutral-500" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2">
                  {app.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Setujui & Buat Akun Mitra</span>
                      </button>
                      <button
                        onClick={() => handleReject(app.id, app.name)}
                        className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-300 text-xs transition-colors cursor-pointer border border-neutral-700"
                      >
                        Tolak
                      </button>
                    </>
                  ) : app.status === "approved" ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Akun Mitra Aktif & Terverifikasi</span>
                    </div>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Lamaran Ditolak</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE COUNSELORS DIRECTORY */}
      {activeTab === "active" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Cari nama konselor, spesialisasi, atau gelar..."
                value={searchActive}
                onChange={(e) => setSearchActive(e.target.value)}
                className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-neutral-400">
              Menampilkan {activeCounselors.length} Mitra Konselor
            </span>
          </div>

          <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Nama & Gelar</th>
                  <th className="py-3 px-3">Tipe & Lisensi</th>
                  <th className="py-3 px-3">Kontak</th>
                  <th className="py-3 px-3">Total Sesi</th>
                  <th className="py-3 px-3">Spesialisasi</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {activeCounselors.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-neutral-400">{c.title}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.type === "Psikolog Klinis"
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {c.type}
                      </span>
                      {c.strNumber && (
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          STR: {c.strNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-neutral-300">
                      <div>{c.email}</div>
                      <div className="text-neutral-500">{c.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {c.totalSessions} sesi
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleCounselorStatus(c.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          c.isActive
                            ? "bg-neutral-800 hover:bg-rose-950/60 text-neutral-300 hover:text-rose-300 border-neutral-700 hover:border-rose-800"
                            : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
                        }`}
                      >
                        {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Simulasi Preview Berkas: {previewDoc.name}</span>
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-8 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-12 h-12 text-neutral-600 animate-pulse" />
              <div className="font-semibold text-white text-sm">
                [Dokumen Terenkripsi Presigned Cloudflare R2]
              </div>
              <p className="text-xs text-neutral-400 max-w-sm">
                Tautan presigned URL aman digenerate dengan masa berlaku 15 menit. Admin dapat
                memverifikasi keaslian dokumen tanpa perlu mendownload permanen di server Vercel.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
