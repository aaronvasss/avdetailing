import { Link } from "react-router-dom";
import { Car, Droplets, Sparkles, Ship, Caravan, Plane, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import rvDetailingImage from "@/assets/rv-detailing.jpg";

const services = [
  {
    icon: Car,
    title: "Car Detailing",
    description: "Complete interior and exterior detailing for sedans, SUVs, and trucks.",
    href: "/services/car-detailing",
    // Professional car wash with foam and detailing in progress
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Droplets,
    title: "Ceramic Coating",
    description: "Long-lasting paint protection with professional-grade ceramic coating.",
    href: "/services/ceramic-coating",
    // High-gloss finish on car paint showing ceramic coating result
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Sparkles,
    title: "Paint Correction",
    description: "Remove swirls, scratches, and oxidation to restore your paint's clarity.",
    href: "/services/paint-correction",
    // Professional polishing car paint with machine buffer
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Ship,
    title: "Boat Detailing",
    description: "Marine-grade detailing to protect your vessel from the elements.",
    href: "/services/boat-detailing",
    // Speedboat on water - clean hull and deck visible
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Caravan,
    title: "RV Detailing",
    description: "Comprehensive detailing for motorhomes and travel trailers of all sizes.",
    href: "/services/rv-detailing",
    // User's custom RV photo - Tiffin motorhome
    image: rvDetailingImage,
  },
  {
    icon: Plane,
    title: "Aircraft Detailing",
    description: "Precision detailing for private aircraft with aviation-approved products.",
    href: "/services/aircraft-detailing",
    // Private jet on ground - aircraft detailing context
    image: "https://images.unsplash.com/photo-1474302770737-173ee21bab63?q=80&w=800&auto=format&fit=crop",
  },
];

export function ServicesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Premium Detailing for Every Vehicle
          </h2>
          <p className="text-lg text-muted-foreground">
            From daily drivers to luxury aircraft, we deliver showroom-quality results 
            with professional-grade products and techniques.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.title}
              to={service.href}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-card border border-border card-hover",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <service.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {service.description}
                </p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View All Services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
