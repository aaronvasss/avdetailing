import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_REVIEWS_URL } from "@/lib/google-business";
import { GOOGLE_REVIEW_SUMMARY_KEY, parseGoogleReviewSummary } from "@/lib/google-review-summary";

export function GoogleRatingBadge() {
  const { data } = useQuery({
    queryKey: [GOOGLE_REVIEW_SUMMARY_KEY],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const result = await supabase.from("business_settings").select("value").eq("key", GOOGLE_REVIEW_SUMMARY_KEY).maybeSingle();
      if (result.error) throw result.error;
      return parseGoogleReviewSummary(result.data?.value);
    },
  });
  if (!data) return null;
  return (
    <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer"
      className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="text-primary" aria-hidden="true">★</span>
      <span>{data.rating.toFixed(1)} · {data.count.toLocaleString("en-US")} Google reviews</span>
    </a>
  );
}