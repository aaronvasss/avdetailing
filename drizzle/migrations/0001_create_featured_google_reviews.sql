CREATE FUNCTION public.valid_featured_google_reviews(items jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE item jsonb;
BEGIN
 IF jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) > 3 THEN RETURN false; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(items) LOOP
  IF jsonb_typeof(item) <> 'object' OR coalesce(length(item->>'reviewer_name'),0) NOT BETWEEN 1 AND 160 OR coalesce(length(item->>'text'),0) NOT BETWEEN 1 AND 10000 OR coalesce(item->>'rating','') !~ '^[1-5]$' OR coalesce(item->>'review_date','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(item->>'source_url','') !~ '^https://(www\.)?(google\.com/maps|maps\.google\.com/|g\.page/|maps\.app\.goo\.gl/)' THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END; $$;
CREATE TABLE public.featured_google_reviews (
 id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
 reviews jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (public.valid_featured_google_reviews(reviews)),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_google_reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.featured_google_reviews TO authenticated;
GRANT ALL ON public.featured_google_reviews TO service_role;
ALTER TABLE public.featured_google_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads complete review selections" ON public.featured_google_reviews FOR SELECT TO anon, authenticated USING (jsonb_array_length(reviews) = 3 OR public.is_admin());
CREATE POLICY "Admins insert review selections" ON public.featured_google_reviews FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update review selections" ON public.featured_google_reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());