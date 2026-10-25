# 6. Recurring Weekly Schedule Templates & Rolling Materialization

## Context & Decision
Counselors need two scheduling workflows: manual weekly slot management and automatic recurring schedules that repeat every week. 

We considered three architectural options:
1. **Pure Virtual / Dynamic Generation on Query**: Generating slots in memory when users visit catalog/booking pages. Rejected because `bookings.scheduleId` requires a persistent foreign key to `schedules.id`, database row-level locking for concurrency during checkout (`SELECT FOR UPDATE`), and zero-mock policy compliance.
2. **Infinite Static Batch Insertion**: Inserting rows for many months ahead on save. Rejected due to database bloat, difficulty handling retroactive template edits, and timezone/DST inconsistencies.
3. **Template Blueprint + 4-Week Rolling Materialization (Selected)**: Storing the weekly template blueprint in `counselor_weekly_templates` (day of week 0–6, slot index 1–7) and generating physical rows in `schedules` for a 4-week rolling window.

## Architectural Guarantees
- **Rolling Window**: Immediate generation for 4 weeks on template activation/save, extended via lazy/cron buffers.
- **Weekly Override Isolation**: Toggling individual slots on specific dates in the live calendar creates or modifies records in `schedules` without altering the base `counselor_weekly_templates`.
- **Booking Protection**: Any slot with `status = 'booked'` or `status = 'reserved'` is strictly protected from deletion or cancellation when a template is updated or deactivated.
- **Commitment Enforcement**: Enabling automatic mode requires at least 10 active slots on the template, enforcing the platform's SLA.
- **Leave Priority**: Leave/permission records (`is_leave = true`) take precedence over recurring template slots; no template slot will overwrite an active leave date.
