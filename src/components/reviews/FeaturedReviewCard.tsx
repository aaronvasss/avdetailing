import { useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedGoogleReview } from "@/lib/featured-google-reviews";

export function FeaturedReviewCard({ review }: { review: FeaturedGoogleReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.text.length > 220;
  const date = new Date(`${review.review_date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  return (
    <article className="flex h-full min-h-[340px] flex-col rounded-lg border border-border bg-background p-6" aria-label={`Google review by ${review.reviewer_name}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary" aria-hidden="true">
          {review.reviewer_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-snug">{review.reviewer_name}</h3>
          <time dateTime={review.review_date} className="mt-1 block text-xs text-muted-foreground">{date}</time>
        </div>
        <span aria-label="Google" title="Google" className="shrink-0 text-xl font-bold text-foreground">G</span>
      </div>
      <div className="my-5 flex gap-1 text-primary" role="img" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < review.rating ? "fill-primary" : "text-muted-foreground"}`} />)}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
        {long && !expanded ? `${review.text.slice(0, 220)}…` : review.text}
      </p>
      {long && <Button variant="link" className="mt-1 h-8 self-start px-0 text-sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Read Less" : "Read More"}</Button>}
      <a href={review.source_url} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center gap-1.5 pt-6 text-xs font-medium text-muted-foreground hover:text-primary">
        View on Google <ExternalLink className="h-3 w-3" />
      </a>
    </article>
  );
}