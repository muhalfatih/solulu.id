"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { EmergencyHotlineBanner } from "@/components/screening/EmergencyHotlineBanner";
import {
  SRQ20_QUESTIONS,
  type SRQ20EvaluationResult,
} from "@/lib/screening/srq20";
import { submitScreeningAction } from "./actions";

interface ScreeningClientProps {
  initialCounselorId?: string;
  initialScheduleId?: string;
  initialScreeningData?: {
    id: string;
    totalScore: number;
    hasSuicidalThoughts: boolean;
    recommendedType: "peer" | "psychologist";
    evaluation: SRQ20EvaluationResult;
  } | null;
}

export function ScreeningClient({
  initialCounselorId,
  initialScheduleId,
  initialScreeningData,
}: ScreeningClientProps) {
  const router = useRouter();

  // State: Answers for 20 questions (true = Ya, false = Tidak, null = Belum dijawab)
  const [answers, setAnswers] = React.useState<(boolean | null)[]>(
    new Array(20).fill(null)
  );

  const [activeCategoryFilter, setActiveCategoryFilter] = React.useState<string>("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Result state
  const [result, setResult] = React.useState<{
    screeningId: string;
    evaluation: SRQ20EvaluationResult;
  } | null>(
    initialScreeningData
      ? {
          screeningId: initialScreeningData.id,
          evaluation: initialScreeningData.evaluation,
        }
      : null
  );

  // Count answered questions
  const answeredCount = answers.filter((a) => a !== null).length;
  const isAllAnswered = answeredCount === 20;
  const progressPercent = Math.round((answeredCount / 20) * 100);

  // Handle single question answer
  const handleAnswer = (index: number, value: boolean) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrorMessage(null);
  };

  // Quick helper: Set all remaining unanswered to "Tidak"
  const handleMarkAllUnansweredNo = () => {
    setAnswers((prev) => prev.map((a) => (a === null ? false : a)));
  };

  // Quick reset
  const handleReset = () => {
    if (confirm("Reset seluruh jawaban skrining?")) {
      setAnswers(new Array(20).fill(null));
      setResult(null);
      setErrorMessage(null);
    }
  };

  // Submit screening answers
  const handleSubmit = async () => {
    if (!isAllAnswered) {
      setErrorMessage("Mohon lengkapi seluruh 20 pertanyaan sebelum melihat hasil evaluasi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const booleanAnswers = answers.map((a) => Boolean(a));
      const res = await submitScreeningAction({
        answers: booleanAnswers,
        counselorId: initialCounselorId,
        scheduleId: initialScheduleId,
      });

      if (!res.success || !res.evaluation || !res.screeningId) {
        setErrorMessage(res.error || "Gagal menyimpan hasil skrining.");
        setIsSubmitting(false);
        return;
      }

      setResult({
        screeningId: res.screeningId,
        evaluation: res.evaluation,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMessage("Terjadi kendala jaringan saat mengirim skrining.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered questions based on tab
  const filteredQuestions = React.useMemo(() => {
    if (activeCategoryFilter === "all") return SRQ20_QUESTIONS;
    return SRQ20_QUESTIONS.filter((q) => q.category === activeCategoryFilter);
  }, [activeCategoryFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-tight">Solulu</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Skrining Mandiri SRQ-20
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="text-xs h-8">
              <Link href="/counselors">
                <ArrowLeft className="size-3.5" data-icon="inline-start" />
                <span>Katalog Konselor</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Results Screen */}
        {result ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Crisis Hotline Alert if Question 17 checked or High Distress */}
            {result.evaluation.hasSuicidalThoughts || result.evaluation.distressLevel === "high" ? (
              <EmergencyHotlineBanner variant="crisis" />
            ) : (
              <EmergencyHotlineBanner variant="supportive" compact={true} />
            )}

            {/* Score & Evaluation Overview Card */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          result.evaluation.distressLevel === "high"
                            ? "destructive"
                            : result.evaluation.distressLevel === "moderate"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs font-semibold px-2.5 py-0.5"
                      >
                        {result.evaluation.levelBadgeText}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Kuesioner Standar WHO / Kemenkes RI
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      {result.evaluation.levelTitle}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
                      {result.evaluation.description}
                    </CardDescription>
                  </div>

                  {/* Circular Score Badge */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border shadow-xs shrink-0 min-w-32">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Skor Total
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-4xl font-extrabold tracking-tight text-primary">
                        {result.evaluation.totalScore}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">/ 20</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground text-center">
                      Indikator Afektif & Fisik
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 flex flex-col gap-6">
                {/* Clinical Context / Counselor Recommendation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommended Counselor Card */}
                  <div
                    className={
                      result.evaluation.recommendedType === "psychologist"
                        ? "p-5 rounded-2xl border-2 border-primary/50 bg-primary/[0.03] flex flex-col gap-3"
                        : "p-5 rounded-2xl border border-border bg-card flex flex-col gap-3"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <Stethoscope className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Psikolog Klinis</h4>
                          <span className="text-xs text-muted-foreground">
                            Magister Profesi & STR Aktif
                          </span>
                        </div>
                      </div>
                      {result.evaluation.recommendedType === "psychologist" && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">
                          Sangat Direkomendasikan
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sesuai untuk penanganan distres tinggi, kecemasan akut, trauma, depresi, atau
                      ketika membutuhkan intervensi psikoterapi formal yang mendalam.
                    </p>

                    <div className="mt-auto pt-2 flex items-center justify-between text-xs font-medium border-t border-border/50">
                      <span className="text-muted-foreground">Sesi 90 Menit</span>
                      <span className="text-foreground font-semibold">Mulai Rp 150.000</span>
                    </div>
                  </div>

                  {/* Peer Counselor Option */}
                  <div
                    className={
                      result.evaluation.recommendedType === "peer"
                        ? "p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/[0.03] flex flex-col gap-3"
                        : "p-5 rounded-2xl border border-border bg-card flex flex-col gap-3"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Heart className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Konselor Sebaya</h4>
                          <span className="text-xs text-muted-foreground">
                            Mitra Pendamping Terlatih
                          </span>
                        </div>
                      </div>
                      {result.evaluation.recommendedType === "peer" && (
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          Rekomendasi Utama
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sesuai untuk ruang curhat aman, stres keseharian, manajemen emosi ringan-sedang,
                      dan mendapatkan validasi empati dari rekan sebaya yang terlatih.
                    </p>

                    <div className="mt-auto pt-2 flex items-center justify-between text-xs font-medium border-t border-border/50">
                      <span className="text-muted-foreground">Sesi 90 Menit</span>
                      <span className="text-foreground font-semibold">Mulai Rp 35.000</span>
                    </div>
                  </div>
                </div>

                {/* Informative Disclaimer Banner */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold block mb-0.5">
                      Catatan Privasi & Kebijakan Klinis Informatif:
                    </strong>
                    Hasil skrining ini dicatat dengan ID{" "}
                    <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground">
                      {result.screeningId}
                    </code>{" "}
                    dan secara aman diteruskan kepada Mitra Konselor Anda untuk persiapan sesi.
                    Solulu tidak mewajibkan pembatasan pilihan konselor; Anda tetap bebas memilih
                    mitra yang paling membuat Anda merasa nyaman.
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs gap-1.5 w-full sm:w-auto"
                  >
                    <RotateCcw className="size-3.5" data-icon="inline-start" />
                    <span>Ulangi Skrining</span>
                  </Button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {initialCounselorId && initialScheduleId ? (
                      <Button
                        asChild
                        size="default"
                        className="w-full sm:w-auto font-semibold gap-2 shadow-xs cursor-pointer"
                      >
                        <Link
                          href={`/booking?counselorId=${initialCounselorId}&scheduleId=${initialScheduleId}&screeningId=${result.screeningId}`}
                        >
                          <span>Lanjut ke Formulir Pemesanan</span>
                          <ArrowRight className="size-4" data-icon="inline-end" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="default"
                        className="w-full sm:w-auto font-semibold gap-2 shadow-xs cursor-pointer"
                      >
                        <Link
                          href={`/counselors?screeningId=${result.screeningId}&type=${result.evaluation.recommendedType}`}
                        >
                          <span>Pilih Mitra Konselor yang Tersedia</span>
                          <ArrowRight className="size-4" data-icon="inline-end" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Questionnaire Active Form */
          <div className="flex flex-col gap-6">
            {/* Supportive Emergency Hotline Banner (Always Accessible) */}
            <EmergencyHotlineBanner variant="supportive" compact={true} />

            {/* Introduction & Progress Header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold w-fit">
                  <Sparkles className="size-3.5" />
                  <span>Kuesioner Klinis Mandiri • 20 Pertanyaan</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Kuesioner Kesejahteraan Emosional (SRQ-20)
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl text-pretty">
                  Pertanyaan ini mengacu pada panduan resmi <em>Self-Reporting Questionnaire (SRQ-20)</em>{" "}
                  dari WHO untuk mengevaluasi keluhan yang Anda rasakan selama <strong>30 hari terakhir</strong>.
                  Data ini bersifat rahasia dan digunakan semata-mata agar konselor dapat mempersiapkan
                  pendampingan terbaik untuk Anda.
                </p>
              </div>

              {/* Progress Tracker Card */}
              <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-foreground">Progres Pengisian:</span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 font-bold">
                      {answeredCount} / 20 Terjawab ({progressPercent}%)
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllUnansweredNo}
                    className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Tandai sisa pertanyaan sebagai &quot;Tidak&quot;
                  </button>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeCategoryFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Semua Butir (20)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("somatic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeCategoryFilter === "somatic"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Gejala Fisik (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("anxiety")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeCategoryFilter === "anxiety"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Kecemasan (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("cognitive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeCategoryFilter === "cognitive"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Fungsi Kognitif (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("depressive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeCategoryFilter === "depressive"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Suasana Hati (7)
              </button>
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-3">
              {filteredQuestions.map((q) => {
                const questionIndex = q.id - 1;
                const currentValue = answers[questionIndex];
                const isCrisisQuestion = q.id === 17;

                return (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      currentValue !== null
                        ? "border-border/80 bg-card shadow-xs"
                        : "border-border/40 bg-card/60"
                    } ${
                      isCrisisQuestion && currentValue === true
                        ? "border-rose-500/50 bg-rose-500/[0.04]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 max-w-2xl">
                        <span
                          className={`size-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            currentValue !== null
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {q.id}
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {q.categoryLabel}
                          </span>
                          <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                            {q.question}
                          </p>
                          {isCrisisQuestion && (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              *Pertanyaan ini digunakan untuk deteksi keselamatan diri darurat secara rahasia.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Yes / No Toggle Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          type="button"
                          variant={currentValue === true ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAnswer(questionIndex, true)}
                          className={`h-9 px-4 text-xs font-semibold cursor-pointer ${
                            currentValue === true
                              ? isCrisisQuestion
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-primary text-primary-foreground shadow-xs"
                              : "hover:bg-muted"
                          }`}
                        >
                          Ya
                        </Button>
                        <Button
                          type="button"
                          variant={currentValue === false ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleAnswer(questionIndex, false)}
                          className={`h-9 px-4 text-xs font-semibold cursor-pointer ${
                            currentValue === false
                              ? "bg-muted-foreground/15 text-foreground font-bold shadow-xs"
                              : "hover:bg-muted"
                          }`}
                        >
                          Tidak
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sticky/Bottom Submission Action Bar */}
            <div className="sticky bottom-4 z-30 p-4 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2
                  className={`size-4 ${
                    isAllAnswered ? "text-emerald-500" : "text-muted-foreground/40"
                  }`}
                />
                <span>
                  {isAllAnswered
                    ? "Seluruh 20 pertanyaan telah dijawab."
                    : `Tersisa ${20 - answeredCount} pertanyaan yang belum dijawab.`}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs h-9"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  size="default"
                  disabled={!isAllAnswered || isSubmitting}
                  onClick={handleSubmit}
                  className="w-full sm:w-auto text-xs font-semibold gap-1.5 h-9 cursor-pointer shadow-xs"
                >
                  <span>{isSubmitting ? "Mengevaluasi..." : "Lihat Hasil Skrining"}</span>
                  <ArrowRight className="size-3.5" data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
