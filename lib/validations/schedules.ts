import { z } from "zod"

export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const createScheduleSlotsSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, "Format tanggal harus YYYY-MM-DD")
    .refine((val) => {
      // Validate that it's a valid date string
      const parsed = new Date(val)
      return !isNaN(parsed.getTime())
    }, "Tanggal tidak valid"),
  startTimes: z
    .array(z.string().regex(timeRegex, "Format waktu harus HH:mm"))
    .min(1, "Minimal pilih 1 jam slot praktik"),
})

export type CreateScheduleSlotsInput = z.infer<typeof createScheduleSlotsSchema>

export const cancelScheduleSlotSchema = z.object({
  scheduleId: z.string().uuid("ID slot harus berupa UUID yang valid"),
})

export type CancelScheduleSlotInput = z.infer<typeof cancelScheduleSlotSchema>

export const catalogFilterSchema = z.object({
  type: z.enum(["all", "peer", "psychologist"]).optional().default("all"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD").optional(),
})

export type CatalogFilterInput = z.input<typeof catalogFilterSchema>
