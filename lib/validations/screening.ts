import { z } from "zod";

export const submitScreeningSchema = z.object({
  answers: z
    .array(z.boolean())
    .length(20, "Kuesioner SRQ-20 wajib memiliki tepat 20 butir jawaban."),
  counselorId: z.string().uuid("ID konselor tidak valid").optional(),
  scheduleId: z.string().uuid("ID jadwal tidak valid").optional(),
});

export type SubmitScreeningInput = z.infer<typeof submitScreeningSchema>;
