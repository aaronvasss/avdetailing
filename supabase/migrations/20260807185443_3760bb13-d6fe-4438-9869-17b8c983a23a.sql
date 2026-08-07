ALTER TABLE public.worker_shifts
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_note text;

ALTER TABLE public.worker_shifts
  DROP CONSTRAINT IF EXISTS worker_shifts_approval_status_check;

ALTER TABLE public.worker_shifts
  ADD CONSTRAINT worker_shifts_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

UPDATE public.worker_shifts
  SET approval_status = 'approved', approved_at = COALESCE(approved_at, updated_at)
  WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS worker_shifts_approval_status_idx
  ON public.worker_shifts (approval_status);

CREATE OR REPLACE FUNCTION public.prevent_worker_shift_approval_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.approval_note IS DISTINCT FROM OLD.approval_note
  THEN
    RAISE EXCEPTION 'Only admins can change shift approval status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_worker_shift_approval_changes ON public.worker_shifts;
CREATE TRIGGER trg_prevent_worker_shift_approval_changes
  BEFORE UPDATE ON public.worker_shifts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_worker_shift_approval_changes();