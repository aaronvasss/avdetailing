import { Link } from "react-router-dom";
import { Car, Droplets, Ship, Caravan, Plane, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import rvDetailingImage from "@/assets/rv-detailing.jpg";
import carDetailingImage from "@/assets/car-detailing-service.jpg";
import ceramicCoatingImage from "@/assets/ceramic-coating-service.jpg";
import paintCorrectionImage from "@/assets/paint-correction-service.jpg";
import polisherIcon from "@/assets/icons/orbital-polisher-icon.png";

const services = [
  {
    icon: Car,
    title: "Mobile Car Detailing",
    heading: "Mobile Car Detailing",
    description: "Complete interior and exterior detailing for sedans, SUVs, and trucks.",
    href: "/car-detailing-baton-rouge",
    image: carDetailingImage,
    alt: "Mobile car detailing service in Baton Rouge Louisiana",
  },
  {
    icon: Droplets,
    title: "Ceramic Coating",
    heading: "Ceramic Coating & Paint Protection",
    description: "Long-lasting paint protection with professional-grade ceramic coating.",
    href: "/ceramic-coating-baton-rouge",
    image: ceramicCoatingImage,
    alt: "AV Detailing ceramic coating application on vehicle",
  },
  {
    icon: null,
    customIcon: polisherIcon,
    title: "Paint Correction",
    heading: "Paint Correction",
    description: "Remove swirls, scratches, and oxidation to restore your paint's clarity.",
    href: "/paint-correction-baton-rouge",
    image: paintCorrectionImage,
    alt: "Professional paint correction service removing swirls and scratches",
  },
  {
    icon: Ship,
    title: "Boat Detailing",
    heading: "Boat & Marine Detailing",
    description: "Marine-grade detailing to protect your vessel from the elements.",
    href: "/boat-detailing-baton-rouge",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=800&auto=format&fit=crop",
    alt: "Boat detailing service in Louisiana",
  },
  {
    icon: Caravan,
    title: "RV Detailing",
    heading: "RV Detailing",
    description: "Comprehensive detailing for motorhomes and travel trailers of all sizes.",
    href: "/rv-detailing-baton-rouge",
    image: rvDetailingImage,
    alt: "RV and motorhome detailing service in Louisiana",
  },
  {
    icon: Plane,
    title: "Aircraft Detailing",
    heading: "Aircraft Detailing",
    description: "Precision detailing for private aircraft with aviation-approved products.",
    href: "/aircraft-detailing-baton-rouge",
    image: "https://images.unsplash.com/photo-1474302770737-173ee21bab63?q=80&w=800&auto=format&fit=crop",
    alt: "Aircraft detailing service for private planes in Baton Rouge",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="section-padding bg-background">
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
                  alt={service.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  width={800}
                  height={600}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {service.customIcon ? (
                      <img 
                        src={service.customIcon} 
                        alt="" 
                        className="h-6 w-6 object-contain" 
                      />
                    ) : (
                      service.icon && <service.icon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{service.heading}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {service.description}
                </p>
                <div className="flex items-center text-primary text-sm font-medium">
                  View Packages
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
