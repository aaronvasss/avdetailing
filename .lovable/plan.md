# Let workers log their own tips

Today tips only reach the system two ways: a customer tips online, or an admin adds one to a booking. Workers have no way to record cash tips they collect in person. This adds simple tip logging inside the worker portal, and rolls those amounts into the existing pay and payroll totals.

## What the worker sees

On the Pay page (which already shows hours, pay and tips):

- A "Log a tip" button opens a small sheet with: amount, date (defaults to today), optional payment type (cash, Venmo, Zelle, other) and an optional note.
- Below the totals, a "My logged tips" list for the selected week/range showing date, amount, type, note, with edit and delete on each entry.
- The existing Tips card becomes a combined figure: customer tips from bookings plus self-logged tips, with a one-line breakdown underneath so it's clear where the money came from.

Workers can only see and manage their own tip entries.

## What the admin sees

In Team & Payroll, the tip totals (range card, per-worker week/month/range, "Pay + tips", and the CSV export) include self-logged tips alongside booking tips. Each worker row keeps a split so you can tell reported cash tips apart from online tips. Admins can view, correct or delete any worker's logged tip.

## Technical notes

- New table `public.worker_tips`: `id`, `user_id`, `tip_date` (date), `amount` (numeric, must be > 0), `payment_type` (text, default `cash`), `note`, `booking_id` (nullable reference to bookings), `created_at`, `updated_at` with the standard updated_at trigger.
- Grants for `authenticated` and `service_role`; RLS: workers select/insert/update/delete rows where `user_id = auth.uid()`; admins/managers full access via `is_admin()` / `is_manager()`; a trigger blocks a worker from changing `user_id` on an existing row.
- Amount validated client-side with zod (positive, max reasonable cap) and by the DB check constraint.
- `src/pages/WorkerPayPage.tsx`: fetch `worker_tips` for the visible range, add the log/edit sheet, tips breakdown and the entries list.
- `src/components/admin/AdminPayrollTab.tsx`: fetch `worker_tips` in the existing parallel load, merge into `tipsInWindow` totals, add booking-vs-logged split in the worker breakdown, and add columns to the CSV export.
