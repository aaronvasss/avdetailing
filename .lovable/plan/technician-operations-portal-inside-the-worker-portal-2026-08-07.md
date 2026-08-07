# Technician operations portal (inside the worker portal)

Built into the existing worker portal at `/worker`, using the same employee login. Jobs come from your existing bookings — every booking becomes a job automatically, with job number, customer, and vehicle carried over. Delivered in three stages.

## Roles

Four roles, extending what you already have:

- **Administrator** — existing `admin`. Full access, builds SOP/service templates.
- **Technician** — existing `staff`. Sees only their assigned jobs.
- **Manager / QC inspector** — new `manager` role. Reviews, approves, or returns jobs.
- **Marketing** — new `marketing` role. Sees only consented, manager-approved media.

Admins assign roles from the admin Team screen. Existing workers stay technicians; nothing they do today breaks.

## Stage 1 — Jobs, workflow, check-in, media, checklists, QC

New portal tabs: **Today**, **My Jobs**, **QC Queue** (manager/admin), plus the existing timesheet/chat/earnings.

Workflow enforced end to end:

```text
Assigned -> Check-in -> In Progress -> Submitted for QC -> Approved
                                                       -> Rework Required -> In Progress
Approved -> Delivered
```

Job detail screen (one job, stepper across the top, large tap targets):

1. **Check-in** — vehicle year/make/model/color/plate, odometer, fuel, customer concerns, marketing consent toggle. Prefilled from the booking; technician confirms.
2. **Existing damage** — tap a damage type, add location note and photo. At least one entry required (or an explicit "no pre-existing damage" confirmation).
3. **Before media** — camera-first capture, photos and video, grouped by required category.
4. **Checklist** — required items must all be ticked; during-service media attach to items.
5. **After media** — camera-first, required categories.
6. **Notes + signature** — technician notes and a finger/stylus signature.

**Submit for QC** stays locked until check-in fields, before photos, damage record, every required checklist item, after photos, and the signature are all done. The button shows exactly what's still missing.

**QC review** (manager/admin): side-by-side before/after media, checklist, technician notes. Approve, or **Request rework** with notes plus annotated photos of what needs fixing. Rework sends the job back to the technician with a notification, and the rework reason shows at the top of their job screen. Approved jobs move to Delivered when handed over.

All media stored in private buckets — only signed-in employees with the right role can open it.

## Stage 2 — Service SOP template library

Admins build a template per service containing: SOP title, version, written instructions, training video, required tools, required chemicals, PPE and safety warnings, technician checklist, required photo categories, QC checklist, and customer aftercare instructions.

Technicians get a read-only **SOP library** tab and an inline "View SOP" panel on the job screen. When a job starts, its selected services pull in their template checklists and required photo categories, so the gates in Stage 1 come from the SOP, not hardcoded lists.

## Stage 3 — Dashboard and marketing media library

**Ops dashboard** (manager/admin): jobs waiting to start, in progress, waiting for QC, requiring rework, completed today, completed per technician, and QC failure / rework rate over a selectable date range.

**Marketing media library** (marketing/admin): only media where the customer's marketing consent is recorded *and* a manager approved the item. Grid of before/after pairs, filter by service and vehicle, download originals. Consent revoked or approval removed pulls the media out immediately.

## Look and feel on the floor

Optimized for workshop iPads and technician phones: large buttons, one decision per screen, camera-first capture with automatic compression, tap-to-select instead of typing wherever possible, a clear step progress bar, and a light professional theme with dark text for glare-heavy shop lighting — distinct from the black marketing site.

## Technical section

Stage 1 database work (one migration):

- `app_role` gains `manager` and `marketing`; helper functions `is_manager()` / `is_marketing()` following the existing `is_staff()` security-definer pattern.
- `ops_jobs` — one row per booking (`booking_id` unique), job number, status enum for the seven workflow states, assigned technician, check-in fields, marketing consent, technician signature + completion time, QC notes + approval time, rework count.
- `ops_job_damage` — damage entries with type, location, note, photo path.
- `ops_job_checklist` — per-job checklist items, required flag, completion, completed_by/at.
- `ops_job_media` — media rows with phase (`before` / `during` / `after` / `rework`), category, storage path, plus `manager_approved` for marketing.
- New private storage bucket `ops-media` with role-scoped `storage.objects` policies.
- RLS: technicians read/write only their assigned jobs and cannot change status past "Submitted for QC"; a trigger restricts QC fields, approval, and manager-approval flags to manager/admin, mirroring the existing `prevent_worker_shift_approval_changes` pattern. Every new public table gets explicit GRANTs.
- Jobs are created from bookings by a trigger on `bookings` insert plus a one-time backfill for open bookings.

Frontend: new `src/pages/ops/*` pages mounted under `/worker`, shared job state in `src/hooks/useOpsJob.ts`, gate logic in `src/lib/ops-workflow.ts` (single source of truth for "can submit for QC"), reusing `usePhotoUpload` and `src/lib/image-compress.ts` for camera uploads. `WorkerLayout` nav becomes role-aware. Stage 2 adds `ops_service_templates` + `ops_template_items`; Stage 3 is read-only aggregation over Stage 1 and 2 tables.
