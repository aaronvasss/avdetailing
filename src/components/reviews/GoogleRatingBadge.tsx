import { GOOGLE_REVIEWS_URL } from "@/lib/google-business";
import { useLiveGoogleReviews, parseLiveGoogleReviews } from "@/lib/live-google-reviews";

export function GoogleRatingBadge() {
  const query = useLiveGoogleReviews();
  const data = parseLiveGoogleReviews(query.data);
  if (!data) return null;
  return (
    <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer"
      className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="text-primary" aria-hidden="true">★</span>
      <span>{data.rating.toFixed(1)} · {data.total_review_count.toLocaleString("en-US")} Google reviews</span>
    </a>
  );
}