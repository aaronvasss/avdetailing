import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
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
            <span className="text-lg font-medium">5.0 out of 5</span>
            <span className="text-muted-foreground">• 85 Reviews</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
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
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.location} • {testimonial.vehicle}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
