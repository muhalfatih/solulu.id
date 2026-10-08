import { describe, it, expect } from "vitest"

describe("Admin Sessions Calendar Logic & Navigation", () => {
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const date = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${date}`
  }

  const getWeekDays = (currentDate: Date) => {
    const todayKey = formatDateKey(new Date())
    const curr = new Date(currentDate)
    const dayOfWeek = curr.getDay()
    const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(curr.setDate(diffToMonday))
    monday.setHours(0, 0, 0, 0)

    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateKey = formatDateKey(d)
      return {
        dateObj: d,
        dateKey,
        dayName: dayNames[i],
        dateNum: d.getDate(),
        monthShort: monthNamesShort[d.getMonth()],
        isToday: dateKey === todayKey,
      }
    })
  }

  const getMonthGrid = (currentDate: Date) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const todayKey = formatDateKey(new Date())

    const firstDayOfMonth = new Date(year, month, 1)
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      const dateKey = formatDateKey(d)
      cells.push({
        dateKey,
        dateNum: d.getDate(),
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const dateKey = formatDateKey(d)
      cells.push({
        dateKey,
        dateNum: day,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
      })
    }

    const remaining = (7 - (cells.length % 7)) % 7
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day)
      const dateKey = formatDateKey(d)
      cells.push({
        dateKey,
        dateNum: day,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      })
    }

    return cells
  }

  it("calculates weekly view accurately starting from Monday to Sunday", () => {
    // 8 October 2026 is a Thursday
    const date = new Date(2026, 9, 8)
    const week = getWeekDays(date)

    expect(week).toHaveLength(7)
    expect(week[0].dayName).toBe("Senin")
    expect(week[0].dateKey).toBe("2026-10-05")
    expect(week[3].dayName).toBe("Kamis")
    expect(week[3].dateKey).toBe("2026-10-08")
    expect(week[6].dayName).toBe("Minggu")
    expect(week[6].dateKey).toBe("2026-10-11")
  })

  it("navigates forward and backward by 7 days for weekly period", () => {
    let date = new Date(2026, 9, 8) // Oct 8, 2026
    // Move next week
    date = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
    let week = getWeekDays(date)
    expect(week[0].dateKey).toBe("2026-10-12")
    expect(week[6].dateKey).toBe("2026-10-18")

    // Move prev week twice
    date = new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000)
    week = getWeekDays(date)
    expect(week[0].dateKey).toBe("2026-09-28")
    expect(week[6].dateKey).toBe("2026-10-04")
  })

  it("calculates monthly grid with leading and trailing days in 7-column multiple", () => {
    const date = new Date(2026, 9, 1) // October 2026 has 31 days
    const grid = getMonthGrid(date)

    // Cells must be a multiple of 7
    expect(grid.length % 7).toBe(0)
    expect(grid.length).toBeGreaterThanOrEqual(35)

    const currentMonthDays = grid.filter((c) => c.isCurrentMonth)
    expect(currentMonthDays).toHaveLength(31)

    // October 1, 2026 is Thursday (index 3). Leading days from September should be 3 (Mon 28, Tue 29, Wed 30)
    const leadingDays = grid.filter((c, idx) => !c.isCurrentMonth && idx < 7)
    expect(leadingDays).toHaveLength(3)
    expect(leadingDays[0].dateKey).toBe("2026-09-28")
    expect(leadingDays[2].dateKey).toBe("2026-09-30")
  })

  it("matches sessions accurately to time slots and dates without hardcoded restrictions", () => {
    const mockSessions = [
      {
        id: "1",
        date: "2026-10-08",
        timeRange: "09:00 - 10:30 WIB",
        patientName: "Budi",
      },
      {
        id: "2",
        date: "2026-10-08",
        timeRange: "09:30 - 11:00 WIB",
        patientName: "Dewi",
      },
      {
        id: "3",
        date: "2026-10-08",
        timeRange: "14:00 - 15:30 WIB",
        patientName: "Andi",
      },
      {
        id: "4",
        date: "2026-10-08",
        timeRange: "19:00 - 20:30 WIB",
        patientName: "Citra",
      },
      {
        id: "5",
        date: "2026-10-09",
        timeRange: "10:00 - 11:30 WIB",
        patientName: "Fajar",
      },
    ]

    const getSessionStartHour = (timeRange: string) => {
      const match = timeRange.match(/^(\d{1,2}):/)
      return match ? parseInt(match[1], 10) : 9
    }

    // Match 09:00 slot on Oct 8
    const oct8Slot9 = mockSessions.filter(
      (s) => s.date === "2026-10-08" && getSessionStartHour(s.timeRange) === 9
    )
    expect(oct8Slot9).toHaveLength(2) // Budi and Dewi
    expect(oct8Slot9.map((s) => s.patientName)).toEqual(["Budi", "Dewi"])

    // Total sessions on Oct 8 for Monthly view overflow calculation
    const oct8Sessions = mockSessions.filter((s) => s.date === "2026-10-08")
    expect(oct8Sessions).toHaveLength(4)
    // 2 displayed, remainder is 2 (+2 sesi lainnya)
    const displayed = oct8Sessions.slice(0, 2)
    const remainingCount = oct8Sessions.length - 2
    expect(displayed).toHaveLength(2)
    expect(remainingCount).toBe(2)
  })
})
