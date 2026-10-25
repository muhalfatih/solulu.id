"use client"

import * as React from "react"
import {
  FileSpreadsheet,
  Download,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import {
  type FinanceLedgerItem,
  type FinanceReportMetrics,
  computeFinanceMetrics,
  generateFinanceCsv,
  formatRupiah,
} from "./utils"

interface FinanceReportClientProps {
  initialItems: FinanceLedgerItem[]
  initialMetrics: FinanceReportMetrics
}

type DatePreset = "all" | "today" | "last7days" | "last30days" | "thisMonth"

export function FinanceReportClient({
  initialItems,
  initialMetrics,
}: FinanceReportClientProps) {
  // Local state for interactive filtering
  const [items] = React.useState<FinanceLedgerItem[]>(initialItems)
  const [selectedPreset, setSelectedPreset] = React.useState<DatePreset>("all")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")
  const [counselorType, setCounselorType] = React.useState<string>("all")
  const [paymentMethod, setPaymentMethod] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [isExporting, setIsExporting] = React.useState<boolean>(false)

  // Selected session for detailed audit dialog
  const [selectedItem, setSelectedItem] = React.useState<FinanceLedgerItem | null>(null)

  // Date preset handler
  const handleDatePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset)
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().slice(0, 10)

    if (preset === "all") {
      setStartDate("")
      setEndDate("")
    } else if (preset === "today") {
      const todayStr = formatDate(today)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === "last7days") {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      setStartDate(formatDate(past))
      setEndDate(formatDate(today))
    } else if (preset === "last30days") {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      setStartDate(formatDate(past))
      setEndDate(formatDate(today))
    } else if (preset === "thisMonth") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatDate(startOfMonth))
      setEndDate(formatDate(today))
    }
  }

  // Filter items in memory
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // 1. Date filter
      if (startDate && item.scheduleDate < startDate) return false
      if (endDate && item.scheduleDate > endDate) return false

      // 2. Counselor type filter
      if (counselorType !== "all" && item.counselorType !== counselorType) {
        return false
      }

      // 3. Payment method filter
      if (paymentMethod !== "all" && item.paymentMethod !== paymentMethod) {
        return false
      }

      // 4. Session status filter
      if (statusFilter !== "all") {
        if (statusFilter === "no_show" && !item.isNoShow) return false
        if (statusFilter !== "no_show" && item.bookingStatus !== statusFilter) {
          return false
        }
      }

      // 5. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchCode = item.bookingCode.toLowerCase().includes(q)
        const matchClient = item.patientName.toLowerCase().includes(q)
        const matchCounselor = item.counselorName.toLowerCase().includes(q)
        const matchPhone = item.patientPhone.toLowerCase().includes(q)
        if (!matchCode && !matchClient && !matchCounselor && !matchPhone) {
          return false
        }
      }

      return true
    })
  }, [items, startDate, endDate, counselorType, paymentMethod, statusFilter, searchQuery])

  // Recalculate metrics dynamically based on active filters
  const currentMetrics = React.useMemo(() => {
    return computeFinanceMetrics(filteredItems)
  }, [filteredItems])

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedPreset("all")
    setStartDate("")
    setEndDate("")
    setCounselorType("all")
    setPaymentMethod("all")
    setStatusFilter("all")
    setSearchQuery("")
    toast.info("Filter berhasil direset ke tampilan default")
  }

  // Trigger CSV export
  const handleExportCsv = () => {
    try {
      setIsExporting(true)
      if (filteredItems.length === 0) {
        toast.error("Tidak ada data sesi untuk diekspor ke CSV")
        setIsExporting(false)
        return
      }

      const csvContent = generateFinanceCsv(filteredItems)
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const todayStr = new Date().toISOString().slice(0, 10)
      link.href = url
      link.setAttribute("download", `rekap-keuangan-solulu-${todayStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(
        `Berhasil mengekspor ${filteredItems.length} baris data audit keuangan ke CSV`
      )
    } catch (err) {
      console.error("Export error:", err)
      toast.error("Gagal mengekspor file CSV. Silakan coba kembali.")
    } finally {
      setIsExporting(false)
    }
  }

  const isFiltered =
    selectedPreset !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    counselorType !== "all" ||
    paymentMethod !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim().length > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Laporan Sesi &amp; Keuangan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Buku besar audit pendapatan konseling dan data rekapitulasi sesi (*Decoupled Payroll*)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              <RefreshCw data-icon="inline-start" />
              Reset Filter
            </Button>
          )}

          <Button
            onClick={handleExportCsv}
            disabled={isExporting || filteredItems.length === 0}
            size="sm"
            className="font-medium shadow-xs"
          >
            <Download data-icon="inline-start" />
            Ekspor CSV Rekap
          </Button>
        </div>
      </div>

      {/* 2. Prominent Policy Notice: Decoupled Payroll */}
      <Alert className="border-border/80 bg-muted/40">
        <ShieldAlert className="size-4 text-purple-600 dark:text-purple-400" />
        <AlertTitle className="font-semibold text-foreground text-sm flex items-center gap-2">
          Kebijakan Decoupled Payroll Solulu
          <Badge variant="outline" className="text-[10px] uppercase font-mono">
            SOP Terpisah
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
          Perhitungan komisi konselor dan pencairan honorarium sengaja dipisahkan
          (<strong>decoupled</strong>) dari otomasi internal sistem. Solulu menyediakan buku
          besar audit sesi dan durasi riil transparan di bawah ini untuk diunduh (<strong>CSV</strong>)
          agar tim manajemen klinik dapat menghitung bagi hasil dan komisi konselor secara
          akurat dan fleksibel pada spreadsheet eksternal.
        </AlertDescription>
      </Alert>

      {/* 3. Top Metric Cards (4 Required Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sesi Terjadwal */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Sesi Terjadwal
            </CardTitle>
            <CalendarCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {currentMetrics.totalScheduledSessions}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {currentMetrics.completedSessionsCount} selesai klinis
              </span>
              <span>•</span>
              <span>
                {currentMetrics.totalScheduledSessions -
                  currentMetrics.completedSessionsCount}{" "}
                aktif/tercatat
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Pendapatan Kotor (Base + Extend) */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Pendapatan Kotor
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatRupiah(currentMetrics.totalGrossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Dasar: {formatRupiah(currentMetrics.baseRevenue)}</span>
              <span>+</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Extend: {formatRupiah(currentMetrics.totalExtensionRevenue)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Sesi Perpanjangan (Extend Count & Amount) */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sesi Perpanjangan (Extend)
            </CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {currentMetrics.extendedSessionsCount} sesi
            </div>
            <p className="text-xs text-muted-foreground">
              Akumulasi fee:{" "}
              <span className="font-semibold text-foreground">
                {formatRupiah(currentMetrics.totalExtensionRevenue)}
              </span>{" "}
              (&gt;90 menit)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Kanal Pembayaran (Breakdown Xendit vs Manual) */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Kanal Pembayaran
            </CardTitle>
            <CreditCard className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CreditCard className="size-3 text-muted-foreground" />
                Xendit:
              </span>
              <span className="font-medium text-foreground">
                {currentMetrics.paymentChannels.xendit.count} tx (
                {formatRupiah(currentMetrics.paymentChannels.xendit.revenue)})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3 text-muted-foreground" />
                Transfer Manual:
              </span>
              <span className="font-medium text-foreground">
                {currentMetrics.paymentChannels.manual.count} tx (
                {formatRupiah(currentMetrics.paymentChannels.manual.revenue)})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Filters Toolbar */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col gap-4">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="size-3.5" />
              Periode Cepat:
            </span>
            <Button
              variant={selectedPreset === "all" ? "default" : "outline"}
              size="xs"
              onClick={() => handleDatePresetChange("all")}
              className="text-xs"
            >
              Semua Waktu
            </Button>
            <Button
              variant={selectedPreset === "today" ? "default" : "outline"}
              size="xs"
              onClick={() => handleDatePresetChange("today")}
              className="text-xs"
            >
              Hari Ini
            </Button>
            <Button
              variant={selectedPreset === "last7days" ? "default" : "outline"}
              size="xs"
              onClick={() => handleDatePresetChange("last7days")}
              className="text-xs"
            >
              7 Hari Terakhir
            </Button>
            <Button
              variant={selectedPreset === "last30days" ? "default" : "outline"}
              size="xs"
              onClick={() => handleDatePresetChange("last30days")}
              className="text-xs"
            >
              30 Hari Terakhir
            </Button>
            <Button
              variant={selectedPreset === "thisMonth" ? "default" : "outline"}
              size="xs"
              onClick={() => handleDatePresetChange("thisMonth")}
              className="text-xs"
            >
              Bulan Ini
            </Button>
          </div>

          <Separator />

          {/* Form Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Cari Booking / Klien / Konselor
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Kode booking, nama, atau WhatsApp..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs"
                    />
                    {searchQuery && (
                      <InputGroupAddon align="inline-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSearchQuery("")}
                          aria-label="Bersihkan pencarian"
                          className="size-6 text-muted-foreground"
                        >
                          <X className="size-3" />
                        </Button>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
              </FieldGroup>
            </div>

            {/* Counselor Type Dropdown */}
            <div>
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Tipe Mitra Konselor
                  </FieldLabel>
                  <Select
                    value={counselorType}
                    onValueChange={(val) => setCounselorType(val)}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua Tipe Konselor</SelectItem>
                        <SelectItem value="peer">Konselor Sebaya</SelectItem>
                        <SelectItem value="psychologist">Psikolog Klinis</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

            {/* Payment Method Dropdown */}
            <div>
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Metode Pembayaran
                  </FieldLabel>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) => setPaymentMethod(val)}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Semua Metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua Metode</SelectItem>
                        <SelectItem value="xendit">Xendit Gateway</SelectItem>
                        <SelectItem value="manual_bank_transfer">
                          Transfer Manual
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

            {/* Status Sesi Dropdown */}
            <div>
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                    Status Sesi
                  </FieldLabel>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val)}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua Status Sesi</SelectItem>
                        <SelectItem value="completed">Selesai (Completed)</SelectItem>
                        <SelectItem value="confirmed">Dikonfirmasi (Confirmed)</SelectItem>
                        <SelectItem value="pending_payment">
                          Menunggu Bayar (Pending)
                        </SelectItem>
                        <SelectItem value="no_show">No-Show</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>
          </div>

          {/* Custom Date Range Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="text-muted-foreground font-medium">Rentang Tanggal Kustom:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setSelectedPreset("all")
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Dari tanggal"
              />
              <span className="text-muted-foreground">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setSelectedPreset("all")
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Sampai tanggal"
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                  setSelectedPreset("all")
                }}
                className="text-xs text-muted-foreground"
              >
                Hapus rentang
              </Button>
            )}

            <span className="ml-auto text-muted-foreground">
              Menampilkan <strong>{filteredItems.length}</strong> dari {items.length} sesi
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 5. Financial Audit Ledger Table */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Buku Besar Audit Sesi Konseling
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Rekapitulasi lengkap basis data real: biaya sesi, extend fee, durasi riil, dan status verifikasi
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {filteredItems.length} Catatan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <Empty className="py-16">
              <EmptyMedia variant="icon">
                <FileSpreadsheet className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Tidak Ada Data yang Sesuai</EmptyTitle>
                <EmptyDescription>
                  {items.length === 0
                    ? "Belum ada catatan sesi atau transaksi di dalam basis data PostgreSQL."
                    : "Tidak ada catatan sesi yang memenuhi kriteria filter tanggal, tipe mitra, atau metode pembayaran yang Anda pilih."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs"
                  >
                    <RefreshCw data-icon="inline-start" />
                    Reset Semua Filter
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-xs">
                    <TableHead className="w-[110px]">Kode Booking</TableHead>
                    <TableHead className="min-w-[140px]">Tanggal &amp; Slot</TableHead>
                    <TableHead className="min-w-[160px]">Klien (Nama &amp; WA)</TableHead>
                    <TableHead className="min-w-[150px]">Mitra Konselor</TableHead>
                    <TableHead className="w-[120px]">Tipe Konselor</TableHead>
                    <TableHead className="w-[100px] text-center">Durasi Riil</TableHead>
                    <TableHead className="w-[120px] text-right">Biaya Sesi Dasar</TableHead>
                    <TableHead className="w-[110px] text-right">Biaya Extend</TableHead>
                    <TableHead className="w-[130px] text-right">Total Pembayaran</TableHead>
                    <TableHead className="w-[120px]">Metode Bayar</TableHead>
                    <TableHead className="w-[110px]">Status Sesi</TableHead>
                    <TableHead className="w-[70px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isPsychologist = item.counselorType === "psychologist"
                    const hasExtend = item.isExtended || item.extensionFee > 0

                    return (
                      <TableRow
                        key={item.id}
                        className="text-xs hover:bg-muted/40 transition-colors"
                      >
                        {/* 1. Kode Booking */}
                        <TableCell className="font-mono font-medium text-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                            {item.bookingCode}
                          </span>
                        </TableCell>

                        {/* 2. Tanggal & Slot */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {item.scheduleDate}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Slot {item.slotIndex} ({item.timeRange})
                            </span>
                          </div>
                        </TableCell>

                        {/* 3. Klien (Nama & WA) */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {item.patientName}
                            </span>
                            <a
                              href={`https://wa.me/${item.patientPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="size-2.5 text-muted-foreground" />
                              {item.patientPhone}
                            </a>
                          </div>
                        </TableCell>

                        {/* 4. Mitra Konselor */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {item.counselorName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.counselorTitle}
                            </span>
                          </div>
                        </TableCell>

                        {/* 5. Tipe Konselor */}
                        <TableCell>
                          <Badge
                            variant={isPsychologist ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {isPsychologist ? "Psikolog Klinis" : "Konselor Sebaya"}
                          </Badge>
                        </TableCell>

                        {/* 6. Durasi Riil (Menit) */}
                        <TableCell className="text-center font-mono">
                          <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">
                            <Clock className="size-3 text-muted-foreground" />
                            {item.actualDurationMinutes} m
                          </span>
                        </TableCell>

                        {/* 7. Biaya Sesi Dasar */}
                        <TableCell className="text-right font-medium">
                          {formatRupiah(item.baseFee)}
                        </TableCell>

                        {/* 8. Biaya Extend */}
                        <TableCell className="text-right font-mono">
                          {hasExtend ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                +{formatRupiah(item.extensionFee)}
                              </span>
                              {item.extensionPaymentStatus === "PAID" ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                >
                                  Lunas
                                </Badge>
                              ) : item.extensionPaymentStatus === "PENDING" ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
                                >
                                  Verifikasi
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 font-medium text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10"
                                >
                                  Belum Bayar
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* 9. Total Pembayaran */}
                        <TableCell className="text-right font-bold text-foreground font-mono">
                          {formatRupiah(item.totalAmount)}
                        </TableCell>

                        {/* 10. Metode Bayar */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono"
                          >
                            {item.paymentMethod === "manual_bank_transfer"
                              ? "Transfer Manual"
                              : "Xendit"}
                          </Badge>
                        </TableCell>

                        {/* 11. Status Sesi */}
                        <TableCell>
                          {item.isNoShow ? (
                            <Badge variant="destructive" className="text-[10px]">
                              No-Show
                            </Badge>
                          ) : item.bookingStatus === "completed" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            >
                              Selesai
                            </Badge>
                          ) : item.bookingStatus === "confirmed" ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Dikonfirmasi
                            </Badge>
                          ) : item.bookingStatus === "cancelled" ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Dibatalkan
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Menunggu Bayar
                            </Badge>
                          )}
                        </TableCell>

                        {/* Aksi: Detail Dialog */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedItem(item)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Lihat rincian ${item.bookingCode}`}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Session Audit Detail Modal */}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {selectedItem?.bookingCode}
              </Badge>
              <DialogTitle className="text-base font-semibold">
                Rincian Audit Sesi &amp; Keuangan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Audit data operasional decoupled payroll untuk verifikasi komisi eksternal
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              {/* Jadwal & Mitra */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tanggal &amp; Waktu:</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.scheduleDate} • Slot {selectedItem.slotIndex} (
                    {selectedItem.timeRange})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mitra Konselor:</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.counselorName} ({selectedItem.counselorTitle})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tipe Kualifikasi:</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedItem.counselorType === "psychologist"
                      ? "Psikolog Klinis"
                      : "Konselor Sebaya"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Durasi Riil Konseling:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 font-mono">
                    <Clock className="size-3 text-muted-foreground" />
                    {selectedItem.actualDurationMinutes} Menit
                  </span>
                </div>
              </div>

              {/* Data Klien */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nama Klien:</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.patientName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">No WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedItem.patientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono flex items-center gap-1"
                  >
                    {selectedItem.patientPhone}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">
                    {selectedItem.patientEmail}
                  </span>
                </div>
              </div>

              {/* Rincian Transaksi */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Biaya Sesi Dasar:</span>
                  <span className="font-medium text-foreground">
                    {formatRupiah(selectedItem.baseFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Biaya Perpanjangan (Extend):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {selectedItem.extensionFee > 0
                        ? `+${formatRupiah(selectedItem.extensionFee)} (${selectedItem.extensionMinutes} m)`
                        : "-"}
                    </span>
                    {selectedItem.extensionFee > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 font-medium",
                          selectedItem.extensionPaymentStatus === "PAID"
                            ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            : selectedItem.extensionPaymentStatus === "PENDING"
                            ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
                            : "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10"
                        )}
                      >
                        {selectedItem.extensionPaymentStatus === "PAID"
                          ? "Lunas"
                          : selectedItem.extensionPaymentStatus === "PENDING"
                          ? "Verifikasi"
                          : "Belum Bayar"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-foreground">Total Biaya Sesi:</span>
                  <span className="font-bold text-foreground font-mono">
                    {formatRupiah(selectedItem.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Kanal Pembayaran:</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedItem.paymentMethod === "manual_bank_transfer"
                      ? "Transfer Manual"
                      : "Xendit Gateway"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status Pembayaran Sesi:</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {selectedItem.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItem(null)}
              className="text-xs w-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
