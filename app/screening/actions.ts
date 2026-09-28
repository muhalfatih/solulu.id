"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { screenings } from "@/db/schema";
import {
  calculateSRQ20Score,
  type SRQ20EvaluationResult,
} from "@/lib/screening/srq20";
import {
  submitScreeningSchema,
  type SubmitScreeningInput,
} from "@/lib/validations/screening";

export interface SubmitScreeningResponse {
  success: boolean;
  screeningId?: string;
  evaluation?: SRQ20EvaluationResult;
  error?: string;
  counselorId?: string;
  scheduleId?: string;
}

export interface GetScreeningResponse {
  success: boolean;
  screening?: {
    id: string;
    answers: boolean[];
    totalScore: number;
    hasSuicidalThoughts: boolean;
    recommendedType: "peer" | "psychologist";
    createdAt: Date;
    evaluation: SRQ20EvaluationResult;
  };
  error?: string;
}

export interface ScreeningDependencies {
  insertScreening?: (
    values: typeof screenings.$inferInsert
  ) => Promise<typeof screenings.$inferSelect>;
  getScreening?: (id: string) => Promise<typeof screenings.$inferSelect | null>;
}

// In-memory fallback cache for local dev / offline preview without live database
const globalDevCache = globalThis as unknown as {
  __devScreeningsCache?: Map<string, typeof screenings.$inferSelect>;
};
if (!globalDevCache.__devScreeningsCache) {
  globalDevCache.__devScreeningsCache = new Map<string, typeof screenings.$inferSelect>();
}
const devScreeningsCache = globalDevCache.__devScreeningsCache;

/**
 * Menyimpan jawaban skrining SRQ-20 ke database dan mengembalikan hasil evaluasi
 */
export async function submitScreeningAction(
  rawInput: SubmitScreeningInput,
  deps?: ScreeningDependencies
): Promise<SubmitScreeningResponse> {
  try {
    const parseResult = submitScreeningSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error:
          parseResult.error.issues[0]?.message ||
          "Format data skrining tidak valid.",
      };
    }

    const { answers, counselorId, scheduleId } = parseResult.data;
    const evaluation = calculateSRQ20Score(answers);

    const valuesToInsert = {
      answers,
      totalScore: evaluation.totalScore,
      hasSuicidalThoughts: evaluation.hasSuicidalThoughts,
      recommendedType: evaluation.recommendedType,
    };

    let savedId: string;

    if (deps?.insertScreening) {
      const saved = await deps.insertScreening(valuesToInsert);
      savedId = saved.id;
    } else {
      try {
        const [saved] = await db
          .insert(screenings)
          .values(valuesToInsert)
          .returning();

        if (saved) {
          savedId = saved.id;
        } else {
          throw new Error("Gagal mengembalikan baris data skrining baru.");
        }
      } catch (dbErr) {
        console.warn(
          "[submitScreeningAction] Database write failed, using dev memory fallback:",
          dbErr instanceof Error ? dbErr.message : dbErr
        );
        savedId = crypto.randomUUID();
        const fallbackRecord: typeof screenings.$inferSelect = {
          id: savedId,
          answers: valuesToInsert.answers,
          totalScore: valuesToInsert.totalScore,
          hasSuicidalThoughts: valuesToInsert.hasSuicidalThoughts,
          recommendedType: valuesToInsert.recommendedType,
          createdAt: new Date(),
        };
        devScreeningsCache.set(savedId, fallbackRecord);
      }
    }

    return {
      success: true,
      screeningId: savedId,
      evaluation,
      counselorId,
      scheduleId,
    };
  } catch (error) {
    console.error("[submitScreeningAction] Error submitting screening:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan sistem saat menyimpan skrining.",
    };
  }
}

/**
 * Mengambil data skrining tersimpan berdasarkan UUID
 */
export async function getScreeningResultAction(
  screeningId: string,
  deps?: ScreeningDependencies
): Promise<GetScreeningResponse> {
  try {
    if (!screeningId || typeof screeningId !== "string") {
      return {
        success: false,
        error: "ID skrining tidak valid.",
      };
    }

    let record: typeof screenings.$inferSelect | null = null;

    if (deps?.getScreening) {
      record = await deps.getScreening(screeningId);
    } else {
      try {
        const [found] = await db
          .select()
          .from(screenings)
          .where(eq(screenings.id, screeningId))
          .limit(1);
        record = found ?? null;
      } catch (dbErr) {
        console.warn(
          "[getScreeningResultAction] Database read failed, checking dev cache:",
          dbErr instanceof Error ? dbErr.message : dbErr
        );
        record = devScreeningsCache.get(screeningId) || null;
      }
    }

    if (!record) {
      return {
        success: false,
        error: "Data skrining tidak ditemukan.",
      };
    }

    const answers = record.answers as boolean[];
    const evaluation = calculateSRQ20Score(answers);

    return {
      success: true,
      screening: {
        id: record.id,
        answers,
        totalScore: record.totalScore,
        hasSuicidalThoughts: record.hasSuicidalThoughts,
        recommendedType: record.recommendedType as "peer" | "psychologist",
        createdAt: record.createdAt,
        evaluation,
      },
    };
  } catch (error) {
    console.error("[getScreeningResultAction] Error fetching screening:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memuat data skrining.",
    };
  }
}
