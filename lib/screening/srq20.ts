/**
 * Self-Reporting Questionnaire 20 (SRQ-20)
 * Standar World Health Organization (WHO) & Kementerian Kesehatan Republik Indonesia.
 * 
 * Digunakan sebagai kuesioner informatif 20 butir untuk memberikan konteks distres
 * klinis/emosional calon pasien kepada Mitra Konselor secara objektif dan non-intimidatif.
 */

export interface SRQQuestion {
  id: number;
  question: string;
  category: "somatic" | "anxiety" | "cognitive" | "depressive" | "crisis";
  categoryLabel: string;
}

export const SRQ20_QUESTIONS: SRQQuestion[] = [
  {
    id: 1,
    question: "Apakah Anda sering merasa sakit kepala?",
    category: "somatic",
    categoryLabel: "Gejala Fisik & Somatik",
  },
  {
    id: 2,
    question: "Apakah Anda kehilangan nafsu makan?",
    category: "somatic",
    categoryLabel: "Gejala Fisik & Somatik",
  },
  {
    id: 3,
    question: "Apakah tidur Anda tidak nyenyak?",
    category: "anxiety",
    categoryLabel: "Kecemasan & Pola Istirahat",
  },
  {
    id: 4,
    question: "Apakah Anda mudah merasa takut?",
    category: "anxiety",
    categoryLabel: "Kecemasan & Pola Istirahat",
  },
  {
    id: 5,
    question: "Apakah Anda merasa cemas, tegang, atau khawatir?",
    category: "anxiety",
    categoryLabel: "Kecemasan & Pola Istirahat",
  },
  {
    id: 6,
    question: "Apakah tangan Anda gemetar?",
    category: "anxiety",
    categoryLabel: "Kecemasan & Pola Istirahat",
  },
  {
    id: 7,
    question: "Apakah Anda mengalami gangguan pencernaan?",
    category: "somatic",
    categoryLabel: "Gejala Fisik & Somatik",
  },
  {
    id: 8,
    question: "Apakah Anda merasa sulit berpikir jernih?",
    category: "cognitive",
    categoryLabel: "Fungsi Kognitif & Konsentrasi",
  },
  {
    id: 9,
    question: "Apakah Anda merasa tidak bahagia?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 10,
    question: "Apakah Anda lebih sering menangis?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 11,
    question: "Apakah Anda merasa sulit untuk menikmati aktivitas sehari-hari?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 12,
    question: "Apakah Anda mengalami kesulitan untuk mengambil keputusan?",
    category: "cognitive",
    categoryLabel: "Fungsi Kognitif & Konsentrasi",
  },
  {
    id: 13,
    question: "Apakah aktivitas atau tugas sehari-hari Anda terbengkalai?",
    category: "cognitive",
    categoryLabel: "Fungsi Kognitif & Konsentrasi",
  },
  {
    id: 14,
    question: "Apakah Anda merasa tidak mampu berperan aktif dalam kehidupan ini?",
    category: "cognitive",
    categoryLabel: "Fungsi Kognitif & Konsentrasi",
  },
  {
    id: 15,
    question: "Apakah Anda kehilangan minat terhadap banyak hal?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 16,
    question: "Apakah Anda merasa diri Anda tidak berharga?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 17,
    question: "Apakah Anda mempunyai pikiran untuk mengakhiri hidup Anda?",
    category: "crisis",
    categoryLabel: "Indikator Krisis & Keselamatan Diri",
  },
  {
    id: 18,
    question: "Apakah Anda merasa lelah sepanjang waktu?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
  {
    id: 19,
    question: "Apakah Anda merasa tidak enak di perut?",
    category: "somatic",
    categoryLabel: "Gejala Fisik & Somatik",
  },
  {
    id: 20,
    question: "Apakah Anda mudah merasa lelah?",
    category: "depressive",
    categoryLabel: "Suasana Hati & Motivasi",
  },
];

export type DistressLevel = "low" | "moderate" | "high";
export type RecommendedCounselorType = "peer" | "psychologist";

export interface CategoryScoreSummary {
  somatic: { count: number; total: number };
  anxiety: { count: number; total: number };
  cognitive: { count: number; total: number };
  depressive: { count: number; total: number };
  crisis: { count: number; total: number };
}

export interface SRQ20EvaluationResult {
  totalScore: number;
  maxScore: number;
  hasSuicidalThoughts: boolean;
  distressLevel: DistressLevel;
  recommendedType: RecommendedCounselorType;
  levelTitle: string;
  levelBadgeText: string;
  description: string;
  counselorRecommendationText: string;
  categoryBreakdown: CategoryScoreSummary;
}

/**
 * Menghitung dan mengevaluasi hasil kuesioner SRQ-20
 * 
 * Standar Interpretasi Klinis:
 * - Skor < 6: Distres Rendah / Fluktuasi Emosional Ringan (Rekomendasi: Konselor Sebaya)
 * - Skor 6-7: Distres Sedang (Rekomendasi: Konselor Sebaya atau Psikolog Klinis)
 * - Skor >= 8: Indikasi Gangguan Mental Emosional Bermakna (Rekomendasi: Psikolog Klinis)
 * - Pertanyaan 17 bernilai `true`: Indikator Krisis (Wajib Rekomendasi Psikolog Klinis & Banner Darurat 119 Ext 8)
 */
export function calculateSRQ20Score(answers: boolean[]): SRQ20EvaluationResult {
  if (!Array.isArray(answers) || answers.length !== 20) {
    throw new Error("Jawaban SRQ-20 harus berupa array tepat 20 butir boolean.");
  }

  let totalScore = 0;
  const categoryBreakdown: CategoryScoreSummary = {
    somatic: { count: 0, total: 4 },
    anxiety: { count: 0, total: 4 },
    cognitive: { count: 0, total: 4 },
    depressive: { count: 0, total: 7 },
    crisis: { count: 0, total: 1 },
  };

  answers.forEach((ans, idx) => {
    if (ans) {
      totalScore++;
      const cat = SRQ20_QUESTIONS[idx].category;
      categoryBreakdown[cat].count++;
    }
  });

  const hasSuicidalThoughts = Boolean(answers[16]); // Butir 17 (0-indexed: index 16)

  let distressLevel: DistressLevel = "low";
  let levelTitle = "Tingkat Distres Emosional Rendah";
  let levelBadgeText = "Kondisi Stabil";
  let description =
    "Hasil skrining menunjukkan tingkat distres emosional yang relatif terkontrol. Fluktuasi suasana hati atau rasa lelah yang Anda alami tergolong dalam batas wajar sehari-hari.";
  let counselorRecommendationText =
    "Anda sangat cocok berdiskusi dengan Konselor Sebaya untuk teman bercerita, validasi emosi, atau menyusun strategi keseharian.";

  if (totalScore >= 8 || hasSuicidalThoughts) {
    distressLevel = "high";
    levelTitle = "Indikasi Distres Mental Emosional Tinggi";
    levelBadgeText = "Perlu Perhatian Khusus";
    description =
      "Hasil skrining mengindikasikan beban psikologis atau gejala distres yang cukup signifikan selama 30 hari terakhir. Dukungan profesional sangat disarankan untuk membantu Anda pulih.";
    counselorRecommendationText =
      "Kami sangat merekomendasikan Psikolog Klinis ber-STR untuk intervensi klinis mendalam, pemetaan akar masalah, dan penanganan terapeutik terarah.";
  } else if (totalScore >= 6) {
    distressLevel = "moderate";
    levelTitle = "Tingkat Distres Emosional Sedang";
    levelBadgeText = "Perlu Pendampingan";
    description =
      "Hasil skrining menunjukkan adanya beberapa gejala distres yang mulai membebani keseharian Anda. Membicarakan hal ini bersama pendamping terlatih dapat mencegah kelelahan mental lebih lanjut.";
    counselorRecommendationText =
      "Anda dapat memilih Konselor Sebaya untuk eksplorasi beban pikiran, atau langsung berkonsultasi dengan Psikolog Klinis jika ingin pendekatan lebih terstruktur.";
  }

  // Rekomendasi tipe konselor:
  // Skor >= 8 atau ide bunuh diri -> psychologist (Psikolog Klinis)
  // Selain itu -> peer (Konselor Sebaya)
  const recommendedType: RecommendedCounselorType =
    totalScore >= 8 || hasSuicidalThoughts ? "psychologist" : "peer";

  return {
    totalScore,
    maxScore: 20,
    hasSuicidalThoughts,
    distressLevel,
    recommendedType,
    levelTitle,
    levelBadgeText,
    description,
    counselorRecommendationText,
    categoryBreakdown,
  };
}
