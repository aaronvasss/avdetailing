
-- Re-add internal_notes to quotes (admin-only writes, user can see own quotes but can't modify)
-- This is acceptable since only staff/admin can UPDATE quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS internal_notes text;
