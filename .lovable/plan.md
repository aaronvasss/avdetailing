# Everyday hours entry for Team & Payroll

Goal: make entering and adjusting hours a few-seconds job you can do daily, without leaving the payroll list.

## What you get

1. **Timesheet grid (new, top of Team & Payroll)**
   - One table: workers down the left, Mon–Sun across the top, week navigation (Previous / This week / Next).
   - Every cell is a small input — type `7.5`, `7:30` or `7h 30m` for any worker on any day.
   - Row totals (hours + pay) on the right, day totals at the bottom, overall week total in the corner.
   - One **Save** button commits every changed cell at once; entered hours are auto-approved so payroll totals update immediately. Clearing a cell to `0` removes that day's hours.
   - Unsaved cells are visually marked, bad input is highlighted in red.

2. **Today row (fast daily use)**
   - Above the grid: "Today — Fri Aug 7" with one input per worker and a single Save, so the daily routine is type-number → Save.

3. **Existing buttons stay**
   - "Add Hours" per worker keeps opening the single-worker week entry.
   - "Hours & Shifts" keeps the detailed per-shift view (exact clock times, add/edit/delete, approvals).

## Notes on behavior

- Days with multiple recorded shifts: the typed total is applied to the last shift of that day, earlier shifts untouched (same rule already used today), and the grid cell shows a small marker when a day has more than one shift so you know to open Hours & Shifts for detail.
- Open (still clocked-in) shifts are shown read-only in the grid to avoid overwriting a live clock-in.

## Technical section

- New `src/components/admin/PayrollTimesheetGrid.tsx`: fetches all staff shifts for the visible week in one `fetchShifts` call, builds a `{userId: {date: minutes}}` map, renders the editable grid, and batches saves.
- Extract the existing per-day write logic from `QuickHoursWeek.tsx` into `src/lib/worker-pay.ts` as `saveDayHours({ userId, dateKey, targetMinutes, existingShifts })` so grid, today row, and the single-worker card share one code path (insert / update-last-shift / delete, then `setShiftApproval(..., "approved")`).
- `AdminPayrollTab.tsx`: render the today row + timesheet grid above the worker cards; `onSaved` triggers the existing `load()` so approved-hours and labor-cost tiles refresh.
- No database or RLS changes needed — `worker_shifts` already supports admin inserts, updates, deletes, and approval.
