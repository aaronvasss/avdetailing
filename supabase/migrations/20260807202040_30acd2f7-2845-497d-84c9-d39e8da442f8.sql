-- 1. New roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';

-- 2. Role helpers (text comparison so new enum values are usable immediately)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text IN ('manager', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_marketing()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text IN ('marketing', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_ops_employee()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'staff', 'manager', 'marketing')
  )
$$;

-- 3. Job number sequence
CREATE SEQUENCE IF NOT EXISTS public.ops_job_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_ops_job_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'AV-' || to_char(now(), 'YYMM') || '-' || nextval('public.ops_job_number_seq')::text
$$;

-- 4. Jobs
CREATE TABLE public.ops_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  job_number text NOT NULL UNIQUE DEFAULT public.next_ops_job_number(),
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned','checked_in','in_progress','submitted_for_qc','rework_required','approved','delivered')),
  assigned_technician_id uuid,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  license_plate text,
  odometer text,
  fuel_level text,
  customer_concerns text,
  checked_in_at timestamptz,
  checked_in_by uuid,
  no_prior_damage boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  technician_notes text,
  technician_signature text,
  technician_completed_at timestamptz,
  qc_notes text,
  qc_reviewed_by uuid,
  qc_approved_at timestamptz,
  rework_notes text,
  rework_count integer NOT NULL DEFAULT 0,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_jobs TO authenticated;
GRANT ALL ON public.ops_jobs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ops_job_number_seq TO authenticated, service_role;
ALTER TABLE public.ops_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view ops jobs"
ON public.ops_jobs FOR SELECT TO authenticated
USING (public.is_ops_employee());

CREATE POLICY "Managers can create ops jobs"
ON public.ops_jobs FOR INSERT TO authenticated
WITH CHECK (public.is_manager());

CREATE POLICY "Technicians update own jobs, managers update all"
ON public.ops_jobs FOR UPDATE TO authenticated
USING (public.is_manager() OR assigned_technician_id = auth.uid())
WITH CHECK (public.is_manager() OR assigned_technician_id = auth.uid());

CREATE POLICY "Admins can delete ops jobs"
ON public.ops_jobs FOR DELETE TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_ops_jobs_updated_at
BEFORE UPDATE ON public.ops_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Technicians may not touch QC / approval fields or self-approve
CREATE OR REPLACE FUNCTION public.prevent_tech_qc_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_manager() THEN
    RETURN NEW;
  END IF;

  IF NEW.qc_notes IS DISTINCT FROM OLD.qc_notes
    OR NEW.qc_reviewed_by IS DISTINCT FROM OLD.qc_reviewed_by
    OR NEW.qc_approved_at IS DISTINCT FROM OLD.qc_approved_at
    OR NEW.rework_notes IS DISTINCT FROM OLD.rework_notes
    OR NEW.rework_count IS DISTINCT FROM OLD.rework_count
    OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
    OR NEW.job_number IS DISTINCT FROM OLD.job_number
    OR NEW.assigned_technician_id IS DISTINCT FROM OLD.assigned_technician_id
  THEN
    RAISE EXCEPTION 'Only managers can change QC, rework, delivery or assignment fields';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('checked_in','in_progress','submitted_for_qc')
  THEN
    RAISE EXCEPTION 'Technicians can only move a job up to Submitted for QC';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_tech_qc_changes
BEFORE UPDATE ON public.ops_jobs
FOR EACH ROW EXECUTE FUNCTION public.prevent_tech_qc_changes();

-- 5. Pre-existing damage
CREATE TABLE public.ops_job_damage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ops_jobs(id) ON DELETE CASCADE,
  damage_type text NOT NULL,
  location_note text,
  note text,
  photo_path text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_job_damage TO authenticated;
GRANT ALL ON public.ops_job_damage TO service_role;
ALTER TABLE public.ops_job_damage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view job damage"
ON public.ops_job_damage FOR SELECT TO authenticated
USING (public.is_ops_employee());

