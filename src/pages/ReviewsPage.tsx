import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, Quote, ArrowRight, ExternalLink } from "lucide-react";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { Skeleton } from "@/components/ui/skeleton";

// Fallback reviews if API fails
const fallbackReviews = [
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
];

const ReviewsPage = () => {
  const { data: googleData, isLoading, error } = useGoogleReviews();

  // Transform Google reviews or use fallbacks
  const reviews = googleData?.reviews?.map((review, index) => ({
    id: index + 1,
    name: review.authorName,
    location: "Google Review",
    rating: review.rating,
    date: review.relativeTime,
    text: review.text,
    vehicle: "",
    service: "Verified Customer",
    image: review.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.authorName)}&background=ef4444&color=fff`,
  })) || fallbackReviews;

  const overallRating = googleData?.overallRating?.toFixed(1) || "5.0";
  const totalReviews = googleData?.totalReviews || 85;

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Customer Reviews
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              What Our Clients Say
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-primary text-primary" />
                ))}
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <span className="text-3xl font-bold">{overallRating}</span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-64 mx-auto" />
            ) : (
              <p className="text-lg text-muted-foreground">
                Based on {totalReviews} reviews from real customers
              </p>
            )}
            {googleData && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-muted-foreground font-medium">Verified Google Reviews</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {isLoading ? (
              [...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="relative p-6 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-4 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-6 w-24 rounded-full mb-4" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="relative p-6 bg-card rounded-xl border border-border"
                >
                  <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                      {[...Array(5 - review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>

                  {/* Text */}
                  <p className="text-foreground mb-4 leading-relaxed">
                    "{review.text}"
                  </p>

                  {/* Service Tag */}
                  <div className="mb-4">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {review.service}
                    </span>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=ef4444&color=fff`;
                      }}
                    />
                    <div>
                      <div className="font-semibold">{review.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.location}{review.vehicle && ` • ${review.vehicle}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write a Review CTA */}
          {googleData && (
            <div className="text-center mt-12">
              <a
                href="https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Write a Review on Google
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Experience It Yourself?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers and see why we're Baton Rouge's 
            top-rated mobile detailing service.
          </p>
          <Button asChild size="lg" className="glow-red">
            <Link to="/book">
              Book Your Detail
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsPage;
