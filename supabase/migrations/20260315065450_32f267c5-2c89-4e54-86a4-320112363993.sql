
-- Create blocked_dates table for holidays/vacations
CREATE TABLE public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on date
ALTER TABLE public.blocked_dates ADD CONSTRAINT blocked_dates_date_unique UNIQUE (blocked_date);

-- Enable RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked dates (needed for booking calendar)
CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT
  TO public
  USING (true);

-- Only admins can manage blocked dates
CREATE POLICY "Admins can manage blocked dates"
  ON public.blocked_dates FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
