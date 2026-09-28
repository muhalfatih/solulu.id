import { describe, it, expect, vi } from "vitest";
import {
  SRQ20_QUESTIONS,
  calculateSRQ20Score,
} from "@/lib/screening/srq20";
import { submitScreeningSchema } from "@/lib/validations/screening";
import {
  submitScreeningAction,
  getScreeningResultAction,
} from "@/app/screening/actions";

describe("SRQ-20 Questionnaire Definitions & Calculation", () => {
  it("has exactly 20 standard questions in Indonesian with proper categories", () => {
    expect(SRQ20_QUESTIONS).toHaveLength(20);
    expect(SRQ20_QUESTIONS[0].question).toContain("sakit kepala");
    expect(SRQ20_QUESTIONS[16].id).toBe(17);
    expect(SRQ20_QUESTIONS[16].question).toContain("pikiran untuk mengakhiri hidup");
    expect(SRQ20_QUESTIONS[16].category).toBe("crisis");
  });

  it("throws an error if answers length is not 20", () => {
    expect(() => calculateSRQ20Score([true, false])).toThrow(
      "Jawaban SRQ-20 harus berupa array tepat 20 butir boolean."
    );
  });

  it("evaluates all-false answers as score 0, low distress, and peer counselor recommendation", () => {
    const allFalse = new Array(20).fill(false);
    const result = calculateSRQ20Score(allFalse);

    expect(result.totalScore).toBe(0);
    expect(result.maxScore).toBe(20);
    expect(result.hasSuicidalThoughts).toBe(false);
    expect(result.distressLevel).toBe("low");
    expect(result.recommendedType).toBe("peer");
    expect(result.categoryBreakdown.crisis.count).toBe(0);
  });

  it("evaluates score 6-7 (without suicidal thoughts) as moderate distress and peer counselor recommendation", () => {
    // 6 true answers, but question 17 (index 16) is false
    const answers = new Array(20).fill(false);
    [0, 1, 2, 3, 4, 5].forEach((i) => (answers[i] = true));

    const result = calculateSRQ20Score(answers);
    expect(result.totalScore).toBe(6);
    expect(result.hasSuicidalThoughts).toBe(false);
    expect(result.distressLevel).toBe("moderate");
    expect(result.recommendedType).toBe("peer");
  });

  it("evaluates score >= 8 as high distress and clinical psychologist recommendation", () => {
    const answers = new Array(20).fill(false);
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => (answers[i] = true));

    const result = calculateSRQ20Score(answers);
    expect(result.totalScore).toBe(8);
    expect(result.hasSuicidalThoughts).toBe(false);
    expect(result.distressLevel).toBe("high");
    expect(result.recommendedType).toBe("psychologist");
    expect(result.levelBadgeText).toBe("Perlu Perhatian Khusus");
  });

  it("triggers high distress & clinical recommendation if question 17 is true even with low score (e.g. score 1)", () => {
    const answers = new Array(20).fill(false);
    answers[16] = true; // Question 17 (suicidal ideation)

    const result = calculateSRQ20Score(answers);
    expect(result.totalScore).toBe(1);
    expect(result.hasSuicidalThoughts).toBe(true);
    expect(result.distressLevel).toBe("high");
    expect(result.recommendedType).toBe("psychologist");
    expect(result.categoryBreakdown.crisis.count).toBe(1);
  });

  it("accurately categorizes answers into clinical subcategories", () => {
    const answers = new Array(20).fill(false);
    // Somatic: 1, 2 (index 0, 1)
    answers[0] = true;
    answers[1] = true;
    // Anxiety: 3, 4 (index 2, 3)
    answers[2] = true;
    answers[3] = true;
    // Cognitive: 8 (index 7)
    answers[7] = true;
    // Depressive: 9, 10 (index 8, 9)
    answers[8] = true;
    answers[9] = true;
    // Crisis: 17 (index 16)
    answers[16] = true;

    const result = calculateSRQ20Score(answers);
    expect(result.totalScore).toBe(8);
    expect(result.categoryBreakdown.somatic.count).toBe(2);
    expect(result.categoryBreakdown.anxiety.count).toBe(2);
    expect(result.categoryBreakdown.cognitive.count).toBe(1);
    expect(result.categoryBreakdown.depressive.count).toBe(2);
    expect(result.categoryBreakdown.crisis.count).toBe(1);
  });
});

