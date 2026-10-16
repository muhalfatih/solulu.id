export interface FixedSlot {
  slotIndex: number
  startTime: string
  endTime: string
  label: string
  displayTime: string
}

export const FIXED_SLOTS: FixedSlot[] = [
  {
    slotIndex: 1,
    startTime: "08:00:00",
    endTime: "10:00:00",
    label: "Slot 1 (08.00–10.00 WIB)",
    displayTime: "08.00 – 10.00 WIB",
  },
  {
    slotIndex: 2,
    startTime: "10:00:00",
    endTime: "12:00:00",
    label: "Slot 2 (10.00–12.00 WIB)",
    displayTime: "10.00 – 12.00 WIB",
  },
  {
    slotIndex: 3,
    startTime: "12:00:00",
    endTime: "14:00:00",
    label: "Slot 3 (12.00–14.00 WIB)",
    displayTime: "12.00 – 14.00 WIB",
  },
  {
    slotIndex: 4,
    startTime: "14:00:00",
    endTime: "16:00:00",
    label: "Slot 4 (14.00–16.00 WIB)",
    displayTime: "14.00 – 16.00 WIB",
  },
  {
    slotIndex: 5,
    startTime: "16:00:00",
    endTime: "18:00:00",
    label: "Slot 5 (16.00–18.00 WIB)",
    displayTime: "16.00 – 18.00 WIB",
  },
  {
    slotIndex: 6,
    startTime: "18:00:00",
    endTime: "20:00:00",
    label: "Slot 6 (18.00–20.00 WIB)",
    displayTime: "18.00 – 20.00 WIB",
  },
  {
    slotIndex: 7,
    startTime: "20:00:00",
    endTime: "22:00:00",
    label: "Slot 7 (20.00–22.00 WIB)",
    displayTime: "20.00 – 22.00 WIB",
  },
]

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
