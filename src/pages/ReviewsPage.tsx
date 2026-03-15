import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, Quote, ArrowRight } from "lucide-react";

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
];

const ReviewsPage = () => {
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <Layout>
      <SEOHead
        title="Customer Reviews"
        description="Read 5-star reviews from AV Detailing customers in Baton Rouge, LA. See why we're the top-rated mobile auto detailing service."
        path="/reviews"
      />
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
              <span className="text-3xl font-bold">{averageRating}</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Based on 85 reviews from real customers
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {reviews.map((review) => (
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
                  />
                  <div>
                    <div className="font-semibold">{review.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {review.location} • {review.vehicle}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
