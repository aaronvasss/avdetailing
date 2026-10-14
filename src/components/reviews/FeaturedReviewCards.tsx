import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedGoogleReview } from "@/lib/featured-google-reviews";
import { FeaturedReviewCard } from "./FeaturedReviewCard";

export function FeaturedReviewCards({ reviews }: { reviews: FeaturedGoogleReview[] }) {
  const [ref, api] = useEmblaCarousel({ align: "start", loop: false, breakpoints: { "(min-width: 768px)": { active: false } } });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const select = () => setSelected(api.selectedScrollSnap());
    select();
    api.on("select", select);
    return () => { api.off("select", select); };
  }, [api]);
  return (
    <div role="region" aria-label="Customer reviews" aria-roledescription="carousel">
      <div ref={ref} className="overflow-hidden">
        <div className="flex items-stretch gap-4 md:grid md:grid-cols-3">
          {reviews.map((review, i) => (
            <div key={`${review.reviewer_name}-${review.review_date}-${i}`} className="min-w-0 flex-[0_0_90%]" role="group" aria-label={`Review ${i + 1} of 3`}>
              <FeaturedReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 md:hidden">
        <Button variant="ghost" size="icon" title="Previous review" aria-label="Previous review" disabled={selected === 0} onClick={() => api?.scrollPrev()}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="flex gap-2">
          {reviews.map((_, i) => <Button key={i} variant="ghost" size="icon" className="h-8 w-8" title={`Go to review ${i + 1}`} aria-label={`Go to review ${i + 1}`} aria-current={selected === i ? "true" : undefined} onClick={() => api?.scrollTo(i)}><span className={`h-1.5 w-1.5 rounded-full ${selected === i ? "bg-primary" : "bg-muted-foreground/40"}`} /></Button>)}
        </div>
        <Button variant="ghost" size="icon" title="Next review" aria-label="Next review" disabled={selected === reviews.length - 1} onClick={() => api?.scrollNext()}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}