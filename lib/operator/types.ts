export {
  type FixedSlot,
  FIXED_SLOTS,
} from "@/lib/schedules/slots"

export type ZoomMode = "standalone" | "breakout_room"

export interface OperatorParticipantSession {
  bookingId: string
  bookingCode: string
  patientName: string
  patientPhone: string
  bookingStatus: string
  zoomAllocationMode: ZoomMode
  zoomAccountNumber: number
  zoomAccountName: string
  zoomJoinUrl: string | null
  zoomMeetingId: string | null
  zoomHostKey: string | null
  breakoutRoomName: string
  operatorAdmittedAt: string | null
  counselorId: string
  counselorName: string
  counselorTitle: string
  counselorType: string
  slotIndex: number
  startTime: string
  endTime: string
  date: string
}

export interface OperatorSlotData {
  slotIndex: number
  startTime: string
  endTime: string
  label: string
  displayTime: string
  sessionCount: number
  maxQuota: number
  mode: ZoomMode
  isCurrent: boolean
  isPast: boolean
  sessions: OperatorParticipantSession[]
}

export interface OperatorMatrixResponse {
  date: string
  formattedDate: string
  maxQuota: number
  summary: {
    totalSessions: number
    totalAdmitted: number
    totalPendingAdmit: number
    breakoutSlotsCount: number
    standaloneSlotsCount: number
    currentSlotIndex: number | null
  }
  slots: OperatorSlotData[]
}