describe("SRQ-20 Validation Schema", () => {
  it("accepts exactly 20 booleans", () => {
    const valid = submitScreeningSchema.safeParse({
      answers: new Array(20).fill(false),
    });
    expect(valid.success).toBe(true);
  });

  it("rejects arrays with fewer or more than 20 items", () => {
    const tooFew = submitScreeningSchema.safeParse({
      answers: new Array(19).fill(false),
    });
    expect(tooFew.success).toBe(false);

    const tooMany = submitScreeningSchema.safeParse({
      answers: new Array(21).fill(false),
    });
    expect(tooMany.success).toBe(false);
  });

  it("rejects non-boolean elements", () => {
    const invalidTypes = submitScreeningSchema.safeParse({
      answers: [...new Array(19).fill(false), "yes"],
    });
    expect(invalidTypes.success).toBe(false);
  });
});

describe("SRQ-20 Server Actions", () => {
  const mockDbStorage = new Map<string, any>();

  const testDeps = {
    insertScreening: async (values: any) => {
      const id = "mock-uuid-" + Math.random().toString(36).substring(2, 9);
      const record = {
        id,
        ...values,
        createdAt: new Date(),
      };
      mockDbStorage.set(id, record);
      return record;
    },
    getScreening: async (id: string) => {
      return mockDbStorage.get(id) || null;
    },
  };

  it("submits screening answers, saves via injected dependency, and retrieves the evaluated record", async () => {
    const testAnswers = new Array(20).fill(false);
    testAnswers[0] = true; // headache
    testAnswers[2] = true; // sleep
    testAnswers[4] = true; // anxiety

    const submitRes = await submitScreeningAction(
      { answers: testAnswers },
      testDeps
    );

    expect(submitRes.success).toBe(true);
    expect(submitRes.screeningId).toBeDefined();
    expect(submitRes.evaluation).toBeDefined();
    expect(submitRes.evaluation?.totalScore).toBe(3);
    expect(submitRes.evaluation?.recommendedType).toBe("peer");

    const getRes = await getScreeningResultAction(
      submitRes.screeningId!,
      testDeps
    );
    expect(getRes.success).toBe(true);
    expect(getRes.screening?.totalScore).toBe(3);
    expect(getRes.screening?.recommendedType).toBe("peer");
    expect(getRes.screening?.hasSuicidalThoughts).toBe(false);
    expect(getRes.screening?.evaluation.totalScore).toBe(3);
  });

  it("correctly flags suicidal thoughts and persists clinical recommendation in DB", async () => {
    const crisisAnswers = new Array(20).fill(false);
    crisisAnswers[16] = true; // Question 17: suicidal thoughts

    const submitRes = await submitScreeningAction(
      { answers: crisisAnswers },
      testDeps
    );

    expect(submitRes.success).toBe(true);
    expect(submitRes.evaluation?.hasSuicidalThoughts).toBe(true);
    expect(submitRes.evaluation?.recommendedType).toBe("psychologist");

    const getRes = await getScreeningResultAction(
      submitRes.screeningId!,
      testDeps
    );
    expect(getRes.success).toBe(true);
    expect(getRes.screening?.hasSuicidalThoughts).toBe(true);
    expect(getRes.screening?.recommendedType).toBe("psychologist");
  });

  it("returns error for non-existent screening ID", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await getScreeningResultAction(fakeId, testDeps);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Data skrining tidak ditemukan.");
  });

  it("returns error if validation fails on submission", async () => {
    const invalidInput: any = { answers: [true, false] };
    const res = await submitScreeningAction(invalidInput, testDeps);
    expect(res.success).toBe(false);
    expect(res.error).toContain("tepat 20 butir");
  });
});
