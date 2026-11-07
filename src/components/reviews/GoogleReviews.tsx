import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveGoogleReviews, parseLiveGoogleReviews } from "@/lib/live-google-reviews";
import { FeaturedReviewCards } from "./FeaturedReviewCards";
import {
  GOOGLE_REVIEWS_URL,
  GOOGLE_WRITE_REVIEW_URL,
} from "@/lib/google-business";

export function GoogleReviews() {
  const query = useLiveGoogleReviews();
  const data = parseLiveGoogleReviews(query.data);
  if (!data) return null;
  const ratings: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  const reviews = data.reviews.map(r => ({ reviewer_name: r.reviewer.displayName, rating: ratings[r.starRating], review_date: r.createTime.slice(0, 10), text: r.comment ?? "", source_url: data.google_maps_uri }));
  return (
    <div className="max-w-6xl mx-auto" data-testid="google-reviews">
      <div className="text-center mb-8"><h2 className="text-3xl font-bold mb-3">Google Reviews</h2><p className="text-lg"><span aria-hidden="true" className="text-primary">{"★".repeat(Math.round(data.rating))}{"☆".repeat(5 - Math.round(data.rating))}</span> {data.rating.toFixed(1)} out of 5 · {data.total_review_count.toLocaleString("en-US")} reviews</p><p className="mt-2 text-sm text-muted-foreground">Most recent reviews · Google Business Profile</p></div>
      <FeaturedReviewCards reviews={reviews} />
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline" className="font-semibold">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            Read All Reviews on Google <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button asChild className="font-semibold">
          <a href={GOOGLE_WRITE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            Leave Us a Google Review
          </a>
        </Button>
      </div>
    </div>
  );
}
