
-- Add unique constraint on quote_id for upsert support
ALTER TABLE public.quote_internal_notes ADD CONSTRAINT quote_internal_notes_quote_id_key UNIQUE (quote_id);
