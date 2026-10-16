"use server";

import { db } from "@/db";
import {
  counselors,
  schedules,
  bookings,
  zoomAccounts,
  platformSettings,
  sessionReports,
  transactions,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface PrototypeData {
  settings: typeof platformSettings.$inferSelect | null;
  zoomAccounts: (typeof zoomAccounts.$inferSelect)[];
  counselors: (typeof counselors.$inferSelect)[];
  schedules: (typeof schedules.$inferSelect & {
    counselor: typeof counselors.$inferSelect;
    bookings: (typeof bookings.$inferSelect & {
      sessionReport?: typeof sessionReports.$inferSelect | null;
    })[];
  })[];
  todayBookings: (typeof bookings.$inferSelect & {
    counselor: typeof counselors.$inferSelect;
    schedule: typeof schedules.$inferSelect;
    sessionReport?: typeof sessionReports.$inferSelect | null;
  })[];
  transactions: (typeof transactions.$inferSelect)[];
}

/**
 * Fetches real operational data from PostgreSQL database for the interactive prototype.
 * Strictly adheres to Database-First & Zero-Mock Policy.
 */
export async function getPrototypeDataAction(): Promise<PrototypeData> {
  const [settingsRow] = await db.select().from(platformSettings).limit(1);

  const zoomList = await db
    .select()
    .from(zoomAccounts)
    .orderBy(zoomAccounts.accountNumber);

  const counselorList = await db
    .select()
    .from(counselors)
    .orderBy(desc(counselors.createdAt));

  const todayStr = new Date().toISOString().split("T")[0];

  const todaySchedules = await db.query.schedules.findMany({
    where: eq(schedules.date, todayStr),
    orderBy: [schedules.slotIndex, schedules.startTime],
    with: {
      counselor: true,
      bookings: {
        with: {
          sessionReport: true,
        },
      },
    },
  });

  const allBookings = await db.query.bookings.findMany({
    orderBy: [desc(bookings.createdAt)],
    limit: 50,
    with: {
      counselor: true,
      schedule: true,
      sessionReport: true,
    },
  });

  const allTransactions = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return {
    settings: settingsRow || null,
    zoomAccounts: zoomList,
    counselors: counselorList,
    schedules: todaySchedules as any,
    todayBookings: allBookings as any,
    transactions: allTransactions,
  };
}

/**
 * Updates platform parameters (Superadmin).
 */
export async function updatePlatformSettingsAction(data: {
  bookingCutoffHours: number;
  rescheduleCutoffHours: number;
  paymentHoldMinutes: number;
  maxSlotQuota: number;
  minCounselorWeeklySlots: number;
  noShowTimeoutMinutes: number;
  basePrice: string;
  counselorExtendFeePer30Min: string;
  psychologistExtendFeePer30Min: string;
  isManualPaymentEnabled: boolean;
  manualPaymentInstructions: string;
}) {
  await db
    .update(platformSettings)
    .set({
      bookingCutoffHours: data.bookingCutoffHours,
      rescheduleCutoffHours: data.rescheduleCutoffHours,
      paymentHoldMinutes: data.paymentHoldMinutes,
      maxSlotQuota: data.maxSlotQuota,
      minCounselorWeeklySlots: data.minCounselorWeeklySlots,
      noShowTimeoutMinutes: data.noShowTimeoutMinutes,
      basePrice: data.basePrice,
      counselorExtendFeePer30Min: data.counselorExtendFeePer30Min,
      psychologistExtendFeePer30Min: data.psychologistExtendFeePer30Min,
      isManualPaymentEnabled: data.isManualPaymentEnabled,
      manualPaymentInstructions: data.manualPaymentInstructions,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Verifies or updates counselor status (Admin).
 */
export async function verifyCounselorAction(counselorId: string, status: "verified" | "pending" | "rejected") {
  await db
    .update(counselors)
    .set({
      verificationStatus: status,
    })
    .where(eq(counselors.id, counselorId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Operator admits client to breakout room.
 */
export async function admitClientToBreakoutAction(bookingId: string) {
  await db
    .update(bookings)
    .set({
      operatorAdmittedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Marks booking as followed up via WhatsApp (Admin).
 */
export async function markFollowUpAction(bookingId: string) {
  await db
    .update(bookings)
    .set({
      isFollowedUp: true,
      followedUpAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Marks booking as No-Show after 30 minutes (Counselor/Operator).
 */
export async function markNoShowAction(bookingId: string) {
  await db
    .update(bookings)
    .set({
      isNoShow: true,
      noShowMarkedAt: new Date(),
      status: "completed",
    })
    .where(eq(bookings.id, bookingId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Submits clinical session report (Counselor).
 * Now strictly includes Permasalahan Utama (mainIssue).
 */
export async function submitSessionReportAction(data: {
  bookingId: string;
  counselorId: string;
  mainIssue: string;
  summary: string;
  actionPlan: string;
  internalNotes: string;
  actualDurationMinutes: number;
}) {
  const existing = await db
    .select()
    .from(sessionReports)
    .where(eq(sessionReports.bookingId, data.bookingId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(sessionReports)
      .set({
        mainIssue: data.mainIssue,
        summary: data.summary,
        actionPlan: data.actionPlan,
        internalNotes: data.internalNotes,
        actualDurationMinutes: data.actualDurationMinutes,
      })
      .where(eq(sessionReports.bookingId, data.bookingId));
  } else {
    await db.insert(sessionReports).values({
      bookingId: data.bookingId,
      counselorId: data.counselorId,
      mainIssue: data.mainIssue,
      summary: data.summary,
      actionPlan: data.actionPlan,
      internalNotes: data.internalNotes,
      actualDurationMinutes: data.actualDurationMinutes,
    });
  }

  await db
    .update(bookings)
    .set({ status: "completed" })
    .where(eq(bookings.id, data.bookingId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Verifies client WhatsApp phone number to unlock the session report.
 * Strictly masks internal notes and photo documentation proof.
 */
export async function verifyClientReportAccessAction(bookingId: string, inputPhone: string) {
  const [b] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!b) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  // Normalize phone numbers for comparison
  const normSaved = b.patientPhone.replace(/\D/g, "");
  const normInput = inputPhone.replace(/\D/g, "");

  if (!normSaved.endsWith(normInput) && !normInput.endsWith(normSaved)) {
    return {
      success: false,
      error: "Nomor WhatsApp tidak cocok dengan nomor pemesanan.",
    };
  }

  const [rep] = await db
    .select()
    .from(sessionReports)
    .where(eq(sessionReports.bookingId, bookingId))
    .limit(1);

  if (!rep) {
    return {
      success: false,
      error: "Konselor belum menyelesaikan laporan untuk sesi ini.",
    };
  }

  // Return strictly client-visible fields only!
  return {
    success: true,
    report: {
      mainIssue: rep.mainIssue,
      summary: rep.summary,
      actionPlan: rep.actionPlan,
      createdAt: rep.createdAt,
    },
  };
}

/**
 * Records an extension on a booking (Counselor / System) with 30-minute block calculation.
 * Supports Xendit or Manual Bank Transfer.
 */
export async function recordSessionExtensionAction(data: {
  bookingId: string;
  extensionMinutes: number;
  extensionFee: string;
  paymentMethod: "xendit" | "manual_bank_transfer";
}) {
  await db
    .update(bookings)
    .set({
      isExtended: true,
      extensionMinutes: data.extensionMinutes,
      extensionFee: data.extensionFee,
      extensionPaymentStatus: "PAID",
      extensionPaymentMethod: data.paymentMethod,
    })
    .where(eq(bookings.id, data.bookingId));

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Submits manual payment proof for initial booking or extension (Client).
 */
export async function submitManualPaymentAction(data: {
  bookingId: string;
  proofR2Key: string;
  isExtension?: boolean;
}) {
  if (data.isExtension) {
    await db
      .update(bookings)
      .set({
        extensionPaymentMethod: "manual_bank_transfer",
        extensionPaymentStatus: "PENDING",
        extensionProofR2Key: data.proofR2Key,
      })
      .where(eq(bookings.id, data.bookingId));
  } else {
    await db
      .update(bookings)
      .set({
        paymentMethod: "manual_bank_transfer",
        manualPaymentStatus: "PENDING",
        manualPaymentProofR2Key: data.proofR2Key,
      })
      .where(eq(bookings.id, data.bookingId));
  }

  revalidatePath("/prototype");
  return { success: true };
}

/**
 * Verifies or rejects manual payment transfer (Admin).
 */
export async function verifyManualPaymentAction(bookingId: string, isApproved: boolean, isExtension?: boolean) {
  if (isExtension) {
    await db
      .update(bookings)
      .set({
        extensionPaymentStatus: isApproved ? "PAID" : "REJECTED",
      })
      .where(eq(bookings.id, bookingId));
  } else {
    if (isApproved) {
      await db
        .update(bookings)
        .set({
          manualPaymentStatus: "VERIFIED",
          status: "confirmed",
        })
        .where(eq(bookings.id, bookingId));
    } else {
      await db
        .update(bookings)
        .set({
          manualPaymentStatus: "REJECTED",
        })
        .where(eq(bookings.id, bookingId));
    }
  }

  revalidatePath("/prototype");
  return { success: true };
}
