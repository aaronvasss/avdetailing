import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Star,
  Quote,
  ArrowRight,
  ExternalLink,
  Phone,
  Award,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";
import { ReviewsWidgetSection } from "@/components/home/ReviewsWidgetSection";

const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/place/AV+Detailing+LLC";

const reviews = [
  {
    id: 1,
    name: "Michael Johnson",
    location: "Baton Rouge, LA",
    rating: 5,
    date: "2 weeks ago",
    text: "AV Detailing transformed my 10-year-old truck into something that looks brand new. The paint correction was incredible - scratches I thought were permanent are completely gone! The team was professional, on time, and the results speak for themselves.",
    vehicle: "2014 Ford F-150",
    service: "Signature Detail",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
  },
  {
    id: 2,
    name: "Sarah Williams",
    location: "Prairieville, LA",
    rating: 5,
    date: "1 month ago",
    text: "I've been a bi-weekly member for 6 months now and my Tesla has never looked better. The convenience of mobile service is unbeatable - they just show up and work their magic while I'm working from home!",
    vehicle: "Tesla Model 3",
    service: "Bi-Weekly Membership",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
  },
  {
    id: 3,
    name: "Robert Chen",
    location: "Gonzales, LA",
    rating: 5,
    date: "3 weeks ago",
    text: "They detailed my 28ft boat and the results were phenomenal. The gel coat looks incredible and they even got the salt residue off areas I couldn't reach. Highly recommend for any boat owner!",
    vehicle: "2019 Sea Ray 280",
    service: "Full Marine Detail",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150",
  },
  {
    id: 4,
    name: "Jennifer Martinez",
    location: "Denham Springs, LA",
    rating: 5,
    date: "2 months ago",
    text: "The ceramic coating on my Mercedes was worth every penny. 8 months later and water still beads off like day one. Plus, washing takes half the time now! Best investment I've made for my car.",
    vehicle: "Mercedes E-Class",
    service: "Ceramic Pro",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150",
  },
  {
    id: 5,
    name: "David Thompson",
    location: "Central, LA",
    rating: 5,
    date: "1 week ago",
    text: "Had my RV detailed before a cross-country trip. The oxidation removal was amazing - our 2018 motorhome looks like we just drove it off the lot. Very thorough, cleaned every nook and cranny.",
    vehicle: "2018 Winnebago",
    service: "RV Full Detail",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150",
  },
  {
    id: 6,
    name: "Amanda Foster",
    location: "Zachary, LA",
    rating: 5,
    date: "3 weeks ago",
    text: "Exceptional service! They came to my office and detailed my car while I was in meetings. Came out to a sparkling clean vehicle. The interior smelled amazing. Will definitely be a repeat customer.",
    vehicle: "2021 BMW X5",
    service: "Full Detail",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150",
  },
  {
    id: 7,
    name: "James Mitchell",
    location: "Baton Rouge, LA",
    rating: 5,
    date: "1 month ago",
    text: "As a pilot, I'm particular about who touches my aircraft. AV Detailing exceeded my expectations. They used proper aviation products and the attention to detail was outstanding. My Cessna looks better than when I bought it.",
    vehicle: "Cessna 182",
    service: "Aircraft Complete Detail",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150",
  },
  {
    id: 8,
    name: "Lisa Rodriguez",
    location: "Prairieville, LA",
    rating: 5,
    date: "2 weeks ago",
    text: "The paint correction service was incredible. My black car had tons of swirl marks from years of automatic car washes. Now it looks like a mirror! Worth every penny for the 2-step correction.",
    vehicle: "2020 Audi A4",
    service: "2-Step Paint Correction",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
  },
  {
    id: 9,
    name: "Carlos Reyes",
    location: "Baton Rouge, LA",
    rating: 5,
    date: "3 days ago",
    text: "Booked the Gold package for my truck and it looks absolutely insane. The paint sealant makes it look like it just rolled off the lot. Aaron was on time, professional, and the attention to detail was next level. 100% worth it.",
    vehicle: "2023 Dodge Ram 1500",
    service: "Gold Package",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150",
  },
  {
    id: 10,
    name: "Brittany Tran",
    location: "Gonzales, LA",
    rating: 5,
    date: "1 week ago",
    text: "Second time using AV Detailing and they never disappoint. Booked online in minutes, they showed up right on time, and my CR-V looks brand new inside and out. The interior detailing was so thorough — even got into all the little crevices.",
    vehicle: "2021 Honda CR-V",
    service: "Silver Package",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150",
  },
  {
    id: 11,
    name: "Marcus Williams",
    location: "Prairieville, LA",
    rating: 5,
    date: "2 weeks ago",
    text: "We have 3 dogs and my Suburban was a disaster inside. These guys removed every single hair and the ozone treatment killed all the pet smell. My wife couldn't believe it was the same car. Phenomenal work.",
    vehicle: "2020 Chevy Suburban",
    service: "Gold Package + Pet Hair Removal",
    image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=150",
  },
  {
    id: 12,
    name: "Ashley Nguyen",
    location: "Baton Rouge, LA",
    rating: 5,
    date: "5 days ago",
    text: "Perfect experience from start to finish. Booking was easy, they texted me when they were on the way, and my Tesla looked incredible after. No water spots, no streaks — just a perfect finish. Will be a regular customer for sure.",
    vehicle: "2022 Tesla Model Y",
    service: "Silver Package",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150",
  },
  {
    id: 13,
    name: "Tyler Fontenot",
    location: "Zachary, LA",
    rating: 5,
    date: "3 weeks ago",
    text: "Started with the Basic package just to try them out. The quality blew me away for the price. Already upgraded to Silver for my next appointment. These guys take their work seriously and it shows.",
    vehicle: "2019 Ford Expedition",
    service: "Basic Package",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=150",
  },
  {
    id: 14,
    name: "Monique Jackson",
    location: "Baker, LA",
    rating: 5,
    date: "1 month ago",
    text: "The clay bar treatment combined with the Gold package is absolutely worth it. You can feel how smooth the paint is now — completely different from before. My Telluride has never looked this good.",
    vehicle: "2021 Kia Telluride",
    service: "Gold Package + Clay Bar",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=150",
  },
  {
    id: 15,
    name: "Derek Landry",
    location: "Denham Springs, LA",
    rating: 5,
    date: "2 months ago",
    text: "Had the ceramic coating done and 4 months later it still looks incredible. Rain just slides right off. The team was extremely knowledgeable about the process and took their time doing it right. Best money I've spent on my car.",
    vehicle: "2018 Mercedes GLE",
    service: "Ceramic Coating",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=150",
  },
  {
    id: 16,
    name: "Kayla Boudreaux",
    location: "Baton Rouge, LA",
    rating: 5,
    date: "2 weeks ago",
    text: "Bought a used Jeep that smelled like smoke. The ozone treatment completely eliminated it — zero smoke smell after. Combined with the Silver detail the interior looks and smells like a brand new car. Highly recommend!",
    vehicle: "2022 Jeep Grand Cherokee",
    service: "Silver Package + Odor Elimination",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=150",
  },
];

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

      {/* FEATURED CUSTOMER STORIES */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              Featured Customer Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Real results from real Baton Rouge customers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <Quote className="absolute top-5 right-5 h-7 w-7 text-primary/15" />

                {/* Rating row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>

                {/* Text */}
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed mb-5 flex-1">
                  "{review.text}"
                </p>

                {/* Service tag */}
                <div className="mb-4">
                  <span className="inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    {review.service}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{review.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {review.location} · {review.vehicle}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              110+ Five-Star Reviews on Google
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
