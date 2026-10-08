"use client"

import * as React from "react"
import {
  Search,
  Trash2,
  Edit2,
  Check,
  Send,
  Eye,
  EyeOff,
  Quote,
  Filter,
  Sparkles,
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

export const DEFAULT_SPECIALIZATION_TOPICS = [
  "Kecemasan & Overthinking",
  "Karier & Burnout",
  "Relasi & Keluarga",
  "Depresi Ringan",
  "Pengembangan Diri",
  "Quarter-Life Crisis",
  "Stres Akademik & Kerja",
  "Insecurity & Penerimaan Diri",
]

interface TestimonialVariantAProps {
  items: TestimonialItem[]
  availableTopics?: string[]
  onAddPost: (post: TestimonialItem) => void
  onUpdatePost: (id: string, updated: Partial<TestimonialItem>) => void
  onToggleActive: (id: string) => void
  onDeletePost: (id: string) => void
}

export function TestimonialVariantA({
  items,
  availableTopics = [],
  onAddPost,
  onUpdatePost,
  onToggleActive,
  onDeletePost,
}: TestimonialVariantAProps) {
  // Combine database specializations with default list to ensure rich options
  const topicList = React.useMemo(() => {
    const set = new Set<string>()
    availableTopics.forEach((t) => t && set.add(t.trim()))
    DEFAULT_SPECIALIZATION_TOPICS.forEach((t) => set.add(t))
    items.forEach((i) => {
      if (i.topic) set.add(i.topic)
    })
    return Array.from(set)
  }, [availableTopics, items])

  // Composer Form State (Subjek, Isi, Nama Anonim, Topik Masalah)
  const [subject, setSubject] = React.useState("")
  const [comment, setComment] = React.useState("")
  const [clientName, setClientName] = React.useState("")
  const [topic, setTopic] = React.useState<string>(topicList[0] || "Kecemasan & Overthinking")
  const [isActive, setIsActive] = React.useState(true)

  // Sync default topic if topicList updates
  React.useEffect(() => {
    if (topicList.length > 0 && !topicList.includes(topic)) {
      setTopic(topicList[0])
    }
  }, [topicList, topic])

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editSubject, setEditSubject] = React.useState("")
  const [editComment, setEditComment] = React.useState("")
  const [editClientName, setEditClientName] = React.useState("")
  const [editTopic, setEditTopic] = React.useState("")
  const [editIsActive, setEditIsActive] = React.useState(true)

  // Filter & Search State
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [topicFilter, setTopicFilter] = React.useState<string>("all")

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !comment.trim() || !clientName.trim()) return

    const newPost: TestimonialItem = {
      id: `t-${Date.now()}`,
      clientName: clientName.trim(),
      isAnonymous: true,
      anonymousDisplay: clientName.trim(),
      quoteHighlight: subject.trim(),
      comment: comment.trim(),
      topic: topic.trim(),
      submittedAt: "Baru saja",
      isActive,
      status: "approved",
      isFeatured: isActive,
      consentGiven: true,
      rating: 5,
    }

    onAddPost(newPost)

    // Reset composer form
    setSubject("")
    setComment("")
    setClientName("")
    setIsActive(true)
  }

  const startEdit = (item: TestimonialItem) => {
    setEditingId(item.id)
    setEditSubject(item.quoteHighlight || "")
    setEditComment(item.comment || "")
    setEditClientName(item.anonymousDisplay || item.clientName || "")
    setEditTopic(item.topic || topicList[0] || "Kecemasan & Overthinking")
    setEditIsActive(item.isActive)
  }

  const saveEdit = (id: string) => {
    if (!editSubject.trim() || !editComment.trim() || !editClientName.trim()) return

    onUpdatePost(id, {
      quoteHighlight: editSubject.trim(),
      comment: editComment.trim(),
      clientName: editClientName.trim(),
      anonymousDisplay: editClientName.trim(),
      topic: editTopic.trim(),
      isActive: editIsActive,
      isFeatured: editIsActive,
    })
    setEditingId(null)
  }

  // Filtered post feed
  const filteredPosts = React.useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        q === "" ||
        (item.quoteHighlight && item.quoteHighlight.toLowerCase().includes(q)) ||
        (item.comment && item.comment.toLowerCase().includes(q)) ||
        (item.anonymousDisplay && item.anonymousDisplay.toLowerCase().includes(q)) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.topic && item.topic.toLowerCase().includes(q))

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
      {/* 1. DIRECT COMPOSER BOX: Subjek, Isi, Nama Anonim, Topik Masalah */}
      <section
        aria-label="Formulir tulis testimoni baru"
        className="rounded-2xl border border-border bg-card p-5 shadow-2xs flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Quote className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Tulis Testimoni Baru
            </h2>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" />
            Format mandiri sesuai homepage (Subjek, Isi, Nama Anonim, Topik Spesialisasi)
          </span>
        </div>

        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
          {/* Row 1: Subjek Testimoni */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-subject" className="text-xs font-medium text-foreground">
              Subjek / Judul Testimoni <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Tidak merasa sendirian lagi / Punya arah keluar dari masalah"
              className="h-9 w-full text-xs bg-background"
            />
          </div>

          {/* Row 2: Isi Ulasan / Pengalaman */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-comment" className="text-xs font-medium text-foreground">
              Isi Ulasan <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="post-comment"
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tuliskan pengalaman atau kutipan ulasan klien di sini... Contoh: 'Awalnya sempat ragu mau cerita karena takut dinilai lebay. Tapi konselornya sangat menenangkan sejak menit awal, dan durasi 90 menit beneran bikin lega tanpa rasa diburu-buru.'"
              className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-y min-h-[76px]"
            />
          </div>

          {/* Row 3: Nama (Sebagai Anonim) & Topik Masalah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            {/* Nama (Sebagai Anonim) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client-name" className="text-xs font-medium text-foreground">
                Nama (Sebagai Anonim) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Contoh: Mahasiswa, 21 tahun / Karyawan Swasta, 26 tahun / Klien Anonim"
                className="h-9 w-full text-xs bg-background"
              />
            </div>

            {/* Topik Masalah (dari database spesialisasi & fokus) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-foreground">
                Topik Masalah (Fokus &amp; Spesialisasi) <span className="text-destructive">*</span>
              </Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger size="sm" className="h-9 w-full text-xs bg-background">
                  <SelectValue placeholder="Pilih topik masalah..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {topicList.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Status Aktif Toggle & Submit Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
            {/* Status Aktif / Tidak Aktif Switch */}
            <div className="flex items-center gap-2 h-8">
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label
                htmlFor="active-toggle"
                className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5 select-none"
              >
                <span>Status Publikasi:</span>
                <span
                  className={
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-muted-foreground"
                  }
                >
                  {isActive ? "Aktif (Tampil di Website)" : "Tidak Aktif"}
                </span>
              </Label>
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
              placeholder="Cari subjek, nama anonim, isi..."
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Topic Filter */}
          <div className="flex items-center gap-1.5">
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger size="sm" className="w-[190px] h-8 text-xs bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Semua Topik" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Semua Topik</SelectItem>
                  {topicList.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filter Tabs */}
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

      {/* 3. TESTIMONIAL FEED LIST (Format Visual Kartu Front End Homepage) */}
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
                className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-2xs flex flex-col justify-between gap-4 hover:border-border/80 transition-colors"
              >
                {isEditing ? (
                  /* Form Edit Mode */
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/20 border border-border">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-foreground">Subjek Testimoni</Label>
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Subjek testimoni..."
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-foreground">Isi Ulasan</Label>
                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground leading-relaxed resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-foreground">Nama (Sebagai Anonim)</Label>
                        <Input
                          value={editClientName}
                          onChange={(e) => setEditClientName(e.target.value)}
                          placeholder="Misal: Mahasiswa, 21 tahun"
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-foreground">Topik Masalah</Label>
                        <Select value={editTopic} onValueChange={setEditTopic}>
                          <SelectTrigger size="sm" className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Pilih topik..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {topicList.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`edit-active-${post.id}`}
                          checked={editIsActive}
                          onCheckedChange={setEditIsActive}
                        />
                        <Label
                          htmlFor={`edit-active-${post.id}`}
                          className="text-xs text-foreground cursor-pointer"
                        >
                          {editIsActive ? "Status: Aktif" : "Status: Tidak Aktif"}
                        </Label>
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
                          <span>Simpan Perubahan</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode: Format Identik dengan Homepage Public */
                  <>
                    {/* Header: Subjek Testimoni & Quote Icon & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground leading-snug">
                          {post.quoteHighlight || "Pengalaman Berharga di Solulu"}
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {post.submittedAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                        <Quote className="size-5 text-primary/30 shrink-0 mt-0.5" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Isi Ulasan / Kutipan Murni */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty flex-1 italic">
                      &ldquo;{post.comment}&rdquo;
                    </p>

                    {/* Footer: Nama Anonim + Pill Topik Masalah + Action Toolbar */}
                    <div className="pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-heading font-semibold text-xs sm:text-sm text-foreground">
                          {post.anonymousDisplay || post.clientName}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground/90">
                          {post.topic}
                        </span>
                      </div>

                      {/* Toolbar Aksi (Toggle Aktif, Edit, Hapus) */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={post.isActive ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => onToggleActive(post.id)}
                          className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                          title={
                            post.isActive
                              ? "Nonaktifkan ulasan dari website"
                              : "Aktifkan ulasan di website"
                          }
                        >
                          {post.isActive ? (
                            <>
                              <EyeOff className="size-3.5 text-muted-foreground" data-icon="inline-start" />
                              <span className="text-muted-foreground">Nonaktifkan</span>
                            </>
                          ) : (
                            <>
                              <Eye
                                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                                data-icon="inline-start"
                              />
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Aktifkan
                              </span>
                            </>
                          )}
                        </Button>

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
                  </>
                )}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
