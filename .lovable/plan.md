# Simpler way to enter a worker's hours

Right now setting hours means opening a dialog per day (or editing clock times). Replace that with a one-screen weekly timesheet where you just type numbers.

## Quick Hours timesheet

At the top of the worker detail (above the Shifts list), add a **Quick hours** card:

- A week strip: Mon–Sun of the selected week, with arrows to move to the previous/next week and a "This week" button.
- Each day is one row: day label, a single small input, and the day's pay preview.
- Type `7.5`, `7:30`, `7h 30m`, or `8` — the input accepts all of them and shows the resulting hours as you type.
- Tab moves to the next day, so a whole week can be entered without touching the mouse.
- One **Save week** button writes every changed day at once; unchanged days are left alone. Clearing a day's input to `0` removes that day's hours.
- Week total (hours + pay) updates live at the bottom of the card.

Behavior per day matches what already happens today: one shift gets its duration set, multiple shifts apply the difference to the last shift, and a day with no shift gets a new one created. Entries are auto-approved and keep the audit note in the shift record.

## Cleanup

- The per-day "Set hours" button and the two-mode Add/Edit dialog stay, but the dialog opens in Hours mode by default and Clock times becomes a small "Edit exact times" link — the fast path is the timesheet.

## Technical notes

- All changes in `src/components/admin/PayrollWorkerDetail.tsx`: new `QuickHoursWeek` sub-component holding a `Record<dateKey, string>` of draft inputs, plus a `saveWeek` that loops the changed days through the existing day-hours write logic.
- Reuses `parseHoursInput` / `minutesToHoursInput` and `payForMinutes` from `src/lib/worker-pay.ts`; no new helpers and no schema change (still `worker_shifts.total_minutes` with matching `clock_in_at` / `clock_out_at`).
- Week navigation is local to the card and independent of the page's date-range filter; after saving, the existing shift fetch reloads so totals and weekly subtotals refresh.
