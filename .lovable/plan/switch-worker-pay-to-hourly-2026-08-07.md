# Switch Worker Pay to Hourly

Replace commission/flat-per-job pay with a straight hourly rate ($18/hr default), and show hours worked per day, week, and month.

## How pay will be calculated

- Pay comes from clock-in/clock-out shifts (the Timesheet), so drive time and prep time count.
- Each worker has their own hourly rate, defaulting to $18/hr.
- Pay for a period = total shift hours in that period x hourly rate.
- Tips stay separate and are added on top, as they are today.
- Job hours (time logged from job start to complete) are shown alongside shift hours for comparison, but do not drive pay.

## Worker side

**Earnings page**
- Replace the four job-count cards with hourly stats for Today / This Week / This Month / All Time: hours worked, pay earned, tips.
- Replace "Your default pay rate" with "Your hourly rate — $18.00/hr".
- Summary bar becomes: Hours, Base Pay (hours x rate), Tips, Total Earned.
- Add a comparison line: shift hours vs. hours logged on jobs for the selected period, so unbilled time is visible.
- The job list stops showing per-job commission math. Each completed job shows the service, date, job duration, and tip. Per-job "Pay: $X" is removed since pay is time-based, unless the job carries an hourly override (see below).

**Dashboard**
- Today's earnings tile switches to hours-worked-today x hourly rate + tips.

**Profile page**
- "Pay Rate" becomes "Hourly Rate — $18.00/hr", with lifetime hours and lifetime pay instead of commission totals.

**Timesheet page**
- Add per-day, per-week, and per-month hour totals plus estimated pay at the worker's rate. Existing shift rows stay as-is.

## Admin side

**Worker Management**
- Remove the Pay Type selector. Each worker row gets a single "Hourly Rate ($/hr)" field.
- The Add Worker form asks only for an hourly rate, prefilled at 18.

**Booking screens (Admin Booking Modal, Booking Edit Dialog)**
- The custom pay override stays but becomes hourly-only: a single "Custom hourly rate for this job" field, no percentage/flat dropdown. Leaving it blank uses the worker's default rate.

**Analytics**
- Labor cost switches from commission math to shift hours x hourly rate for the selected date range.
- Add a Labor Hours metric next to Labor Cost.

## Technical notes

- Migration on `worker_profiles`: set `pay_type` to `'hourly'` for all rows, change its default to `'hourly'`, and set `pay_rate` to `18` where it is currently 0 or a percentage value. Column names are kept so existing code and the `prevent_worker_pay_changes` trigger keep working (workers still cannot edit their own rate).
- Migration on `bookings`: normalize `worker_pay_type` to `'hourly'` or NULL; existing `percentage`/`flat` overrides are cleared to NULL so those jobs fall back to the worker's hourly rate.
- `create-booking` and `admin-update-booking-worker` edge functions: accept only `'hourly'` for `worker_pay_type`.
- `create-worker` edge function: default `pay_type` to `'hourly'`, `pay_rate` to 18.
- New shared helper (e.g. `src/lib/worker-pay.ts`) that aggregates `worker_shifts.total_minutes` by day/week/month and computes pay, used by the worker earnings, dashboard, profile, timesheet, and admin analytics screens so the math lives in one place.
- Open shifts (no `clock_out_at`) count elapsed time to now for the live "today" figure.
