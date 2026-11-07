CREATE TABLE public.google_reviews_cache (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 rating numeric NOT NULL CHECK (rating BETWEEN 1 AND 5),
 total_review_count integer NOT NULL CHECK (total_review_count > 0),
 reviews jsonb NOT NULL,
 google_maps_uri text NOT NULL,
 fetched_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL
);
GRANT SELECT ON public.google_reviews_cache TO anon, authenticated;
GRANT ALL ON public.google_reviews_cache TO service_role;
ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read unexpired Google review snapshot" ON public.google_reviews_cache FOR SELECT TO anon, authenticated USING (expires_at > now());
CREATE TABLE public.google_reviews_refresh_state (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 attempted_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.google_reviews_refresh_state TO service_role;
ALTER TABLE public.google_reviews_refresh_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_google_reviews_refresh() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.google_reviews_refresh_state(id,attempted_at) VALUES(true,now())
 ON CONFLICT(id) DO UPDATE SET attempted_at=EXCLUDED.attempted_at
 WHERE google_reviews_refresh_state.attempted_at <= now() - interval '24 hours';
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_google_reviews_refresh() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_reviews_refresh() TO service_role;
CREATE OR REPLACE FUNCTION public.validate_google_review_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.fetched_at > now() + interval '1 minute' OR NEW.expires_at <= NEW.fetched_at OR NEW.expires_at > NEW.fetched_at + interval '24 hours' OR NEW.google_maps_uri <> 'https://www.google.com/maps?cid=7061043489708478604' OR jsonb_typeof(NEW.reviews) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.reviews) NOT BETWEEN 1 AND 5 THEN
  RAISE EXCEPTION 'Invalid Google review snapshot';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_google_review_snapshot BEFORE INSERT OR UPDATE ON public.google_reviews_cache FOR EACH ROW EXECUTE FUNCTION public.validate_google_review_snapshot();
COMMENT ON TABLE public.google_reviews_cache IS 'Limited temporary owner-authorized Google Business Profile snapshot for website display performance; no replies, media, private account fields or historical snapshots. Visible for 24 hours only.';