import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { Skeleton } from "@/components/ui/skeleton";

// Fallback testimonials if API fails
const fallbackTestimonials = [
  {
    id: 1,
    name: "Michael Johnson",
    location: "Baton Rouge, LA",
    rating: 5,
    text: "AV Detailing transformed my 10-year-old truck into something that looks brand new. The paint correction was incredible - scratches I thought were permanent are completely gone!",
    vehicle: "2014 F-150",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Sarah Williams",
    location: "Prairieville, LA",
    rating: 5,
    text: "I've been a bi-weekly member for 6 months now and my Tesla has never looked better. The convenience of mobile service is unbeatable - they just show up and work their magic!",
    vehicle: "Tesla Model 3",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Robert Chen",
    location: "Gonzales, LA",
    rating: 5,
    text: "They detailed my 28ft boat and the results were phenomenal. The gel coat looks incredible and they even got the salt residue off areas I couldn't reach. Highly recommend!",
    vehicle: "2019 Sea Ray",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Jennifer Martinez",
    location: "Denham Springs, LA",
    rating: 5,
    text: "The ceramic coating on my Mercedes was worth every penny. 8 months later and water still beads off like day one. Plus, washing takes half the time now!",
    vehicle: "Mercedes E-Class",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
  },
];

export function TestimonialsSection() {
  const { data: googleData, isLoading, error } = useGoogleReviews();

  // Transform Google reviews to our format
  const testimonials = googleData?.reviews?.slice(0, 4).map((review, index) => ({
    id: index + 1,
    name: review.authorName,
    location: "Google Review",
    rating: review.rating,
    text: review.text,
    vehicle: review.relativeTime,
    image: review.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.authorName)}&background=ef4444&color=fff`,
  })) || fallbackTestimonials;

  const overallRating = googleData?.overallRating?.toFixed(1) || "5.0";
  const totalReviews = googleData?.totalReviews || 85;

  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            What Our Clients Say
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <span className="text-lg font-medium">{overallRating} out of 5</span>
                <span className="text-muted-foreground">• {totalReviews} Reviews</span>
              </>
            )}
          </div>
          {googleData && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm text-muted-foreground">Verified Google Reviews</span>
            </div>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="relative p-6 bg-background rounded-xl border border-border"
              >
                <div className="flex mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-4 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
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
            testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={cn(
                  "relative p-6 bg-background rounded-xl border border-border animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Quote Icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />

                {/* Rating */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground mb-6 leading-relaxed line-clamp-4">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=ef4444&color=fff`;
                    }}
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location} • {testimonial.vehicle}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a
            href="/reviews"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            Read More Reviews
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