CREATE POLICY "Assigned tech or manager can add job damage"
ON public.ops_job_damage FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Assigned tech or manager can update job damage"
ON public.ops_job_damage FOR UPDATE TO authenticated
USING (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Assigned tech or manager can delete job damage"
ON public.ops_job_damage FOR DELETE TO authenticated
USING (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

-- 6. Checklist
CREATE TABLE public.ops_job_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ops_jobs(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_job_checklist TO authenticated;
GRANT ALL ON public.ops_job_checklist TO service_role;
ALTER TABLE public.ops_job_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view job checklist"
ON public.ops_job_checklist FOR SELECT TO authenticated
USING (public.is_ops_employee());

CREATE POLICY "Assigned tech or manager can add checklist items"
ON public.ops_job_checklist FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Assigned tech or manager can update checklist items"
ON public.ops_job_checklist FOR UPDATE TO authenticated
USING (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Managers can delete checklist items"
ON public.ops_job_checklist FOR DELETE TO authenticated
USING (public.is_manager());

-- 7. Media
CREATE TABLE public.ops_job_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ops_jobs(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('before','during','after','rework','damage')),
  category text,
  media_type text NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo','video')),
  storage_path text NOT NULL,
  caption text,
  uploaded_by uuid,
  manager_approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_job_media TO authenticated;
GRANT ALL ON public.ops_job_media TO service_role;
ALTER TABLE public.ops_job_media ENABLE ROW LEVEL SECURITY;

-- Staff/manager/admin see all job media; marketing-only users see approved + consented media
CREATE POLICY "Ops staff view job media"
ON public.ops_job_media FOR SELECT TO authenticated
USING (
  public.is_staff() OR public.is_manager()
  OR (
    public.is_marketing()
    AND manager_approved = true
    AND EXISTS (
      SELECT 1 FROM public.ops_jobs j
      WHERE j.id = job_id AND j.marketing_consent = true
    )
  )
);

CREATE POLICY "Assigned tech or manager can add job media"
ON public.ops_job_media FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Assigned tech or manager can update job media"
ON public.ops_job_media FOR UPDATE TO authenticated
USING (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Assigned tech or manager can delete job media"
ON public.ops_job_media FOR DELETE TO authenticated
USING (
  public.is_manager() OR EXISTS (
    SELECT 1 FROM public.ops_jobs j
    WHERE j.id = job_id AND j.assigned_technician_id = auth.uid()
  )
);

-- Only managers may flip the marketing approval flag
CREATE OR REPLACE FUNCTION public.prevent_media_approval_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_manager() THEN
    RETURN NEW;
  END IF;
  IF NEW.manager_approved IS DISTINCT FROM OLD.manager_approved
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
  THEN
    RAISE EXCEPTION 'Only managers can approve media for marketing';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_media_approval_changes
BEFORE UPDATE ON public.ops_job_media
FOR EACH ROW EXECUTE FUNCTION public.prevent_media_approval_changes();

CREATE INDEX idx_ops_jobs_status ON public.ops_jobs(status);
CREATE INDEX idx_ops_jobs_tech ON public.ops_jobs(assigned_technician_id);
CREATE INDEX idx_ops_job_media_job ON public.ops_job_media(job_id, phase);
CREATE INDEX idx_ops_job_checklist_job ON public.ops_job_checklist(job_id);
CREATE INDEX idx_ops_job_damage_job ON public.ops_job_damage(job_id);

-- 8. Auto-create a job for every booking
CREATE OR REPLACE FUNCTION public.create_ops_job_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ops_jobs (
    booking_id, assigned_technician_id, vehicle_year, vehicle_make,
    vehicle_model, license_plate, customer_concerns
  )
  VALUES (
    NEW.id, NEW.assigned_worker_id, NEW.vehicle_year, NEW.vehicle_make,
    NEW.vehicle_model, NULL, NEW.customer_notes
  )
  ON CONFLICT (booking_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_ops_job_for_booking failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_ops_job_for_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_ops_job_for_booking();

-- Keep technician assignment in sync when admins reassign a booking
CREATE OR REPLACE FUNCTION public.sync_ops_job_technician()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_worker_id IS DISTINCT FROM OLD.assigned_worker_id THEN
    UPDATE public.ops_jobs
    SET assigned_technician_id = NEW.assigned_worker_id
    WHERE booking_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_ops_job_technician
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_ops_job_technician();

-- 9. Backfill open bookings
INSERT INTO public.ops_jobs (
  booking_id, assigned_technician_id, vehicle_year, vehicle_make,
  vehicle_model, customer_concerns, status
)
SELECT b.id, b.assigned_worker_id, b.vehicle_year, b.vehicle_make,
       b.vehicle_model, b.customer_notes,
       CASE WHEN b.status = 'completed' THEN 'delivered' ELSE 'assigned' END
FROM public.bookings b
WHERE b.status NOT IN ('cancelled')
ON CONFLICT (booking_id) DO NOTHING;