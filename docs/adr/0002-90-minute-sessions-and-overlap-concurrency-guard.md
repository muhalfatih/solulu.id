# 2. 90-Minute Sessions & Overlap-Based Concurrency Guard

The PRD specified 50-minute sessions with 10-minute buffers (total 60 minutes per slot). The product owner decided on **90-minute sessions** instead. This invalidates the original "compare by `(date, startTime)` equality" concurrency guard because a 90-minute session starting at 19:00 overlaps with a session starting at 20:00.

We now use **range overlap checking**: for any new slot with `[newStart, newStart + 90min)`, count all active bookings (`reserved`/`confirmed`) on the same date where `existingStart < newStart + 90min AND existingStart + 90min > newStart`. If count ≥ 2, the slot is rejected/hidden — because we only have 2 Zoom accounts.

Counselors input only `startTime` (hourly); `endTime` is computed as `startTime + 90 minutes`. No system-enforced buffer between sessions — counselors manage their own spacing. The slot hold window uses a 17-minute `reserved_until` (2 minutes longer than the 15-minute Xendit invoice expiry) to absorb webhook latency.
