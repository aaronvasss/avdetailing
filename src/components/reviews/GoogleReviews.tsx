import { useEffect, useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeferUntilVisible } from "@/components/common/DeferUntilVisible";
import { loadFeaturedReviews, type FeaturedGoogleReview } from "@/lib/featured-google-reviews";
import { FeaturedReviewCards } from "./FeaturedReviewCards";
import {
  GOOGLE_REVIEWS_URL,
  GOOGLE_REVIEWS_WIDGET_URL,
  GOOGLE_WRITE_REVIEW_URL,
} from "@/lib/google-business";

/**
 * The one shared Google review block used everywhere on the site.
 * Shows the live feed; never shows a hardcoded rating or review count.
 * If the live feed can't load, it falls back to a plain link to Google.
 */
function LiveFeed() {
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "failed" : s));
    }, 10000);
    return () => window.clearTimeout(t);
  }, []);

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Star className="h-8 w-8 fill-primary text-primary" />
        <p className="text-lg font-semibold">Read our verified reviews on Google</p>
        <Button asChild>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            Open Google Reviews <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <iframe
      className="lc_reviews_widget"
      src={GOOGLE_REVIEWS_WIDGET_URL}
      frameBorder="0"
      scrolling="no"
      loading="lazy"
      onLoad={() => setStatus("ok")}
      onError={() => setStatus("failed")}
      style={{ minWidth: "100%", width: "100%", minHeight: 420 }}
      title="AV Detailing Google Reviews"
    />
  );
}

export function GoogleReviews() {
  const [reviews, setReviews] = useState<FeaturedGoogleReview[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    loadFeaturedReviews(controller.signal).then(setReviews).catch(() => setReviews([]));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, []);
  return (
    <div className="max-w-6xl mx-auto" data-testid="google-reviews">
      {reviews === null ? <div className="min-h-[340px] grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Loading Google reviews">{[0,1,2].map(i => <div key={i} className="min-h-[340px] rounded-lg border border-border bg-background motion-safe:animate-pulse" />)}</div> : reviews.length === 3 ? <FeaturedReviewCards reviews={reviews} /> : <DeferUntilVisible minHeight={420}><LiveFeed /></DeferUntilVisible>}
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
