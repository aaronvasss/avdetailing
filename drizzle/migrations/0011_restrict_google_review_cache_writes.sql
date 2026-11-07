REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.google_reviews_cache FROM anon, authenticated;
REVOKE ALL ON public.google_reviews_refresh_state FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_google_review_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_google_review_snapshot() TO service_role;