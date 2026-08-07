CREATE TABLE public.app_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'frontend',
  severity text NOT NULL DEFAULT 'error',
  code text,
  message text NOT NULL,
  function_name text,
  route text,
  url text,
  user_agent text,
  user_id uuid,
  booking_id uuid,
  error_id text,
  stack text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  CONSTRAINT app_error_logs_source_check CHECK (source IN ('frontend','edge','backend')),
  CONSTRAINT app_error_logs_severity_check CHECK (severity IN ('info','warning','error','fatal'))
);

CREATE INDEX idx_app_error_logs_occurred_at ON public.app_error_logs (occurred_at DESC);
CREATE INDEX idx_app_error_logs_source ON public.app_error_logs (source);
CREATE INDEX idx_app_error_logs_code ON public.app_error_logs (code);

GRANT INSERT ON public.app_error_logs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_error_logs TO authenticated;
GRANT ALL ON public.app_error_logs TO service_role;

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can report an error"
ON public.app_error_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Staff can view error logs"
ON public.app_error_logs FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "Admins can update error logs"
ON public.app_error_logs FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());