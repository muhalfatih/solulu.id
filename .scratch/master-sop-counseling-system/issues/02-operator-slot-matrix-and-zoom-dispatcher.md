# 02: Operator Slot Matrix and Zoom Dispatcher

**What to build:**
A dedicated production Operator Console at `/operator` that provides real-time monitoring of the 7 daily fixed slots (08.00–22.00 WIB) and controls the hybrid 4 Zoom Pro accounts dispatcher. The operator immediately sees whether each slot is in Standalone Mode (≤4 sessions) or Breakout Mode (>4 sessions on Zoom 4), has 1-click clipboard copy buttons for breakout room names, a waiting room chat template copy tool, and live admit tracking that updates the database.

**Blocked by:** 01-core-app-shell-and-navigation

**Status:** done

- [x] Route `/operator` displays the 7 daily fixed slots (08.00–10.00, 10.00–12.00, 12.00–14.00, 14.00–16.00, 16.00–18.00, 18.00–20.00, 20.00–22.00 WIB) queried from PostgreSQL.
- [x] Each slot displays live session counts against maximum quota and automated badges indicating Standalone Mode vs Zoom 4 Breakout Mode.
- [x] For Breakout Mode sessions, each participant row includes a 1-click copy icon that copies the exact room name string `[Kode Booking] - [Nama Konselor]` to the clipboard.
- [x] Includes a "Salin Batch Nama Breakout" button to copy all room names for a selected slot at once.
- [x] Includes a 1-click copy button for the private chat template guiding Waiting Room participants with invalid names to rename themselves.
- [x] "Admit" button executes server action updating `operator_admitted_at` timestamp in the database and visually marks the participant as admitted.
- [x] Operator access is strictly isolated: operator cannot view clinical session notes or financial transactions.
- [x] Vitest test verifies slot matrix rendering and admit timestamp mutation.
