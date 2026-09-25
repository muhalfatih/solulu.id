"use client"

import * as React from "react"
import {
  Star,
  Search,
  Trash2,
  Edit2,
  Check,
  Send,
  Eye,
  EyeOff,
  Quote,
  Filter,
} from "lucide-react"
import { TestimonialItem } from "../../mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const COUNSELOR_OPTIONS = [
  { name: "Siti Rahmawati, M.Psi., Psikolog", type: "Psikolog Klinis" as const },
  { name: "Budi Santoso, S.Psi.", type: "Konselor Sebaya" as const },
  { name: "Dr. Dian Pratama, Sp.KJ", type: "Psikolog Klinis" as const },
]

const TOPIC_OPTIONS = [
  "Kecemasan & Overthinking",
  "Karier & Burnout",
  "Relasi & Keluarga",
  "Depresi Ringan",
  "Pengembangan Diri",
] as const

interface TestimonialVariantAProps {
  items: TestimonialItem[]
  onAddPost: (post: TestimonialItem) => void
  onUpdatePost: (id: string, updated: Partial<TestimonialItem>) => void
  onToggleActive: (id: string) => void
  onDeletePost: (id: string) => void
}

export function TestimonialVariantA({
  items,
  onAddPost,
  onUpdatePost,
  onToggleActive,
  onDeletePost,
}: TestimonialVariantAProps) {
  // Composer State
  const [clientName, setClientName] = React.useState("")
  const [isAnonymous, setIsAnonymous] = React.useState(true)
  const [counselorIndex, setCounselorIndex] = React.useState(0)
  const [topic, setTopic] = React.useState<typeof TOPIC_OPTIONS[number]>("Kecemasan & Overthinking")
  const [rating, setRating] = React.useState(5)
  const [comment, setComment] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editComment, setEditComment] = React.useState("")
  const [editQuote, setEditQuote] = React.useState("")
  const [editRating, setEditRating] = React.useState(5)
  const [editIsActive, setEditIsActive] = React.useState(true)

  // Filter & Search State
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [topicFilter, setTopicFilter] = React.useState<string>("all")

  // Generate anonymous pseudonym from client name (e.g. "Rian Adiputra" -> "R.A.")
  const getAnonymousDisplay = (name: string, anonymous: boolean) => {
    if (!anonymous) return name.trim() || "Nama Klien"
    if (!name.trim()) return "Klien Anonim"
    const parts = name.trim().split(/\s+/)
    return parts.map((p) => p[0].toUpperCase() + ".").join("")
  }

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !comment.trim()) return

    const selectedCounselor = COUNSELOR_OPTIONS[counselorIndex]
    const anonDisplay = getAnonymousDisplay(clientName, isAnonymous)

    // First sentence as highlight quote
    const firstSentence = comment.split(/[.!?]/)[0] || comment
    const quoteHighlight =
      firstSentence.length > 70 ? firstSentence.slice(0, 70) + "..." : firstSentence

    const newPost: TestimonialItem = {
      id: `post-${Date.now()}`,
      clientName: clientName.trim(),
      isAnonymous,
      anonymousDisplay: anonDisplay,
      avatarBg: "bg-primary/10 text-primary",
      sessionCode: `SL-POST-${Math.floor(100 + Math.random() * 900)}`,
      counselorName: selectedCounselor.name,
      counselorType: selectedCounselor.type,
      rating,
      quoteHighlight,
      comment: comment.trim(),
      topic,
      submittedAt: "Baru saja",
      isActive,
      consentGiven: true,
      hasSensitiveDetails: false,
      platformRating: 5,
    }

    onAddPost(newPost)

    // Reset composer form
    setClientName("")
    setComment("")
    setIsActive(true)
    setRating(5)
  }

  const startEdit = (item: TestimonialItem) => {
    setEditingId(item.id)
    setEditComment(item.comment)
    setEditQuote(item.quoteHighlight || "")
    setEditRating(item.rating)
    setEditIsActive(item.isActive)
  }

  const saveEdit = (id: string) => {
    onUpdatePost(id, {
      comment: editComment.trim(),
      quoteHighlight: editQuote.trim(),
      rating: editRating,
      isActive: editIsActive,
    })
    setEditingId(null)
  }

  // Filtered post feed
  const filteredPosts = React.useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.anonymousDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : !item.isActive

      const matchTopic = topicFilter === "all" || item.topic === topicFilter

      return matchSearch && matchStatus && matchTopic
    })
  }, [items, searchQuery, statusFilter, topicFilter])

  const activeCount = items.filter((i) => i.isActive).length
  const inactiveCount = items.filter((i) => !i.isActive).length

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. DIRECT COMPOSER BOX (Tulis Postingan Testimoni Baru) */}
      <section
        aria-label="Formulir tulis ulasan testimoni baru"
        className="rounded-2xl border border-border bg-card p-5 shadow-2xs flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Quote className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Tulis Testimoni Baru
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Catat hasil evaluasi konseling untuk ditampilkan pada website Solulu.
          </span>
        </div>

        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
          {/* Main Textarea */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-comment" className="text-xs font-medium text-foreground">
              Isi Ulasan / Pengalaman Klien <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="post-comment"
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tuliskan pengalaman atau kutipan ulasan klien di sini... Contoh: 'Sesi bersama Kak Siti sangat menenangkan, latihan grounding-nya langsung terasa efeknya saat panik melanda.'"
              className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-y min-h-[72px]"
            />
          </div>

          {/* Row Inputs: Nama Klien, Konselor, Topik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
            {/* Nama Klien & Toggle Inisial Anonim */}
            <div className="flex flex-col gap-1.5">
              <div className="h-5 flex items-center justify-between">
                <Label htmlFor="client-name" className="text-xs font-medium text-foreground">
                  Nama Klien <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="anon-check"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary size-3 cursor-pointer"
                  />
                  <label htmlFor="anon-check" className="text-[11px] text-muted-foreground cursor-pointer select-none">
                    Inisial Anonim
                  </label>
                </div>
              </div>
              <Input
                id="client-name"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Misal: Rian Adiputra"
                className="h-8 w-full text-xs bg-background"
              />
            </div>

            {/* Konselor Pendamping */}
            <div className="flex flex-col gap-1.5">
              <div className="h-5 flex items-center">
                <Label className="text-xs font-medium text-foreground">
                  Konselor Pendamping
                </Label>
              </div>
              <Select
                value={String(counselorIndex)}
                onValueChange={(val) => setCounselorIndex(Number(val))}
              >
                <SelectTrigger size="sm" className="h-8 w-full text-xs bg-background">
                  <SelectValue placeholder="Pilih konselor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COUNSELOR_OPTIONS.map((c, idx) => (
                      <SelectItem key={idx} value={String(idx)} className="text-xs">
                        {c.name} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Topik Masalah */}
            <div className="flex flex-col gap-1.5">
              <div className="h-5 flex items-center">
                <Label className="text-xs font-medium text-foreground">
                  Topik Masalah
                </Label>
              </div>
              <Select
                value={topic}
                onValueChange={(val) => setTopic(val as typeof TOPIC_OPTIONS[number])}
              >
                <SelectTrigger size="sm" className="h-8 w-full text-xs bg-background">
                  <SelectValue placeholder="Pilih topik..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TOPIC_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Rating, Status Aktif Toggle, Submit Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-5 h-8">
              {/* Rating Bintang */}
              <div className="flex items-center gap-2 h-8">
                <span className="text-xs text-muted-foreground">Rating:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-400 p-0.5 focus:outline-none cursor-pointer"
                      aria-label={`Pilih rating ${star} bintang`}
                    >
                      <Star
                        className={`size-3.5 ${
                          star <= rating ? "fill-amber-400" : "text-muted-foreground/30 fill-none"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] font-mono text-muted-foreground ml-1.5">
                    {rating}.0
                  </span>
                </div>
              </div>

              {/* Status Aktif / Tidak Aktif Switch */}
              <div className="flex items-center gap-2 h-8">
                <Switch
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active-toggle" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                  <span>Status:</span>
                  <span className={isActive ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                    {isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <Send className="size-3.5" data-icon="inline-start" />
              <span>Simpan Testimoni</span>
            </Button>
          </div>
        </form>
      </section>

      {/* 2. FILTER & SEARCH BAR */}
      <section
        aria-label="Penyaring postingan testimoni"
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-2xs"
      >
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, konselor, isi ulasan..."
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Topic Filter */}
          <div className="flex items-center gap-1.5">
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger size="sm" className="w-[170px] h-8 text-xs bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Semua Topik" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Semua Topik</SelectItem>
                  {TOPIC_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filter Tabs: Hanya Semua, Aktif, Tidak Aktif */}
        <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
          {[
            { id: "all", label: `Semua (${items.length})` },
            { id: "active", label: `Aktif (${activeCount})` },
            { id: "inactive", label: `Tidak Aktif (${inactiveCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`h-7 px-3 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center justify-center ${
                statusFilter === tab.id
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. TESTIMONIAL FEED LIST */}
      <div className="flex flex-col gap-4">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-border bg-card">
            Tidak ada ulasan testimoni yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isEditing = editingId === post.id

            return (
              <article
                key={post.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-2xs flex flex-col gap-3.5 hover:border-border/80 transition-colors"
              >
                {/* Header: Author info, status badge, date */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        post.avatarBg || "bg-primary/10 text-primary"
                      }`}
                    >
                      {post.anonymousDisplay[0]}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {post.anonymousDisplay}
                        </span>
                        {post.isAnonymous && post.clientName !== post.anonymousDisplay && (
                          <span className="text-[10px] text-muted-foreground">
                            (Asli: {post.clientName})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {post.submittedAt}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge: Aktif vs Tidak Aktif */}
                  <div>
                    {post.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-medium py-0.5 px-2.5 gap-1.5"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>Aktif</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-muted-foreground text-[11px] font-medium py-0.5 px-2.5"
                      >
                        Tidak Aktif
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content: Highlight quote & full review */}
                {isEditing ? (
                  <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-muted/20 border border-border">
                    <Label className="text-xs font-medium text-foreground">Kutipan Sorotan</Label>
                    <Input
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      placeholder="Kutipan utama..."
                      className="h-8 text-xs bg-background"
                    />
                    <Label className="text-xs font-medium text-foreground mt-1">Ulasan Lengkap</Label>
                    <textarea
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground leading-relaxed resize-y"
                    />
                    {/* Inline edit rating & active switch */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditRating(star)}
                              className="text-amber-400 p-0.5 focus:outline-none cursor-pointer"
                              aria-label={`Ubah rating menjadi ${star}`}
                            >
                              <Star
                                className={`size-3.5 ${
                                  star <= editRating ? "fill-amber-400" : "text-muted-foreground/30 fill-none"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`edit-active-${post.id}`}
                            checked={editIsActive}
                            onCheckedChange={setEditIsActive}
                          />
                          <Label htmlFor={`edit-active-${post.id}`} className="text-xs text-foreground cursor-pointer">
                            {editIsActive ? "Status Aktif" : "Tidak Aktif"}
                          </Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="h-8 text-xs cursor-pointer"
                        >
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(post.id)}
                          className="h-8 text-xs font-medium gap-1 cursor-pointer"
                        >
                          <Check className="size-3.5" data-icon="inline-start" />
                          <span>Simpan</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {post.quoteHighlight && (
                      <blockquote className="text-sm font-semibold text-foreground italic leading-snug">
                        &ldquo;{post.quoteHighlight}&rdquo;
                      </blockquote>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {post.comment}
                    </p>
                  </div>
                )}

                {/* Footer Metadata & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-foreground text-xs">
                      {post.counselorName}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                      {post.topic}
                    </Badge>
                    <span className="text-muted-foreground/60">•</span>
                    <div className="flex items-center gap-1 text-amber-500 font-medium text-xs">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span className="font-mono text-[11px]">{post.rating}.0</span>
                    </div>
                  </div>

                  {/* Action Toolbar: Toggle Aktif, Edit, Hapus */}
                  <div className="flex items-center gap-1.5">
                    {/* Toggle Status Aktif / Tidak Aktif */}
                    <Button
                      variant={post.isActive ? "ghost" : "outline"}
                      size="sm"
                      onClick={() => onToggleActive(post.id)}
                      className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                      title={post.isActive ? "Nonaktifkan ulasan dari website" : "Aktifkan ulasan di website"}
                    >
                      {post.isActive ? (
                        <>
                          <EyeOff className="size-3.5 text-muted-foreground" data-icon="inline-start" />
                          <span className="text-muted-foreground">Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5 text-emerald-600 dark:text-emerald-400" data-icon="inline-start" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Aktifkan</span>
                        </>
                      )}
                    </Button>

                    {/* Edit Inline */}
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(post)}
                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit ulasan"
                        aria-label="Edit ulasan"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeletePost(post.id)}
                      className="size-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Hapus testimoni"
                      aria-label="Hapus testimoni"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
