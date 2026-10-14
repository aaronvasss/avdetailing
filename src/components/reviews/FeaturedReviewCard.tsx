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
        <svg role="img" aria-label="Google" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current text-foreground">
          <path d="M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92c-.26 1.28-1.02 2.36-2.15 3.08v2.56h3.48c2.03-1.87 3.31-4.63 3.31-7.51ZM12 23c2.97 0 5.46-.98 7.28-2.67l-3.48-2.7c-.98.66-2.24 1.06-3.8 1.06-2.86 0-5.3-1.93-6.17-4.53H2.24v2.79C4.05 20.54 7.74 23 12 23ZM5.83 14.16A6.6 6.6 0 0 1 5.48 12c0-.75.13-1.48.35-2.16V7.05H2.24A10.97 10.97 0 0 0 1 12c0 1.78.43 3.47 1.24 4.95l3.59-2.79ZM12 5.31c1.62 0 3.07.56 4.21 1.66l3.16-3.16A10.56 10.56 0 0 0 12 1C7.74 1 4.05 3.46 2.24 7.05l3.59 2.79C6.7 7.24 9.14 5.31 12 5.31Z" />
        </svg>
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