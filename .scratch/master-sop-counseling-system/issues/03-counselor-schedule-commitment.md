# 03: Counselor Schedule Commitment

**What to build:**
A dedicated schedule commitment portal at `/counselor/schedule` where counselors manage their weekly availability across the 7 fixed slots. The interface enforces the clinic's mandatory requirement of opening at least 10 slots per week, prevents bookings past the H-4 hour cutoff, and provides a structured dialog for leave/permission requests.

**Blocked by:** 01-core-app-shell-and-navigation

**Status:** completed

- [x] Route `/counselor/schedule` renders a 7-day weekly grid aligned with the 7 fixed 2-hour slots.
- [x] Visual progress indicator shows whether the counselor has met the minimum quota of 10 available slots for the upcoming week.
- [x] Counselor can toggle slot availability on/off with instant PostgreSQL persistence; slots already booked cannot be toggled off directly.
- [x] Leave/permission request dialog allows specifying dates and leave reasons, updating `is_leave: true` and `leave_reason` in the database.
- [x] System prevents clients from booking slots marked as leave or slots starting within less than 4 hours (H-4 cutoff).
- [x] Vitest test validates weekly minimum quota validation and leave scheduling guardrails.
