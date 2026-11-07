ALTER TABLE public.google_reviews_refresh_state ADD COLUMN lease_token uuid, ADD COLUMN lease_until timestamptz;
CREATE OR REPLACE FUNCTION public.claim_google_reviews_refresh_lease(force_refresh boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE token uuid := gen_random_uuid(); claimed uuid;
BEGIN
 INSERT INTO public.google_reviews_refresh_state(id,attempted_at,lease_token,lease_until) VALUES(true,now(),token,now()+interval '10 minutes')
 ON CONFLICT(id) DO UPDATE SET attempted_at=EXCLUDED.attempted_at,lease_token=EXCLUDED.lease_token,lease_until=EXCLUDED.lease_until
 WHERE (google_reviews_refresh_state.lease_until IS NULL OR google_reviews_refresh_state.lease_until <= now()) AND (force_refresh OR google_reviews_refresh_state.attempted_at <= now()-interval '1 hour')
 RETURNING lease_token INTO claimed;
 RETURN claimed;
END $$;
CREATE OR REPLACE FUNCTION public.finish_google_reviews_refresh(claim_token uuid,snapshot jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM public.google_reviews_refresh_state WHERE id=true AND lease_token=claim_token AND lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.google_reviews_cache(id,rating,total_review_count,reviews,google_maps_uri,fetched_at,expires_at)
 VALUES(true,(snapshot->>'rating')::numeric,(snapshot->>'total_review_count')::integer,snapshot->'reviews',snapshot->>'google_maps_uri',(snapshot->>'fetched_at')::timestamptz,(snapshot->>'expires_at')::timestamptz)
 ON CONFLICT(id) DO UPDATE SET rating=EXCLUDED.rating,total_review_count=EXCLUDED.total_review_count,reviews=EXCLUDED.reviews,google_maps_uri=EXCLUDED.google_maps_uri,fetched_at=EXCLUDED.fetched_at,expires_at=EXCLUDED.expires_at;
 UPDATE public.google_reviews_refresh_state SET lease_token=NULL,lease_until=NULL WHERE id=true AND lease_token=claim_token;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.release_google_reviews_refresh(claim_token uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE public.google_reviews_refresh_state SET lease_token=NULL,lease_until=NULL WHERE id=true AND lease_token=claim_token; $$;
CREATE OR REPLACE FUNCTION public.claim_google_reviews_refresh() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN false; END $$;
REVOKE ALL ON FUNCTION public.claim_google_reviews_refresh_lease(boolean),public.finish_google_reviews_refresh(uuid,jsonb),public.release_google_reviews_refresh(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_reviews_refresh_lease(boolean),public.finish_google_reviews_refresh(uuid,jsonb),public.release_google_reviews_refresh(uuid) TO service_role;
COMMENT ON TABLE public.google_reviews_cache IS 'Owner-authorized temporary Google Business Profile snapshot. Hourly refresh; stale display allowed only within existing 24-hour retention. Daily expiration cleanup retained.';