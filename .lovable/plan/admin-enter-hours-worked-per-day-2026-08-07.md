# Admin: enter hours worked per day

Today the only way to correct a worker's time in Team & Payroll is by editing exact clock in / clock out timestamps. Add a way to just type the number of hours for a day when something changes.

## What changes

### 1. Shift editor gets two modes
The Add/Edit Shift dialog gains a toggle at the top:
- **Hours worked** (new, default when adding): pick a date and type hours (e.g. `7.5` or `7h 30m`). Clock in/out are derived so the record stays consistent, and the saved duration is exactly the hours entered.
- **Clock times** (existing): keep the current clock in / clock out datetime inputs for precise corrections.

Editing an existing shift opens in Hours mode showing its current hours; switching to Clock times shows the real timestamps.

### 2. Per-day quick edit
Each day group header in the worker detail (e.g. "Mon, Aug 3 — 7h 30m") gets an inline **Set hours** control. Typing a new total for that day:
- If the day has one shift, its duration is updated to match.
- If the day has multiple shifts, the difference is applied to the last shift of the day (with a short note in the dialog explaining this).
- If the day has no shift yet, a new shift is created for that date with the entered hours.

### 3. Audit trail
Any admin-entered or adjusted time is marked in the shift notes as an admin adjustment with the previous hours, and set to **Approved** on save (admin-entered time is trusted), so payroll totals update immediately. Weekly, daily, and range totals recompute from the saved durations as they do now.

## Technical notes
- All changes are in `src/components/admin/PayrollWorkerDetail.tsx`. No schema change: hours are stored in the existing `worker_shifts.total_minutes`, with `clock_in_at` / `clock_out_at` written to match so worker-side views stay correct.
- Add small helpers in `src/lib/worker-pay.ts`: `parseHoursInput` (accepts `7.5`, `7:30`, `7h 30m`) and `minutesToHoursInput` for round-tripping.
- `shiftMinutes()` already prefers `total_minutes`, so payroll math needs no change.
- Approval writes reuse `setShiftApproval`; the existing admin-only approval trigger continues to guard it.
