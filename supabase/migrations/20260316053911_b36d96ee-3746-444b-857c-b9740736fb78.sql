
-- Create a separate table for quote internal notes (matching booking_internal_notes pattern)
CREATE TABLE public.quote_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_internal_notes ENABLE ROW LEVEL SECURITY;

-- Only staff can access quote internal notes
CREATE POLICY "Staff can manage quote internal notes"
ON public.quote_internal_notes
FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Migrate existing data from quotes.internal_notes to the new table
INSERT INTO public.quote_internal_notes (quote_id, note)
SELECT id, internal_notes FROM public.quotes WHERE internal_notes IS NOT NULL AND internal_notes != '';

-- Remove internal_notes column from quotes table
ALTER TABLE public.quotes DROP COLUMN internal_notes;
