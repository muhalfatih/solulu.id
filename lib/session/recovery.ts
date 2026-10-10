"use server"

import { headers } from "next/headers"
import { eq, and, gte, inArray } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules } from "@/db/schema"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import { recoverSessionSchema, type RecoverSessionInput } from "@/lib/validations/session"
import { checkRateLimit, type RateLimitResult } from "./rate-limit"
import { getAppBaseUrl } from "@/lib/url"

import {
  PRIVACY_SAFE_SUCCESS_MESSAGE,
  type ActiveBookingMatch,
  type SessionRecoveryDependencies,
  type RecoverSessionResponse,
} from "./types"

/**
 * Normalizes Indonesian phone number for matching: 08xxx -> +62xxx / 62xxx
 */
function normalizePhoneForSearch(phone: string): string[] {
  const digits = phone.replace(/\D/g, "")
  const variants = new Set<string>()

  variants.add(phone.trim())
  variants.add(digits)

  if (digits.startsWith("08")) {
    variants.add("62" + digits.slice(1))
    variants.add("+62" + digits.slice(1))
    variants.add(digits)
  } else if (digits.startsWith("628")) {
    variants.add("0" + digits.slice(2))
    variants.add("+" + digits)
    variants.add(digits)
  }

  return Array.from(variants)
}

/**
 * Server action to safely recover guest patient session links.
 * Complies with US-19, US-20 (privacy-safe response), and US-21 (rate-limiting).
 */
export async function recoverSessionLinkAction(
  rawInput: RecoverSessionInput,
  deps?: SessionRecoveryDependencies
): Promise<RecoverSessionResponse> {
  try {
    // 1. Validate Form Input
    const parsed = recoverSessionSchema.safeParse(rawInput)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Data formulir tidak valid",
      }
    }

    const { email, phone } = parsed.data

    // 2. Resolve Client IP for Rate Limiting (US-21)
    let clientIp = "127.0.0.1"
    if (deps?.getClientIp) {
      clientIp = await deps.getClientIp()
    } else {
      try {
        const headerList = await headers()
        const forwarded = headerList.get("x-forwarded-for")
        clientIp =
          forwarded?.split(",")[0]?.trim() ||
          headerList.get("x-real-ip") ||
          "127.0.0.1"
      } catch {
        // Fallback for non-request environments
      }
    }

    // 3. Rate Limit Check (3 attempts per 15 min per IP)
    const rateLimitCheck = deps?.rateLimiter
      ? await deps.rateLimiter(clientIp)
      : await checkRateLimit(clientIp)

    if (!rateLimitCheck.success) {
      return {
        success: false,
        error:
          "Batas permintaan pengecekan tercapai (maksimal 3 kali dalam 15 menit). Silakan coba lagi nanti atau hubungi tim bantuan.",
        rateLimited: true,
      }
    }

    // 4. Query active bookings matching patient email & phone
    let matches: ActiveBookingMatch[] = []

    if (deps?.findActiveBookings) {
      matches = await deps.findActiveBookings(email, phone)
    } else {
      const today = new Date().toISOString().split("T")[0]
      const phoneVariants = normalizePhoneForSearch(phone)

      // Query database
      const rows = await db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
        })
        .from(bookings)
        .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .where(
          and(
            eq(bookings.patientEmail, email),
            inArray(bookings.status, ["confirmed", "pending_payment"]),
            gte(schedules.date, today)
          )
        )

      // Filter phone match
      const matchingRows = rows.filter((r) =>
        phoneVariants.some(
          (pv) =>
            r.booking.patientPhone === pv ||
            r.booking.patientPhone.replace(/\D/g, "") === pv.replace(/\D/g, "")
        )
      )

      matches = matchingRows.map((r) => ({
        accessToken: r.booking.accessToken,
        patientName: r.booking.patientName,
        patientEmail: r.booking.patientEmail,
        counselorName: r.counselor.fullName,
        date: formatIndonesianDate(r.schedule.date),
        timeRange: formatTimeRange(r.schedule.startTime, r.schedule.endTime),
        status: r.booking.status,
      }))
    }

    // 5. If matches found, dispatch recovery email
    if (matches.length > 0) {
      if (deps?.sendRecoveryEmail) {
        await deps.sendRecoveryEmail(email, matches)
      } else if (process.env.RESEND_API_KEY) {
        try {
          const appBaseUrl = getAppBaseUrl()
          const sessionLinksHtml = matches
            .map(
              (m) =>
                `<li><strong>${m.counselorName}</strong> (${m.date}, ${m.timeRange})<br/><a href="${appBaseUrl}/session/${m.accessToken}">Buka Ruang Sesi: ${appBaseUrl}/session/${m.accessToken}</a></li>`
            )
            .join("")

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Solulu Support <halo@solulu.id>",
              to: [email],
              subject: "Pemulihan Tautan Ruang Sesi Konseling - Solulu",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
                  <h2>Halo, ${matches[0].patientName}</h2>
                  <p>Kami menerima permintaan untuk memulihkan tautan ruang sesi konseling Anda di Solulu.</p>
                  <p>Berikut adalah tautan sesi aktif Anda:</p>
                  <ul>${sessionLinksHtml}</ul>
                  <p>Tautan ini bersifat privat. Simpan email ini untuk mengakses ruang telekonseling Anda.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Jika Anda tidak merasa meminta email ini, silakan abaikan.</p>
                </div>
              `,
            }),
          })
        } catch (mailErr) {
          console.error("Failed to send recovery email via Resend:", mailErr)
        }
      } else {
        // Dev fallback log
        console.log(
          `[DEV RECOVERY] Email dispatched to ${email} with ${matches.length} session(s):`,
          matches.map((m) => `/session/${m.accessToken}`)
        )
      }
    }

    // 6. Return ALWAYS privacy-safe success message (US-20)
    return {
      success: true,
      message: PRIVACY_SAFE_SUCCESS_MESSAGE,
      debugMatchesFound: matches.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memproses pemulihan tautan sesi",
    }
  }
}
