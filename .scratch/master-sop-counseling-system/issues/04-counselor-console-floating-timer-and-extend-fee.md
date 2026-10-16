# 04: Counselor Console, Floating Timer and Extend Fee

**What to build:**
A clinical session management dashboard at `/counselor/dashboard` featuring the 6-digit Host Key Zoom display, today's booked sessions, and a persistent sticky Floating Timer widget. The timer guides time discipline with automated stage alerts (85m, 90m), respects a 5-minute grace period (90–95m), automatically calculates 30-minute extend fees (Rp 35.000 Sebaya / Rp 50.000 Psikolog) at minute 96, and halts at the maximum 120-minute slot limit.

**Blocked by:** 01-core-app-shell-and-navigation

**Status:** done

- [x] Route `/counselor/dashboard` lists upcoming bookings for today queried from real PostgreSQL schedules and bookings tables.
- [x] Displays the 6-digit Host Key for the counselor's assigned Zoom account so they can claim host privileges inside the Zoom client.
- [x] "Mulai Sesi (Timer)" button activates the sticky Floating Timer widget in the bottom-right corner of the viewport.
- [x] Floating Timer widget displays elapsed time (`MM:SS`) and color-coded status stages (Green 0–84m, Amber 85–89m, Blue 90–95m grace period, Orange 96–119m extension, Red 120m hard stop).
- [x] At minute 85, emits visual warning and toast notification ("5 menit menuju batas standar 90 menit").
- [x] At minute 90, indicates grace period (minutes 90–95) without incurring any extension fee.
- [x] At minute 96, automatically computes 1 block of 30 minutes extend fee based on counselor type (Rp 35.000 for Peer Counselor, Rp 50.000 for Psychologist) and presents a button to record the extension in the database.
- [x] At minute 120, timer automatically halts and prompts the counselor to terminate the session.
- [x] Vitest test validates timer duration logic and extend fee calculation rules.
