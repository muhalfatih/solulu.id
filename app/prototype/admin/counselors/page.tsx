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
      prev.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    )
    showToast("Status keaktifan mitra diperbarui.")
  }

  const pendingCount = applicants.filter((a) => a.status === "pending").length

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Verifikasi Pelamar & Direktori Mitra Konselor
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Review dokumen kredensial WNI & kelola lisensi praktik mitra konselor aktif.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("applicants")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "applicants"
                ? "bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span>Pelamar Menunggu Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-500/30">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "active"
                ? "bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <span>Mitra Terverifikasi ({activeCounselors.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICANTS PIPELINE */}
      {activeTab === "applicants" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Seluruh berkas pelamar (KTP, Ijazah, CV, STR) tersimpan di <strong>Cloudflare R2 Private Bucket</strong>.
                Akses dokumen menggunakan tautan bertenggat 15 menit.
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
              ADR-0002 Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applicants.map((app) => (
              <div
                key={app.id}
                className={`p-6 rounded-2xl border transition-all ${
                  app.status === "approved"
                    ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                    : app.status === "rejected"
                    ? "bg-rose-50/70 border-rose-300 dark:bg-rose-950/15 dark:border-rose-900/30 opacity-70"
                    : "bg-white dark:bg-neutral-900/70 border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                } space-y-4 shadow-xs`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-neutral-900 dark:text-white text-base">
                      {app.name}
                    </h2>
                    <span
                      className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        app.type === "Psikolog Klinis"
                          ? "bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                      }`}
                    >
                      {app.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{app.appliedAt}</span>
                  </span>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 bg-neutral-50 dark:bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{app.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{app.phone}</span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 pt-1">
                    <span className="text-neutral-900 dark:text-neutral-200 font-semibold">Pendidikan:</span>{" "}
                    {app.education}
                  </div>
                  {app.strNumber && (
                    <div className="text-teal-700 dark:text-teal-400 font-mono text-[11px] font-bold">
                      STR: {app.strNumber} (Aktif)
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 italic line-clamp-2">
                    &ldquo;{app.bio}&rdquo;
                  </p>
                </div>

                {/* Document Inspection Buttons */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Inspeksi Berkas Unggahan:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ name: "KTP WNI", type: "ktp" })}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> KTP.pdf
                      </span>
                      <Eye className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ name: "Ijazah Terakhir", type: "diploma" })}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Ijazah.pdf
                      </span>
                      <Eye className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ name: "Curriculum Vitae", type: "cv" })}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> CV.pdf
                      </span>
                      <Eye className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      disabled={!app.documents.str}
                      onClick={() =>
                        app.documents.str && setPreviewDoc({ name: "Surat Tanda Registrasi", type: "str" })
                      }
                      className={`p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border flex items-center justify-between text-xs ${
                        app.documents.str
                          ? "border-neutral-200 dark:border-neutral-800 hover:border-teal-500 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer font-medium"
                          : "border-neutral-200/50 dark:border-neutral-800/40 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> STR.pdf
                      </span>
                      {app.documents.str && <Eye className="w-3.5 h-3.5 text-neutral-400" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center gap-2.5">
                  {app.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Setujui & Buat Akun Mitra</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id, app.name)}
                        className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-800 dark:bg-neutral-800 dark:hover:bg-rose-950/60 dark:text-neutral-400 dark:hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                      >
                        Tolak
                      </button>
                    </>
                  ) : app.status === "approved" ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Akun Mitra Terverifikasi</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs text-center font-bold flex items-center justify-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama konselor, spesialisasi, atau gelar..."
                value={searchActive}
                onChange={(e) => setSearchActive(e.target.value)}
                className="w-full bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
              />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Menampilkan {activeCounselors.length} Mitra Konselor
            </span>
          </div>

          <div className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/40 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200/90 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Nama & Gelar</th>
                  <th className="py-3.5 px-3">Tipe & STR</th>
                  <th className="py-3.5 px-3">Kontak</th>
                  <th className="py-3.5 px-3">Total Sesi</th>
                  <th className="py-3.5 px-3">Spesialisasi</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                {activeCounselors.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-neutral-900 dark:text-white text-sm">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{c.title}</div>
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.type === "Psikolog Klinis"
                            ? "bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                        }`}
                      >
                        {c.type}
                      </span>
                      {c.strNumber && (
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                          STR: {c.strNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-3 text-[11px]">
                      <div className="text-neutral-900 dark:text-neutral-200 font-medium">{c.email}</div>
                      <div className="text-neutral-500">{c.phone}</div>
                    </td>
                    <td className="py-4 px-3 font-bold text-neutral-900 dark:text-white">
                      {c.totalSessions} sesi
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.specializations.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-500"
                        }`}
                      >
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleCounselorStatus(c.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer border ${
                          c.isActive
                            ? "bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-800 border-neutral-200 dark:bg-neutral-800 dark:hover:bg-rose-950/60 dark:text-neutral-300 dark:hover:text-rose-300 dark:border-neutral-700"
                            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800"
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
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Simulasi Preview Berkas: {previewDoc.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-8 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-12 h-12 text-neutral-400 dark:text-neutral-600 animate-pulse" />
              <div className="font-bold text-neutral-900 dark:text-white text-sm">
                [Dokumen Terenkripsi Presigned Cloudflare R2]
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                Tautan presigned URL aman digenerate dengan masa berlaku 15 menit. Admin dapat
                memverifikasi keaslian dokumen tanpa perlu mendownload permanen di server Vercel.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold cursor-pointer"
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
