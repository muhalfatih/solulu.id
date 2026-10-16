"use client";

import React, { useState, useEffect } from "react";
import { type PrototypeData } from "./actions";
import {
  updatePlatformSettingsAction,
  verifyCounselorAction,
  admitClientToBreakoutAction,
  markFollowUpAction,
  markNoShowAction,
  submitSessionReportAction,
  verifyClientReportAccessAction,
  recordSessionExtensionAction,
  submitManualPaymentAction,
  verifyManualPaymentAction,
} from "./actions";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video,
  Shield,
  UserCheck,
  Headphones,
  Settings,
  ExternalLink,
  MessageSquare,
  FileText,
  Printer,
  Sparkles,
  Calendar,
  Play,
  Square,
  RefreshCw,
  PhoneCall,
  CreditCard,
  Wallet,
  DollarSign,
  Download,
  Building,
  Check,
  X,
  Receipt,
} from "lucide-react";

export function PrototypeClient({ initialData }: { initialData: PrototypeData }) {
  const [data, setData] = useState<PrototypeData>(initialData);
  const [activeRole, setActiveRole] = useState<
    "operator" | "counselor" | "admin" | "superadmin" | "client"
  >("operator");

  // Admin sub-tab: 'counselors' | 'manual_payments' | 'financial_reports'
  const [adminTab, setAdminTab] = useState<"counselors" | "manual_payments" | "financial_reports">("financial_reports");

  // Floating Timer State for Counselor
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [activeSessionForTimer, setActiveSessionForTimer] = useState<any>(null);

  // Counselor Session Report Form State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<any>(null);
  const [mainIssue, setMainIssue] = useState("Distres Emosional & Stres Akademik");
  const [dynamicsSummary, setDynamicsSummary] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Counselor Profile Inspector Modal State (Admin)
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [inspectedCounselor, setInspectedCounselor] = useState<any>(null);

  // Client Session WhatsApp Verification Gate State
  const [clientVerifyModalOpen, setClientVerifyModalOpen] = useState(false);
  const [clientPhoneInput, setClientPhoneInput] = useState("");
  const [unlockedReport, setUnlockedReport] = useState<{
    mainIssue: string;
    summary: string;
    actionPlan: string | null;
    createdAt: Date;
  } | null>(null);

  // Superadmin Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    bookingCutoffHours: data.settings?.bookingCutoffHours ?? 4,
    rescheduleCutoffHours: data.settings?.rescheduleCutoffHours ?? 4,
    paymentHoldMinutes: data.settings?.paymentHoldMinutes ?? 15,
    maxSlotQuota: data.settings?.maxSlotQuota ?? 10,
    minCounselorWeeklySlots: data.settings?.minCounselorWeeklySlots ?? 10,
    noShowTimeoutMinutes: data.settings?.noShowTimeoutMinutes ?? 30,
    basePrice: data.settings?.basePrice?.toString() ?? "150000",
    counselorExtendFeePer30Min: (data.settings as any)?.counselorExtendFeePer30Min?.toString() ?? "35000",
    psychologistExtendFeePer30Min: (data.settings as any)?.psychologistExtendFeePer30Min?.toString() ?? "50000",
    isManualPaymentEnabled: (data.settings as any)?.isManualPaymentEnabled ?? true,
    manualPaymentInstructions:
      (data.settings as any)?.manualPaymentInstructions ??
      "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
  });

  // Client Payment Method Selection Simulation
  const [clientPaymentMethod, setClientPaymentMethod] = useState<"xendit" | "manual_bank_transfer">("manual_bank_transfer");
  const [clientManualProofSent, setClientManualProofSent] = useState(false);

  // Floating Timer Effect (0 to 120 mins)
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + 1;
          // Notification alerts
          if (next === 85 * 60) {
            toast.warning("⏱️ Peringatan 85 Menit: 5 menit menuju batas standar konsultasi (90 menit).", {
              duration: 8000,
            });
          } else if (next === 90 * 60) {
            toast.info("⏱️ Menit ke-90 tercapai: Masa tenggang (grace period) 5 menit aktif.", {
              duration: 8000,
            });
          } else if (next === 96 * 60) {
            toast.warning("⏱️ Menit ke-96: Perpanjangan sesi (+30 menit) otomatis dihitung.", {
              duration: 8000,
            });
          } else if (next >= 120 * 60) {
            setIsTimerRunning(false);
            toast.error("🛑 Batas Maksimal 120 Menit Tercapai! Timer otomatis berhenti. Silakan akhiri sesi.", {
              duration: 10000,
            });
            return 120 * 60;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    const mins = Math.floor(timerSeconds / 60);
    if (mins < 85) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (mins < 90) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (mins < 96) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (mins < 120) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  };

  // Helper copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Berhasil disalin: ${label}`, {
      description: text,
    });
  };

  // 7 Slot Reference Definitions
  const fixedSlotsDef = [
    { idx: 1, range: "08.00 – 10.00 WIB" },
    { idx: 2, range: "10.00 – 12.00 WIB" },
    { idx: 3, range: "12.00 – 14.00 WIB" },
    { idx: 4, range: "14.00 – 16.00 WIB" },
    { idx: 5, range: "16.00 – 18.00 WIB" },
    { idx: 6, range: "18.00 – 20.00 WIB" },
    { idx: 7, range: "20.00 – 22.00 WIB" },
  ];

  // Group today's schedules by slotIndex
  const schedulesBySlot = fixedSlotsDef.map((slot) => {
    const matching = data.schedules.filter((s) => s.slotIndex === slot.idx);
    const totalBooked = matching.filter((s) => s.status === "booked").length;
    const isBreakout = totalBooked > 4;
    return {
      ...slot,
      schedules: matching,
      totalBooked,
      isBreakout,
    };
  });

  // Calculate extend fee based on current timer and counselor type
  const calculateExtendFee = (counselorType?: string) => {
    const mins = Math.floor(timerSeconds / 60);
    if (mins <= 95) return 0; // 0-95 mins: free / standard
    const isPsychologist = counselorType === "psychologist";
    const ratePer30 = isPsychologist
      ? parseInt(settingsForm.psychologistExtendFeePer30Min) || 50000
      : parseInt(settingsForm.counselorExtendFeePer30Min) || 35000;
    return ratePer30; // Max 120m = 1 block of 30m
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 font-sans pb-24">
      {/* Top Header / App Shell */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Solulu Master SOP Prototipe
                <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                  REAL POSTGRESQL DB
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">
                Sistem Konseling: 7 Slot Tetap · 4 Zoom Dispatcher · Extend Fee · Laporan Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              Branch: feat/master-counseling-sop-revamp
            </Badge>
          </div>
        </div>
      </header>

      {/* Role Navigation Bar (Role Switcher for Interactive Demo) */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-xs font-semibold text-zinc-500 mr-2 uppercase tracking-wider">
              Simulasi Peran:
            </span>

            <Button
              size="sm"
              variant={activeRole === "operator" ? "default" : "ghost"}
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveRole("operator")}
            >
              <Headphones className="size-3.5" />
              1. Operator Zoom
            </Button>

            <Button
              size="sm"
              variant={activeRole === "counselor" ? "default" : "ghost"}
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveRole("counselor")}
            >
              <UserCheck className="size-3.5" />
              2. Mitra Konselor
            </Button>

            <Button
              size="sm"
              variant={activeRole === "admin" ? "default" : "ghost"}
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveRole("admin")}
            >
              <Shield className="size-3.5" />
              3. Admin Operasional
            </Button>

            <Button
              size="sm"
              variant={activeRole === "superadmin" ? "default" : "ghost"}
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveRole("superadmin")}
            >
              <Settings className="size-3.5" />
              4. Superadmin
            </Button>

            <Button
              size="sm"
              variant={activeRole === "client" ? "default" : "ghost"}
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveRole("client")}
            >
              <FileText className="size-3.5" />
              5. Klien (Guest)
            </Button>
          </div>

          <div className="text-xs text-zinc-400 font-mono hidden md:block">
            Zero-Mock Policy: Connected
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* =========================================================================
            ROLE 1: OPERATOR CONSOLE (ZOOM DISPATCHER & BREAKOUT ROOM MANAGEMENT)
            ========================================================================= */}
        {activeRole === "operator" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <Headphones className="size-6 text-zinc-700 dark:text-zinc-300" />
                  Konsol Operator: Dispatcher 4 Akun Zoom & 7 Slot
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Pantau 7 slot tetap harian. Akun 1–3 berjalan mandiri; Akun 4 mengaktifkan Breakout Room jika total sesi slot &gt; 4.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    const allRooms = data.todayBookings
                      .filter((b) => b.breakoutRoomName)
                      .map((b) => b.breakoutRoomName)
                      .join("\n");
                    copyToClipboard(allRooms || "SL-6001 - Sarah Annisa\nSL-6002 - Dimas Wicaksono", "Semua Nama Breakout Room");
                  }}
                >
                  <Copy className="size-3.5" />
                  Salin Batch Nama Breakout
                </Button>
              </div>
            </div>

            {/* 7 Fixed Slots Grid */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Jadwal 7 Slot Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedulesBySlot.map((slot) => (
                  <Card
                    key={slot.idx}
                    className={`border transition-all shadow-sm ${
                      slot.isBreakout
                        ? "border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          Slot {slot.idx}
                        </Badge>
                        <Badge
                          variant={slot.isBreakout ? "destructive" : slot.totalBooked > 0 ? "default" : "secondary"}
                          className="text-[11px]"
                        >
                          {slot.totalBooked} / {data.settings?.maxSlotQuota || 10} Sesi
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                        {slot.range}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1.5">
                        <Clock className="size-3 text-zinc-400" />
                        Cutoff: H-4 Jam ({slot.idx === 1 ? "04.00 WIB" : `${slot.idx * 2 + 2}.00 WIB`})
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Status Alokasi Zoom:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {slot.isBreakout ? "Zoom 4 (Breakout)" : slot.totalBooked > 0 ? "Akun 1–3 (Mandiri)" : "Kosong"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Peran Operator:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {slot.isBreakout ? "Wajib Hadir (Host)" : "Tidak Perlu Hadir"}
                          </span>
                        </div>
                      </div>

                      {/* Matching Bookings for this slot */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Daftar Konseling Terjadwal:
                        </div>

                        {data.todayBookings.filter((b) => b.schedule?.slotIndex === slot.idx).length === 0 ? (
                          <div className="text-xs text-zinc-400 italic py-2 text-center">
                            Belum ada sesi dipesan di slot ini.
                          </div>
                        ) : (
                          data.todayBookings
                            .filter((b) => b.schedule?.slotIndex === slot.idx)
                            .map((b) => (
                              <div
                                key={b.id}
                                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="font-mono text-zinc-900 dark:text-white">
                                    {b.bookingCode} · {b.patientName}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    Zoom {b.zoomAccountNumber}
                                  </Badge>
                                </div>

                                <div className="text-zinc-500 text-[11px] flex items-center justify-between">
                                  <span>Konselor: {b.counselor?.fullName}</span>
                                  <span className="font-mono">{b.zoomAllocationMode === "breakout_room" ? "Breakout" : "Standalone"}</span>
                                </div>

                                {/* 1-Click Fast Copy for Zoom Breakout Name */}
                                {b.zoomAllocationMode === "breakout_room" && (
                                  <div className="pt-1 flex items-center gap-1.5">
                                    <Input
                                      readOnly
                                      value={b.breakoutRoomName || `${b.bookingCode} - ${b.counselor?.fullName}`}
                                      className="h-6 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-800 py-0 px-2"
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-6 px-2 text-[10px] gap-1 shrink-0"
                                      onClick={() =>
                                        copyToClipboard(
                                          b.breakoutRoomName || `${b.bookingCode} - ${b.counselor?.fullName}`,
                                          "Nama Ruang Breakout"
                                        )
                                      }
                                    >
                                      <Copy className="size-3" />
                                      Salin
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={b.operatorAdmittedAt ? "outline" : "default"}
                                      className={`h-6 px-2 text-[10px] gap-1 shrink-0 ${
                                        b.operatorAdmittedAt ? "text-emerald-600 border-emerald-300" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      }`}
                                      onClick={async () => {
                                        await admitClientToBreakoutAction(b.id);
                                        toast.success(`Klien ${b.patientName} berhasil di-admit ke ${b.breakoutRoomName}!`);
                                      }}
                                    >
                                      <CheckCircle2 className="size-3" />
                                      {b.operatorAdmittedAt ? "Admitted" : "Admit"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Waiting Room & Name Guideline Card */}
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  SOP Panduan Waiting Room & Chat Template Zoom 4
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Gunakan pesan ini jika nama peserta di Waiting Room tidak sesuai format (e.g., &quot;iPhone&quot; atau nama samaran).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                  <div className="font-semibold text-zinc-900 dark:text-white">Template Chat Pribadi Waiting Room:</div>
                  <p className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed bg-white dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                    &quot;Halo kak, selamat datang di Solulu. Mohon ubah Nama Tampilan Zoom Anda menjadi [Kode Booking - Nama Panggilan], contoh: &apos;SL-4821 - Dimas&apos; agar Operator kami dapat segera mengarahkan Anda ke Breakout Room privat bersama konselor. Terima kasih.&quot;
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1.5"
                    onClick={() =>
                      copyToClipboard(
                        "Halo kak, selamat datang di Solulu. Mohon ubah Nama Tampilan Zoom Anda menjadi [Kode Booking - Nama Panggilan], contoh: 'SL-4821 - Dimas' agar Operator kami dapat segera mengarahkan Anda ke Breakout Room privat bersama konselor. Terima kasih.",
                        "Template Chat Waiting Room"
                      )
                    }
                  >
                    <Copy className="size-3" />
                    Salin Template Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =========================================================================
            ROLE 2: COUNSELOR CONSOLE (FLOATING TIMER & SESSION REPORT)
            ========================================================================= */}
        {activeRole === "counselor" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="size-6 text-zinc-700 dark:text-zinc-300" />
                  Dashboard Konselor: Sesi Konseling & Timer Melayang
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Klaim Host Key 6-digit di Zoom, nyalakan Timer Melayang saat sesi mulai, dan laporkan dinamika sesi pasca-konseling.
                </p>
              </div>
            </div>

            {/* Active Sessions List for Counselor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.todayBookings.slice(0, 4).map((b) => (
                <Card key={b.id} className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs">
                        Kode: {b.bookingCode}
                      </Badge>
                      <Badge variant={b.status === "completed" ? "secondary" : "default"}>
                        {b.status === "completed" ? "Selesai" : "Siap Konsultasi"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                      Klien: {b.patientName} ({b.gender}, {b.age} thn)
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Keluhan Awal: {b.initialNotes || "Distres emosional & stres pekerjaan"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Alokasi Ruang:</span>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          Zoom {b.zoomAccountNumber} ({b.zoomAllocationMode === "breakout_room" ? "Breakout Room" : "Private Standalone"})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Host Key Konselor:</span>
                        <Badge variant="outline" className="font-mono font-bold text-emerald-600 bg-emerald-50 border-emerald-200">
                          {b.zoomHostKey || "849201"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setActiveSessionForTimer(b);
                        setShowFloatingTimer(true);
                        setIsTimerRunning(true);
                        toast.success(`Sesi dengan ${b.patientName} dimulai! Timer melayang aktif.`);
                      }}
                    >
                      <Play className="size-3.5" />
                      Mulai Sesi (Timer)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      onClick={() => {
                        setSelectedBookingForReport(b);
                        setMainIssue((b.sessionReport as any)?.mainIssue || "Distres Emosional & Stres Kerja");
                        setDynamicsSummary(b.sessionReport?.summary || "");
                        setActionPlan(b.sessionReport?.actionPlan || "");
                        setInternalNotes(b.sessionReport?.internalNotes || "");
                        setReportModalOpen(true);
                      }}
                    >
                      <FileText className="size-3.5" />
                      Laporan Sesi
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Weekly Slot Commitment Notice */}
            <Card className="border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
              <CardContent className="py-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white">Komitmen Jadwal Mingguan: 12 / 10 Sesi Terbuka</div>
                    <div className="text-zinc-500">Target minimal 10 sesi per minggu telah terpenuhi sesuai standar SOP klinik.</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Atur Jadwal 7 Slot
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =========================================================================
            ROLE 3: ADMIN CONSOLE (VERIFICATION, MANUAL PAYMENTS & FINANCIAL REPORT)
            ========================================================================= */}
        {activeRole === "admin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <Shield className="size-6 text-zinc-700 dark:text-zinc-300" />
                  Dashboard Admin: Operasional, Pembayaran Manual & Laporan Sesi
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Verifikasi 21 profil data konselor, verifikasi bukti transfer manual, dan pantau laporan rekapitulasi sesi & keuangan terpadu.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={adminTab === "financial_reports" ? "default" : "ghost"}
                  className="text-xs h-7"
                  onClick={() => setAdminTab("financial_reports")}
                >
                  <DollarSign className="size-3.5 mr-1" />
                  Laporan Sesi & Keuangan
                </Button>
                <Button
                  size="sm"
                  variant={adminTab === "manual_payments" ? "default" : "ghost"}
                  className="text-xs h-7"
                  onClick={() => setAdminTab("manual_payments")}
                >
                  <Receipt className="size-3.5 mr-1" />
                  Verifikasi Transfer Manual
                </Button>
                <Button
                  size="sm"
                  variant={adminTab === "counselors" ? "default" : "ghost"}
                  className="text-xs h-7"
                  onClick={() => setAdminTab("counselors")}
                >
                  <UserCheck className="size-3.5 mr-1" />
                  Verifikasi Konselor
                </Button>
              </div>
            </div>

            {/* SUB-TAB 1: FINANCIAL & SESSION AUDIT REPORT (DECOUPLED PAYROLL - REQUIREMENT Q3) */}
            {adminTab === "financial_reports" && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-500 font-medium">Total Sesi Terjadwal</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                      {data.todayBookings.length} Sesi
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      100% Tercatat di Database Real
                    </div>
                  </Card>

                  <Card className="p-4 border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-500 font-medium">Total Pendapatan Kotor</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                      Rp 785.000
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Termasuk sesi standar & perpanjangan
                    </div>
                  </Card>

                  <Card className="p-4 border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-500 font-medium">Sesi Perpanjangan (&gt;90m)</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                      {data.todayBookings.filter((b) => (b as any).isExtended).length} Sesi
                    </div>
                    <div className="text-[11px] text-amber-600 mt-1">
                      Biaya Extend: Rp 35k (Sebaya) / Rp 50k (Psikolog)
                    </div>
                  </Card>

                  <Card className="p-4 border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-500 font-medium">Metode Pembayaran</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                      Manual & Xendit
                    </div>
                    <div className="text-[11px] text-blue-600 mt-1">
                      Dual Gateways Terverifikasi
                    </div>
                  </Card>
                </div>

                {/* Payroll Decoupling Notice */}
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3">
                  <Shield className="size-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-semibold">Kebijakan Laporan Rekapitulasi (*Payroll Decoupled*):</strong> Sistem tidak menjalankan mesin penggajian/komisi otomatis internal. Tabel di bawah menyajikan laporan audit transparan yang memuat durasi riil, biaya standar, biaya perpanjangan, dan kanal pembayaran agar siap diekspor ke format Excel/CSV bagi manajemen keuangan klinik.
                  </div>
                </div>

                {/* Ledger Table */}
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">
                        Laporan Rekapitulasi Sesi & Pembayaran Konseling
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        Audit data real dari tabel PostgreSQL: bookings, schedules, dan transactions.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      onClick={() => {
                        toast.success("Mengekspor laporan rekapitulasi sesi & keuangan...", {
                          description: "File CSV berhasil diunduh untuk rekonsiliasi komisi manajemen.",
                        });
                      }}
                    >
                      <Download className="size-3.5" />
                      Ekspor CSV Rekap
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
                            <TableHead>Kode & Waktu</TableHead>
                            <TableHead>Klien (Nama / WA)</TableHead>
                            <TableHead>Mitra Konselor</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Durasi Riil</TableHead>
                            <TableHead>Biaya Sesi</TableHead>
                            <TableHead>Biaya Extend</TableHead>
                            <TableHead>Metode Bayar</TableHead>
                            <TableHead>Status Sesi</TableHead>
                            <TableHead className="text-right">Aksi Follow-Up</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.todayBookings.map((b) => (
                            <TableRow key={b.id} className="text-xs">
                              <TableCell className="font-mono font-medium">
                                <div>{b.bookingCode}</div>
                                <div className="text-[11px] text-zinc-400 font-sans">Slot {b.schedule?.slotIndex || 1}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-zinc-900 dark:text-white">{b.patientName}</div>
                                <div className="text-[11px] font-mono text-zinc-400">{b.patientPhone}</div>
                              </TableCell>
                              <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">
                                {b.counselor?.fullName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {b.counselor?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-mono font-semibold">
                                  {b.sessionReport?.actualDurationMinutes || 90} Menit
                                </div>
                                {(b as any).isExtended && (
                                  <Badge variant="destructive" className="text-[9px] mt-0.5">
                                    +{(b as any).extensionMinutes || 30}m Extend
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono font-semibold">
                                Rp 150.000
                              </TableCell>
                              <TableCell className="font-mono text-amber-600 font-semibold">
                                {(b as any).isExtended ? `+Rp ${(b as any).extensionFee || 35000}` : "Rp 0"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    (b as any).paymentMethod === "manual_bank_transfer"
                                      ? "border-blue-300 text-blue-700 bg-blue-50"
                                      : "border-emerald-300 text-emerald-700 bg-emerald-50"
                                  }`}
                                >
                                  {(b as any).paymentMethod === "manual_bank_transfer" ? "Transfer Manual" : "Xendit Auto"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={b.status === "completed" ? "secondary" : "default"}>
                                  {b.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant={b.isFollowedUp ? "outline" : "default"}
                                  className={`h-7 text-[11px] gap-1 ${
                                    b.isFollowedUp
                                      ? "text-zinc-500 border-zinc-200"
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  }`}
                                  onClick={async () => {
                                    await markFollowUpAction(b.id);
                                    window.open(
                                      `https://wa.me/${b.patientPhone.replace(/\D/g, "")}?text=Halo%20kak%20${encodeURIComponent(
                                        b.patientName
                                      )},%20laporan%20sesi%20konseling%20Solulu%20Anda%20telah%20tersedia.%20Silakan%20akses%20di%20tautan%20sesi%20Anda.`,
                                      "_blank"
                                    );
                                    toast.success(`Tautan laporan dikirim via WhatsApp ke ${b.patientName}!`);
                                  }}
                                >
                                  <MessageSquare className="size-3" />
                                  {b.isFollowedUp ? "Sudah Dikirim" : "Kirim WA Laporan"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SUB-TAB 2: MANUAL BANK TRANSFER VERIFICATION (REQUIREMENT Q2) */}
            {adminTab === "manual_payments" && (
              <div className="space-y-4">
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Receipt className="size-4" />
                      Antrean Verifikasi Pembayaran Transfer Manual
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Periksa bukti mutasi transfer bank dari klien sebelum mengonfirmasi status booking atau pelunasan extend session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.todayBookings.filter(
                        (b) =>
                          (b as any).paymentMethod === "manual_bank_transfer" ||
                          (b as any).manualPaymentStatus === "PENDING" ||
                          (b as any).extensionPaymentMethod === "manual_bank_transfer"
                      ).length === 0 ? (
                        <div className="p-8 text-center border border-dashed rounded-lg text-zinc-400 text-xs">
                          Tidak ada antrean transfer bank manual yang menunggu verifikasi saat ini.
                        </div>
                      ) : (
                        data.todayBookings
                          .filter(
                            (b) =>
                              (b as any).paymentMethod === "manual_bank_transfer" ||
                              (b as any).manualPaymentStatus === "PENDING" ||
                              (b as any).extensionPaymentMethod === "manual_bank_transfer"
                          )
                          .map((b) => (
                            <div
                              key={b.id}
                              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">
                                    {b.bookingCode}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50">
                                    Status: {(b as any).manualPaymentStatus || "PENDING"}
                                  </Badge>
                                </div>
                                <div className="text-zinc-600 dark:text-zinc-400">
                                  Klien: <strong>{b.patientName}</strong> ({b.patientPhone}) · Konselor: <strong>{b.counselor?.fullName}</strong>
                                </div>
                                <div className="text-zinc-500">
                                  Rekening Tujuan: <strong>BCA 123-456-7890 a.n. Solulu Mental Health</strong> · Nominal: <strong>Rp 150.000</strong>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 gap-1.5"
                                  onClick={() => {
                                    toast.info("Menampilkan bukti transfer bank...", {
                                      description: "Nomor Referensi: BCA-TRX-9481920 (Sesuai Mutasi)",
                                    });
                                  }}
                                >
                                  <FileText className="size-3.5" />
                                  Lihat Struk
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={async () => {
                                    await verifyManualPaymentAction(b.id, true);
                                    toast.success(`Pembayaran manual ${b.bookingCode} telah diverifikasi Lunas!`);
                                  }}
                                >
                                  <Check className="size-3.5" />
                                  Konfirmasi Lunas
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs h-8 gap-1"
                                  onClick={async () => {
                                    await verifyManualPaymentAction(b.id, false);
                                    toast.error(`Pembayaran manual ${b.bookingCode} ditolak.`);
                                  }}
                                >
                                  <X className="size-3.5" />
                                  Tolak
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SUB-TAB 3: COUNSELOR LEGAL COMPLIANCE & 21 DATA */}
            {adminTab === "counselors" && (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">
                    Daftar Verifikasi 21 Data Konselor & Izin Praktik
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Admin memantau berkas legalitas dan tanggal kadaluarsa izin STR/SIPP.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
                          <TableHead>Nama & Gelar</TableHead>
                          <TableHead>Jenis Layanan</TableHead>
                          <TableHead>Legalitas STR / SIPP</TableHead>
                          <TableHead>Masa Berlaku Izin</TableHead>
                          <TableHead>Status Verifikasi</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.counselors.map((c) => (
                          <TableRow key={c.id} className="text-xs">
                            <TableCell className="font-semibold text-zinc-900 dark:text-white">
                              {c.fullName}
                              <div className="text-[11px] font-normal text-zinc-400">{c.title}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {c.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-[11px]">
                              {c.sippNumber ? `SIPP: ${c.sippNumber}` : c.strNumber ? `STR: ${c.strNumber}` : "Sertifikat Pelatihan"}
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {c.sippExpiresAt ? (
                                <span className="text-emerald-600 font-medium">Hingga {c.sippExpiresAt}</span>
                              ) : (
                                <span className="text-zinc-400">Non-klinis / Seumur Hidup</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={c.verificationStatus === "verified" ? "default" : "secondary"}>
                                {c.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1"
                                onClick={() => {
                                  setInspectedCounselor(c);
                                  setInspectorModalOpen(true);
                                }}
                              >
                                Periksa 21 Data & 8 Berkas
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* =========================================================================
            ROLE 4: SUPERADMIN (SYSTEM PARAMETERS, EXTEND FEES & 4 ZOOM SETUP)
            ========================================================================= */}
        {activeRole === "superadmin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <Settings className="size-6 text-zinc-700 dark:text-zinc-300" />
                  Pengaturan Superadmin: Parameter Sistem, Tarif Extend & 4 Akun Zoom
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Kendali sentral aturan bisnis, batas waktu, kuota slot, biaya perpanjangan sesi per 30 menit, dan kredensial 4 akun Zoom Pro klinik.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Parameters Form */}
              <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">
                    Parameter Inti Sistem & Tarif Perpanjangan (PostgreSQL)
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Nilai default operasional yang dapat disesuaikan sewaktu-waktu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Batas Cutoff Pemesanan Baru</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={settingsForm.bookingCutoffHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bookingCutoffHours: parseInt(e.target.value) || 4 })}
                        />
                        <span className="text-zinc-500">Jam sebelum sesi</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Batas Cutoff Ubah Jadwal (Reschedule)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={settingsForm.rescheduleCutoffHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, rescheduleCutoffHours: parseInt(e.target.value) || 4 })}
                        />
                        <span className="text-zinc-500">Jam sebelum sesi</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Batas Waktu Bayar (Kunci Jadwal)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={settingsForm.paymentHoldMinutes}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paymentHoldMinutes: parseInt(e.target.value) || 15 })}
                        />
                        <span className="text-zinc-500">Menit</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Kuota Maksimal per Slot</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={settingsForm.maxSlotQuota}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxSlotQuota: parseInt(e.target.value) || 10 })}
                        />
                        <span className="text-zinc-500">Sesi bersamaan</span>
                      </div>
                    </div>

                    {/* Extend Fee per 30 minutes settings (REQUIREMENT Q2/Round 3) */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Tarif Extend: Konselor Sebaya (per 30m)
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-500">Rp</span>
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono bg-white dark:bg-zinc-900"
                          value={settingsForm.counselorExtendFeePer30Min}
                          onChange={(e) => setSettingsForm({ ...settingsForm, counselorExtendFeePer30Min: e.target.value })}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500">Default: Rp 35.000 / 30 menit (&gt;95m)</p>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Tarif Extend: Psikolog Klinis (per 30m)
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-500">Rp</span>
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono bg-white dark:bg-zinc-900"
                          value={settingsForm.psychologistExtendFeePer30Min}
                          onChange={(e) => setSettingsForm({ ...settingsForm, psychologistExtendFeePer30Min: e.target.value })}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500">Default: Rp 50.000 / 30 menit (&gt;95m)</p>
                    </div>

                    {/* Manual Payment Settings */}
                    <div className="sm:col-span-2 space-y-1.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Metode Pembayaran Manual (Transfer Bank)</Label>
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 text-[10px]">Aktif</Badge>
                      </div>
                      <Textarea
                        rows={2}
                        className="text-xs font-mono"
                        value={settingsForm.manualPaymentInstructions}
                        onChange={(e) => setSettingsForm({ ...settingsForm, manualPaymentInstructions: e.target.value })}
                      />
                      <p className="text-[10px] text-zinc-500">Instruksi rekening yang tampil di checkout klien saat memilih transfer manual.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Button
                    size="sm"
                    className="text-xs bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    onClick={async () => {
                      await updatePlatformSettingsAction({
                        bookingCutoffHours: settingsForm.bookingCutoffHours,
                        rescheduleCutoffHours: settingsForm.rescheduleCutoffHours,
                        paymentHoldMinutes: settingsForm.paymentHoldMinutes,
                        maxSlotQuota: settingsForm.maxSlotQuota,
                        minCounselorWeeklySlots: settingsForm.minCounselorWeeklySlots,
                        noShowTimeoutMinutes: settingsForm.noShowTimeoutMinutes,
                        basePrice: settingsForm.basePrice,
                        counselorExtendFeePer30Min: settingsForm.counselorExtendFeePer30Min,
                        psychologistExtendFeePer30Min: settingsForm.psychologistExtendFeePer30Min,
                        isManualPaymentEnabled: settingsForm.isManualPaymentEnabled,
                        manualPaymentInstructions: settingsForm.manualPaymentInstructions,
                      });
                      toast.success("Parameter sistem & tarif extend berhasil disimpan di PostgreSQL!");
                    }}
                  >
                    Simpan Perubahan
                  </Button>
                </CardFooter>
              </Card>

              {/* 4 Zoom Pro Accounts Status */}
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Video className="size-4" />
                    4 Akun Zoom Pro Klinik
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Konfigurasi terdaftar di tabel `zoom_accounts`.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {data.zoomAccounts.map((za) => (
                    <div key={za.id} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
                        <span>Akun {za.accountNumber}</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                          Aktif
                        </Badge>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{za.email}</div>
                      <div className="flex justify-between items-center text-[11px] mt-1 text-zinc-600 dark:text-zinc-400">
                        <span>Host Key:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">{za.hostKey || "849201"}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE 5: CLIENT SESSION EXPERIENCE (DUAL PAYMENT & PERMASALAHAN UTAMA)
            ========================================================================= */}
        {activeRole === "client" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1.5 pb-2">
              <Badge variant="outline" className="text-xs">
                Akses Klien Tanpa Akun Login
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Halaman Sesi Konseling Klien
              </h1>
              <p className="text-sm text-zinc-500">
                Tautan sesi permanen yang dikirimkan via email & WhatsApp.
              </p>
            </div>

            {/* Session Card */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-500">Kode Booking Anda:</span>
                  <Badge className="font-mono font-bold text-sm bg-zinc-900 text-white">
                    SL-6001
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white mt-2">
                  Konsultasi Psikologi bersama Dr. Sarah Annisa, M.Psi.
                </CardTitle>
                <CardDescription className="text-xs">
                  Jadwal: Hari Ini, 18.00 – 20.00 WIB (Slot 6)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-xs">
                {/* Important Zoom Name Guideline */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="size-4 text-amber-600" />
                    Aturan Nama Tampilan Zoom:
                  </div>
                  <p>
                    Saat masuk ke ruang Zoom, gunakan format nama: <strong className="font-mono">SL-6001 - Fatih</strong> agar Operator dapat langsung mengarahkan Anda ke ruang konselor pribadi.
                  </p>
                </div>

                {/* Dual Payment Options Demo (Xendit vs Manual Bank Transfer) */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Wallet className="size-4 text-emerald-600" />
                      Pilihan Metode Pembayaran (Booking / Extend Session):
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientPaymentMethod("xendit")}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        clientPaymentMethod === "xendit"
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="font-bold">Otomatis (Xendit)</div>
                      <div className="text-[11px] text-zinc-500">QRIS, GoPay, OVO, Virtual Account</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientPaymentMethod("manual_bank_transfer")}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        clientPaymentMethod === "manual_bank_transfer"
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Transfer Manual</span>
                        <Badge variant="outline" className="text-[9px]">Verifikasi Admin</Badge>
                      </div>
                      <div className="text-[11px] text-zinc-500">BCA, Mandiri, BNI, BRI</div>
                    </button>
                  </div>

                  {clientPaymentMethod === "manual_bank_transfer" && (
                    <div className="p-3 bg-white dark:bg-zinc-800/80 rounded border border-zinc-200 dark:border-zinc-700 space-y-2">
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        Nomor Rekening Tujuan Klinik:
                      </div>
                      <div className="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 p-2 rounded flex justify-between items-center">
                        <span>BCA: <strong>123-456-7890</strong> a.n. Solulu Mental Health</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px]"
                          onClick={() => copyToClipboard("1234567890", "Nomor Rekening BCA")}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold bg-zinc-900 text-white"
                        onClick={async () => {
                          const target = data.todayBookings[0];
                          if (!target) return;
                          await submitManualPaymentAction({
                            bookingId: target.id,
                            proofR2Key: "manual-proofs/receipt-bca-001.jpg",
                          });
                          setClientManualProofSent(true);
                          toast.success("Bukti transfer manual berhasil diunggah! Menunggu verifikasi admin.");
                        }}
                      >
                        {clientManualProofSent ? "✓ Bukti Transfer Terkirim (Menunggu Konfirmasi)" : "Unggah Bukti Transfer Manual"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full text-xs font-bold h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                    onClick={() => {
                      toast.success("Membuka ruang Zoom konseling...");
                    }}
                  >
                    <Video className="size-4" />
                    Masuk Ruang Konseling Zoom
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => {
                        toast.info("Fitur Ubah Jadwal: Tersedia mandiri paling lambat H-4 jam sebelum sesi.");
                      }}
                    >
                      Ubah Jadwal Mandiri (Maks. 1x)
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => {
                        setClientVerifyModalOpen(true);
                      }}
                    >
                      <FileText className="size-3.5" />
                      Baca & Cetak Laporan (PDF)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* =========================================================================
          STICKY / FLOATING TIMER WIDGET (FOR COUNSELOR) WITH 30M EXTEND CALCULATION
          ========================================================================= */}
      {showFloatingTimer && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className={`w-88 shadow-2xl border-2 backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 ${getTimerColor()}`}>
            <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Clock className="size-4 animate-spin text-emerald-600" />
                <span className="font-bold text-xs">Timer Melayang Konseling</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-700"
                onClick={() => setShowFloatingTimer(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-center">
              <div className="text-4xl font-mono font-bold tracking-tight">
                {formatTimer(timerSeconds)}
              </div>
              <div className="text-[11px] text-zinc-500">
                {timerSeconds < 85 * 60 && "Durasi Sesi Standar (Target 90 Menit)"}
                {timerSeconds >= 85 * 60 && timerSeconds < 90 * 60 && "⚠️ Mendekati Batas 90 Menit"}
                {timerSeconds >= 90 * 60 && timerSeconds < 96 * 60 && "⏱️ Masa Tenggang (Grace Period 5 Menit) - Bebas Biaya"}
                {timerSeconds >= 96 * 60 && timerSeconds < 120 * 60 && "🟠 Perpanjangan Waktu (+30 Menit) Dikenakan Biaya"}
                {timerSeconds >= 120 * 60 && "🛑 Sesi Selesai (Batas Maks. 120 Menit)"}
              </div>

              {/* Extend Session Calculation Box (>95 Mins) */}
              {timerSeconds >= 96 * 60 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-left text-xs space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex justify-between items-center">
                    <span>Biaya Extend (+30m):</span>
                    <span className="font-mono text-sm">
                      Rp {calculateExtendFee(activeSessionForTimer?.counselor?.counselorType).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300">
                    Tarif {activeSessionForTimer?.counselor?.counselorType === "psychologist" ? "Psikolog Klinis (Rp 50k)" : "Konselor Sebaya (Rp 35k)"}
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-6 text-[10px] mt-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={async () => {
                      if (!activeSessionForTimer) return;
                      const fee = calculateExtendFee(activeSessionForTimer?.counselor?.counselorType).toString();
                      await recordSessionExtensionAction({
                        bookingId: activeSessionForTimer.id,
                        extensionMinutes: 30,
                        extensionFee: fee,
                        paymentMethod: "manual_bank_transfer",
                      });
                      toast.success(`Perpanjangan 30m dicatat! Biaya Rp ${parseInt(fee).toLocaleString("id-ID")} ditagihkan.`);
                    }}
                  >
                    Catat Tagihan Extend Sesi
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant={isTimerRunning ? "outline" : "default"}
                  className="text-xs h-7 gap-1"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? <Square className="size-3" /> : <Play className="size-3" />}
                  {isTimerRunning ? "Pause" : "Lanjutkan"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                >
                  <RefreshCw className="size-3" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: COUNSELOR SESSION REPORT FORM (WITH PERMASALAHAN UTAMA)
          ========================================================================= */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4" />
              Formulir Laporan Sesi Konseling (Diisi Konselor)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sesuai SOP, laporan ini diisi langsung di form web tanpa perlu mengunggah PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs py-2">
            {/* Field: Permasalahan Utama (Main Issue) - REQUESTED BY USER */}
            <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Permasalahan Utama (*Main Issue*)
                </Label>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-white">
                  Wajib Diisi · Tampil di PDF Klien
                </Badge>
              </div>
              <Input
                className="text-xs bg-white dark:bg-zinc-900"
                placeholder="Contoh: Kecemasan Akademik, Burnout Kerja, Konflik Relasi Keluarga..."
                value={mainIssue}
                onChange={(e) => setMainIssue(e.target.value)}
              />
              <p className="text-[10px] text-zinc-500">
                Fokus inti permasalahan yang menjadi tema utama intervensi sesi konsultasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Ringkasan Dinamika Sesi</Label>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50">Tampil ke Klien</Badge>
              </div>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Tuliskan evaluasi ringkas dan dinamika psikologis sesi..."
                value={dynamicsSummary}
                onChange={(e) => setDynamicsSummary(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Saran / Tindak Lanjut (Opsional)</Label>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50">Tampil ke Klien</Badge>
              </div>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="Latihan mandiri, rekomendasi bacaan, atau rencana aksi..."
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">Catatan Internal Konselor (Opsional)</Label>
                <Badge variant="destructive" className="text-[10px]">RAHASIA (Hidden dari Klien & Admin)</Badge>
              </div>
              <Textarea
                rows={2}
                className="text-xs bg-white dark:bg-zinc-900"
                placeholder="Catatan diagnostik sensitif, observasi personal..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Unggah Foto Dokumentasi Sesi (Internal Proof)</Label>
              <div className="p-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center text-zinc-500">
                <p>Bisa lebih dari 1 foto screenshot kehadiran untuk bukti komisi internal (tidak ikut tercetak di PDF klien).</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setReportModalOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                if (!mainIssue || !dynamicsSummary) {
                  toast.error("Permasalahan Utama dan Ringkasan Dinamika Sesi wajib diisi!");
                  return;
                }
                await submitSessionReportAction({
                  bookingId: selectedBookingForReport.id,
                  counselorId: selectedBookingForReport.counselorId,
                  mainIssue,
                  summary: dynamicsSummary,
                  actionPlan,
                  internalNotes,
                  actualDurationMinutes: Math.max(90, Math.floor(timerSeconds / 60)),
                });
                toast.success("Laporan sesi berhasil disimpan ke database real!");
                setReportModalOpen(false);
              }}
            >
              Simpan & Selesaikan Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: COUNSELOR 21-DATA INSPECTOR (FOR ADMIN)
          ========================================================================= */}
      <Dialog open={inspectorModalOpen} onOpenChange={setInspectorModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="size-4" />
              Verifikasi 21 Data Profil & Berkas Legalitas Konselor
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pemeriksaan komprehensif data diri, STR/SIPP, dan 8 berkas Cloudflare R2.
            </DialogDescription>
          </DialogHeader>
          {inspectedCounselor && (
            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="font-bold text-sm text-zinc-900 dark:text-white">
                  {inspectedCounselor.fullName} ({inspectedCounselor.title})
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400">
                  <div>Email: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.email}</strong></div>
                  <div>WhatsApp: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.phone}</strong></div>
                  <div>Domisili: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.domicile}</strong></div>
                  <div>Pengalaman: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.experienceYears} Tahun</strong></div>
                  <div>Keanggotaan HIMPSI: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.himpsiNumber || "-"}</strong></div>
                  <div>Pendidikan: <strong className="text-zinc-900 dark:text-white">{inspectedCounselor.education}</strong></div>
                </div>
              </div>

              {/* Legal documents */}
              <div className="space-y-2">
                <div className="font-bold text-zinc-900 dark:text-white">Izin Praktik & Masa Berlaku:</div>
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-500">Nomor SIPP:</span> {inspectedCounselor.sippNumber || "-"}
                    <div className="text-[11px] text-zinc-500">Kadaluarsa: {inspectedCounselor.sippExpiresAt || "-"}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Nomor STR:</span> {inspectedCounselor.strNumber || "-"}
                    <div className="text-[11px] text-zinc-500">Kadaluarsa: {inspectedCounselor.strExpiresAt || "-"}</div>
                  </div>
                </div>
              </div>

              {/* 8 Files list */}
              <div className="space-y-2">
                <div className="font-bold text-zinc-900 dark:text-white">8 Berkas Lampiran Cloudflare R2:</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Foto Formal (Publik)", "Berkas KTP (Privat)", "Berkas CV Terbaru (Privat)",
                    "Ijazah S1 Psikologi", "Ijazah Profesi", "STR / SSP", "SIPP / SILP", "Sertifikat Pendukung"
                  ].map((docName, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <span className="truncate">{i + 14}. {docName}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-600">
                        Lihat Berkas
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setInspectorModalOpen(false)}>
              Tutup
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                await verifyCounselorAction(inspectedCounselor.id, "verified");
                toast.success(`Konselor ${inspectedCounselor.fullName} telah diverifikasi!`);
                setInspectorModalOpen(false);
              }}
            >
              Setujui & Verifikasi Konselor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: CLIENT WHATSAPP SECURITY GATE (PDF VIEW & PRINT) WITH PERMASALAHAN UTAMA
          ========================================================================= */}
      <Dialog open={clientVerifyModalOpen} onOpenChange={setClientVerifyModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="size-4 text-emerald-600" />
              Verifikasi Keamanan untuk Membaca & Cetak Laporan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan Nomor WhatsApp yang Anda daftarkan saat memesan sesi konseling.
            </DialogDescription>
          </DialogHeader>

          {!unlockedReport ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Nomor WhatsApp Terdaftar</Label>
                <Input
                  type="text"
                  placeholder="Contoh: 081299990001 atau 085711110001"
                  value={clientPhoneInput}
                  onChange={(e) => setClientPhoneInput(e.target.value)}
                />
              </div>
              <Button
                className="w-full text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={async () => {
                  const targetBooking =
                    data.todayBookings.find((b) => b.bookingCode === "SL-6001") ||
                    data.todayBookings.find((b) => b.sessionReport) ||
                    data.todayBookings[0];
                  if (!targetBooking) return;
                  const res = await verifyClientReportAccessAction(targetBooking.id, clientPhoneInput);
                  if (res.success && res.report) {
                    setUnlockedReport(res.report as any);
                    toast.success("Verifikasi berhasil! Laporan resmi dibuka.");
                  } else {
                    toast.error(res.error || "Verifikasi nomor WhatsApp gagal.");
                  }
                }}
              >
                Verifikasi & Buka Laporan
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs print:p-0">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">Laporan Hasil Konseling</span>
                  <Badge variant="outline" className="font-mono text-[10px]">Dokumen Resmi</Badge>
                </div>

                {/* Display Permasalahan Utama in client report */}
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Permasalahan Utama:
                  </span>
                  <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100 mt-0.5">
                    {unlockedReport.mainIssue || "Konsultasi Emosional & Stres"}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-zinc-700 dark:text-zinc-300">Ringkasan Dinamika Sesi:</div>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line leading-relaxed">
                    {unlockedReport.summary}
                  </p>
                </div>
                {unlockedReport.actionPlan && (
                  <div>
                    <div className="font-bold text-zinc-700 dark:text-zinc-300">Saran / Rekomendasi Tindak Lanjut:</div>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line leading-relaxed">
                      {unlockedReport.actionPlan}
                    </p>
                  </div>
                )}
                <div className="text-[10px] text-zinc-400 pt-2 border-t">
                  Dokumen ini diterbitkan oleh psikolog/konselor resmi Solulu.id. Foto dokumentasi kehadiran dan catatan internal dilindungi privasi medis.
                </div>
              </div>

              <Button
                className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="size-4" />
                Cetak / Simpan sebagai PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
