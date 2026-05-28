import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Star,
  ArrowRight,
  ExternalLink,
  Phone,
  Award,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";
import { ReviewsWidgetSection } from "@/components/home/ReviewsWidgetSection";

const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/place/AV+Detailing+LLC";

const TRUST_STATS = [
  { icon: Star, value: "5.0", label: "Average Rating" },
  { icon: ThumbsUp, value: "115+", label: "Google Reviews" },
  { icon: Award, value: "#1", label: "Rated in Baton Rouge" },
  { icon: CheckCircle2, value: "100%", label: "Recommend Us" },
];

const ReviewsPage = () => {
  const averageRating = "5.0";

  const reviewsJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "AV Detailing LLC",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: 115,
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <Layout>
      <SEOHead
        title="Customer Reviews & Testimonials | AV Detailing Baton Rouge"
        description="Read 115+ five-star Google reviews from AV Detailing customers in Baton Rouge, LA. See why we're the top-rated mobile auto, RV, boat & aircraft detailing service."
        path="/reviews"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="container-custom relative pt-12 pb-14 md:pt-16 md:pb-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-5">
            <Star className="h-3.5 w-3.5 fill-primary" />
            Verified Google Reviews · Baton Rouge, LA
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
                Customer Reviews <br />
                <span className="text-primary">Baton Rouge, LA</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                See what customers across Baton Rouge, Prairieville, Gonzales, Denham Springs and
                surrounding areas say about our mobile auto detailing, ceramic coating, paint
                correction, RV, boat, and aircraft services.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button asChild className="font-semibold tracking-wide">
                  <Link to="/book">
                    Book Your Detail
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-semibold tracking-wide">
                  <a href="tel:+12255216264">
                    <Phone className="mr-2 h-4 w-4" />
                    (225) 521-6264
                  </a>
                </Button>
              </div>
            </div>

            {/* Rating panel */}
            <aside className="lg:col-span-4">
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-7 w-7 fill-primary text-primary" />
                  ))}
                </div>
                <div className="text-5xl font-bold text-foreground leading-none mb-2">
                  {averageRating}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Based on 115+ verified Google reviews
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Google Business
                </div>
              </div>
            </aside>
          </div>

          {/* Trust stats strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border bg-border/60">
            {TRUST_STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-card px-5 py-5 md:px-6 md:py-6 text-center">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-foreground leading-none">
                    {s.value}
                  </div>
                  <div className="mt-2 text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE GOOGLE REVIEWS WIDGET */}
      <ReviewsWidgetSection />

      {/* GOOGLE BANNER */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-4xl">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-10 text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              115+ Five-Star Reviews on Google
            </h2>
            <p className="text-muted-foreground mb-7 max-w-2xl mx-auto">
              AV Detailing is Baton Rouge's top-rated mobile detailing service. Don't just
              take our word for it — see what your neighbors are saying.
            </p>
            <Button asChild className="font-semibold tracking-wide">
              <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                Read All Reviews on Google
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to experience it yourself?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers and see why we're Baton Rouge's top-rated
            mobile detailing service.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">
                Book Your Detail
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:+12255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsPage;
