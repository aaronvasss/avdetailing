# Admin Payroll & Hours Management

Give the admin site one place to see and manage every worker's hours and hourly rate, instead of the rate-only editor buried in Settings.

## New admin section: "Team & Payroll"

Added to the admin sidebar (between Team Chat and Team Tracking). Contains two views:

### 1. Payroll overview (all workers)
- Date-range control with presets: Today, This Week, This Month, Last Month, Custom.
- One row per worker showing: name/email, hourly rate (editable inline), hours today, hours this week, hours this month, hours in the selected range, and estimated pay for the range (hours x rate).
- Totals row: total hours and total labor cost for the range.
- "Active/Inactive" toggle per worker, and the existing "Add Worker" flow moves here.
- Export the range to CSV for payroll.

### 2. Worker detail (click a worker)
- Full shift list for the selected range: date, clock in, clock out, duration, estimated pay.
- Admin can **edit** a shift's clock in/out times, **add** a missed shift manually, and **delete** a bad shift. Duration and pay recompute on save.
- Per-day and per-week subtotals so a week can be verified before paying.
- Jobs completed in the range with time logged per job, for cross-checking clocked hours against job time.

## Rate management
- Editing the hourly rate saves to the worker's profile and becomes the default for future pay calculations. Per-booking hourly overrides in the booking editor stay as they are.
- Rate changes are admin-only (already enforced in the database).

## Technical notes
- New files: `src/components/admin/AdminPayrollTab.tsx` (overview) and `src/components/admin/PayrollWorkerDetail.tsx` (shift editor). Both lazy-loaded in `AdminDashboard.tsx`, with a `payroll` entry in `AdminSidebar.tsx`.
- Hours/pay math reuses `src/lib/worker-pay.ts` (`fetchShifts`, `sumShiftMinutes`, `payForMinutes`, `formatHours`). Adds helpers for grouping shifts by day/week and recomputing `total_minutes` on edit.
- Shift queries are range-filtered on `clock_in_at` (no full-table loads); worker names come from a single batched `profiles` fetch.
- `WorkerManagementSection` is removed from Settings so worker admin lives in one place only.
- Database migration needed: admins can currently select/update/delete `worker_shifts` but **not insert** shifts for another user, so adding a missed shift would fail. The migration adds an admin insert policy on `worker_shifts`. No schema changes otherwise.
