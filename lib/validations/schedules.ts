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

export const toggleScheduleSlotSchema = z.object({
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  slotIndex: z.number().int().min(1, "Index slot minimal 1").max(7, "Index slot maksimal 7"),
})

export type ToggleScheduleSlotInput = z.infer<typeof toggleScheduleSlotSchema>

export const leaveRequestSchema = z
  .object({
    startDate: z.string().regex(dateRegex, "Format tanggal mulai harus YYYY-MM-DD"),
    endDate: z.string().regex(dateRegex, "Format tanggal selesai harus YYYY-MM-DD"),
    leaveReason: z.string().min(3, "Alasan cuti/izin minimal 3 karakter"),
    slotIndices: z.array(z.number().int().min(1).max(7)).optional(),
  })
  .refine(
    (data) => {
      return data.startDate <= data.endDate
    },
    {
      message: "Tanggal selesai cuti tidak boleh mendahului tanggal mulai",
      path: ["endDate"],
    }
  )

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>

export const cancelScheduleSlotSchema = z.object({
  scheduleId: z.string().uuid("ID slot harus berupa UUID yang valid"),
})

export type CancelScheduleSlotInput = z.infer<typeof cancelScheduleSlotSchema>

export const catalogFilterSchema = z.object({
  type: z.enum(["all", "peer", "psychologist"]).optional().default("all"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD").optional(),
})

export type CatalogFilterInput = z.input<typeof catalogFilterSchema>

export const templateSlotItemSchema = z.object({
  dayOfWeek: z.number().int().min(1, "Hari harus antara 1 (Senin) dan 7 (Minggu)").max(7, "Hari harus antara 1 (Senin) dan 7 (Minggu)"),
  slotIndex: z.number().int().min(1, "Index slot minimal 1").max(7, "Index slot maksimal 7"),
  isActive: z.boolean(),
})

export type TemplateSlotItem = z.infer<typeof templateSlotItemSchema>

export const saveCounselorTemplateSchema = z
  .object({
    slots: z.array(templateSlotItemSchema).min(1, "Daftar slot tidak boleh kosong"),
    scheduleMode: z.enum(["manual", "automatic"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleMode === "automatic") {
      const activeCount = data.slots.filter((s) => s.isActive).length
      if (activeCount < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mode otomatis membutuhkan minimal 10 slot aktif per minggu. Saat ini hanya memilih ${activeCount} slot.`,
          path: ["slots"],
        })
      }
    }
  })

export type SaveCounselorTemplateInput = z.infer<typeof saveCounselorTemplateSchema>

export const toggleScheduleModeSchema = z.object({
  scheduleMode: z.enum(["manual", "automatic"], {
    message: "Mode jadwal harus 'manual' atau 'automatic'",
  }),
})

export type ToggleScheduleModeInput = z.infer<typeof toggleScheduleModeSchema>

