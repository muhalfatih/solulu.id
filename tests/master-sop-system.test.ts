import { describe, it, expect } from "vitest";

describe("Spec 0003: Master SOP Counseling System Testing Seam", () => {
  // ===========================================================================
  // 1. 7 Fixed Slots & Cutoff H-4 Jam
  // ===========================================================================
  describe("1. 7 Fixed Slots & Cutoff H-4 Hours Logic", () => {
    const fixedSlots = [
      { idx: 1, start: "08:00", end: "10:00" },
      { idx: 2, start: "10:00", end: "12:00" },
      { idx: 3, start: "12:00", end: "14:00" },
      { idx: 4, start: "14:00", end: "16:00" },
      { idx: 5, start: "16:00", end: "18:00" },
      { idx: 6, start: "18:00", end: "20:00" },
      { idx: 7, start: "20:00", end: "22:00" },
    ];

    it("verifies exactly 7 fixed slots with 2-hour durations", () => {
      expect(fixedSlots).toHaveLength(7);
      for (const slot of fixedSlots) {
        const [startH] = slot.start.split(":").map(Number);
        const [endH] = slot.end.split(":").map(Number);
        expect(endH - startH).toBe(2);
      }
    });

    it("calculates cutoff H-4 hours strictly", () => {
      function isWithinCutoff(slotStartHour: number, currentHour: number, cutoffHours = 4) {
        return slotStartHour - currentHour >= cutoffHours;
      }

      // Slot 6 starts at 18:00. Cutoff is 14:00.
      expect(isWithinCutoff(18, 13)).toBe(true); // 13:00 is allowed
      expect(isWithinCutoff(18, 14)).toBe(true); // 14:00 is exactly cutoff boundary
      expect(isWithinCutoff(18, 15)).toBe(false); // 15:00 is rejected (< 4 hours)
      expect(isWithinCutoff(18, 17)).toBe(false); // 17:00 is rejected
    });
  });

  // ===========================================================================
  // 2. 4 Zoom Pro Accounts Hybrid Dispatcher
  // ===========================================================================
  describe("2. 4 Zoom Accounts Hybrid Dispatcher Logic", () => {
    interface DispatchResult {
      zoomAccountNumber: number;
      mode: "standalone" | "breakout_room";
      breakoutRoomName: string | null;
    }

    function dispatchZoomAccount(
      sessionIndexInSlot: number, // 1-based (1, 2, 3...)
      totalSessionsInSlot: number,
      bookingCode: string,
      counselorName: string
    ): DispatchResult {
      if (sessionIndexInSlot <= 3) {
        return {
          zoomAccountNumber: sessionIndexInSlot,
          mode: "standalone",
          breakoutRoomName: null,
        };
      }

      if (sessionIndexInSlot === 4) {
        if (totalSessionsInSlot <= 4) {
          return {
            zoomAccountNumber: 4,
            mode: "standalone",
            breakoutRoomName: null,
          };
        }
        return {
          zoomAccountNumber: 4,
          mode: "breakout_room",
          breakoutRoomName: `${bookingCode} - ${counselorName}`,
        };
      }

      // Sesi 5 s/d 10 -> Akun Zoom 4 Breakout Room
      return {
        zoomAccountNumber: 4,
        mode: "breakout_room",
        breakoutRoomName: `${bookingCode} - ${counselorName}`,
      };
    }

    it("assigns Sessions 1, 2, and 3 to Zoom Accounts 1, 2, and 3 standalone", () => {
      const res1 = dispatchZoomAccount(1, 3, "SL-3001", "Sarah");
      expect(res1.zoomAccountNumber).toBe(1);
      expect(res1.mode).toBe("standalone");
      expect(res1.breakoutRoomName).toBeNull();

      const res2 = dispatchZoomAccount(2, 3, "SL-3002", "Dimas");
      expect(res2.zoomAccountNumber).toBe(2);
      expect(res2.mode).toBe("standalone");

      const res3 = dispatchZoomAccount(3, 3, "SL-3003", "Rizky");
      expect(res3.zoomAccountNumber).toBe(3);
      expect(res3.mode).toBe("standalone");
    });

    it("assigns Session 4 to standalone if total sessions <= 4", () => {
      const res4 = dispatchZoomAccount(4, 4, "SL-3004", "Fajar");
      expect(res4.zoomAccountNumber).toBe(4);
      expect(res4.mode).toBe("standalone");
      expect(res4.breakoutRoomName).toBeNull();
    });

    it("assigns Sessions 4, 5, 6... to Zoom 4 Breakout Room if total sessions > 4", () => {
      const res4 = dispatchZoomAccount(4, 6, "SL-6004", "Sarah");
      expect(res4.zoomAccountNumber).toBe(4);
      expect(res4.mode).toBe("breakout_room");
      expect(res4.breakoutRoomName).toBe("SL-6004 - Sarah");

      const res6 = dispatchZoomAccount(6, 6, "SL-6006", "Dimas");
      expect(res6.zoomAccountNumber).toBe(4);
      expect(res6.mode).toBe("breakout_room");
      expect(res6.breakoutRoomName).toBe("SL-6006 - Dimas");
    });
  });

  // ===========================================================================
  // 3. Extend Session Fee Calculation (30-Min Blocks)
  // ===========================================================================
  describe("3. Extend Session Fee Calculation Logic", () => {
    function computeExtensionFee(
      durationMinutes: number,
      counselorType: "peer" | "psychologist",
      customRates?: { peerRate?: number; psychologistRate?: number }
    ): { isExtended: boolean; extensionMinutes: number; fee: number } {
      if (durationMinutes <= 95) {
        return { isExtended: false, extensionMinutes: 0, fee: 0 };
      }

      const peerRate = customRates?.peerRate ?? 35000;
      const psychRate = customRates?.psychologistRate ?? 50000;
      const rate = counselorType === "psychologist" ? psychRate : peerRate;

      // 96 - 120 mins = 1 block of 30 minutes
      return {
        isExtended: true,
        extensionMinutes: 30,
        fee: rate,
      };
    }

    it("charges Rp 0 for standard duration (0–90 mins)", () => {
      expect(computeExtensionFee(60, "peer").fee).toBe(0);
      expect(computeExtensionFee(90, "psychologist").fee).toBe(0);
    });

    it("charges Rp 0 during the 5-minute grace period (90–95 mins)", () => {
      expect(computeExtensionFee(92, "peer").fee).toBe(0);
      expect(computeExtensionFee(95, "psychologist").fee).toBe(0);
    });

    it("charges Rp 35.000 for Konselor Sebaya at minutes 96–120", () => {
      const res96 = computeExtensionFee(96, "peer");
      expect(res96.isExtended).toBe(true);
      expect(res96.extensionMinutes).toBe(30);
      expect(res96.fee).toBe(35000);

      const res110 = computeExtensionFee(110, "peer");
      expect(res110.fee).toBe(35000);
    });

    it("charges Rp 50.000 for Psikolog Klinis at minutes 96–120", () => {
      const res = computeExtensionFee(100, "psychologist");
      expect(res.isExtended).toBe(true);
      expect(res.extensionMinutes).toBe(30);
      expect(res.fee).toBe(50000);
    });

    it("allows dynamic rates configured by Superadmin", () => {
      const res = computeExtensionFee(98, "peer", { peerRate: 40000 });
      expect(res.fee).toBe(40000);
    });
  });

  // ===========================================================================
  // 4. Clinical Session Reports & Confidentiality Separation
  // ===========================================================================
  describe("4. Clinical Session Reports & Medical Privacy Separation", () => {
    interface SessionReportEntity {
      bookingId: string;
      mainIssue: string;
      summary: string;
      actionPlan: string;
      internalNotes: string; // Strictly confidential
      attachmentR2Keys: string[];
    }

    const mockReport: SessionReportEntity = {
      bookingId: "b-001",
      mainIssue: "Kecemasan Menghadapi Tekanan Karier & Ekspektasi Keluarga",
      summary: "Klien tampak tertekan oleh target pekerjaan dan kesulitan menetapkan batasan dengan orang tua.",
      actionPlan: "Latihan teknik grounding 5-4-3-2-1 dan journaling rasa cemas.",
      internalNotes: "Sensitif: Waspadai dinamika perfeksionisme dan ketegangan emosional masa remaja.",
      attachmentR2Keys: ["attendance-proof-1.jpg"],
    };

    function getClientReportView(report: SessionReportEntity) {
      // Must exclude internalNotes and attachmentR2Keys
      return {
        mainIssue: report.mainIssue,
        summary: report.summary,
        actionPlan: report.actionPlan,
      };
    }

    function getAdminReportView(report: SessionReportEntity) {
      // Admin sees completion and attendance proof, but NOT internalNotes
      return {
        isReportCompleted: true,
        attachmentR2Keys: report.attachmentR2Keys,
      };
    }

    it("includes mandatory Permasalahan Utama in client-facing report", () => {
      const clientView = getClientReportView(mockReport);
      expect(clientView.mainIssue).toBe("Kecemasan Menghadapi Tekanan Karier & Ekspektasi Keluarga");
      expect(clientView.summary).toBeDefined();
      expect(clientView.actionPlan).toBeDefined();
    });

    it("strictly isolates confidential internalNotes from client view", () => {
      const clientView = getClientReportView(mockReport) as any;
      expect(clientView.internalNotes).toBeUndefined();
      expect(clientView.attachmentR2Keys).toBeUndefined();
    });

    it("strictly isolates confidential internalNotes from admin view", () => {
      const adminView = getAdminReportView(mockReport) as any;
      expect(adminView.internalNotes).toBeUndefined();
      expect(adminView.summary).toBeUndefined();
      expect(adminView.attachmentR2Keys).toHaveLength(1);
    });
  });

  // ===========================================================================
  // 5. Decoupled Payroll & Financial Ledger Reporting
  // ===========================================================================
  describe("5. Decoupled Payroll & Financial Ledger Reporting", () => {
    const sessionLedger = [
      {
        bookingCode: "SL-3001",
        counselorType: "psychologist",
        baseFee: 150000,
        isExtended: false,
        extensionFee: 0,
        paymentMethod: "xendit",
      },
      {
        bookingCode: "SL-6001",
        counselorType: "peer",
        baseFee: 85000,
        isExtended: true,
        extensionFee: 35000,
        paymentMethod: "manual_bank_transfer",
      },
    ];

    it("aggregates total revenue accurately across automated and manual payments", () => {
      const totalRevenue = sessionLedger.reduce(
        (acc, curr) => acc + curr.baseFee + curr.extensionFee,
        0
      );
      expect(totalRevenue).toBe(150000 + 85000 + 35000); // Rp 270.000
    });

    it("formats CSV export correctly without internal payroll calculator", () => {
      const headers = ["Kode Booking", "Tipe Konselor", "Biaya Dasar", "Biaya Extend", "Metode Bayar"];
      const rows = sessionLedger.map((s) => [
        s.bookingCode,
        s.counselorType,
        s.baseFee.toString(),
        s.extensionFee.toString(),
        s.paymentMethod,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      expect(csvContent).toContain("SL-3001,psychologist,150000,0,xendit");
      expect(csvContent).toContain("SL-6001,peer,85000,35000,manual_bank_transfer");
    });
  });
});
