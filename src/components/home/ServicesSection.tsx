import { Link } from "react-router-dom";
import { Car, Droplets, Ship, Caravan, Plane, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import carAvif400 from "@/assets/optimized/car-detailing-service-400.avif";
import carAvif800 from "@/assets/optimized/car-detailing-service-800.avif";
import carAvif1200 from "@/assets/optimized/car-detailing-service-1200.avif";
import carWebp400 from "@/assets/optimized/car-detailing-service-400.webp";
import carWebp800 from "@/assets/optimized/car-detailing-service-800.webp";
import carWebp1200 from "@/assets/optimized/car-detailing-service-1200.webp";
import paintAvif400 from "@/assets/optimized/paint-correction-service-400.avif";
import paintAvif800 from "@/assets/optimized/paint-correction-service-800.avif";
import paintAvif1200 from "@/assets/optimized/paint-correction-service-1200.avif";
import paintWebp400 from "@/assets/optimized/paint-correction-service-400.webp";
import paintWebp800 from "@/assets/optimized/paint-correction-service-800.webp";
import paintWebp1200 from "@/assets/optimized/paint-correction-service-1200.webp";
import rvAvif400 from "@/assets/optimized/rv-detailing-400.avif";
import rvAvif800 from "@/assets/optimized/rv-detailing-800.avif";
import rvWebp400 from "@/assets/optimized/rv-detailing-400.webp";
import rvWebp800 from "@/assets/optimized/rv-detailing-800.webp";
import ceramicAvif400 from "@/assets/optimized/ceramic-coating-service-400.avif";
import ceramicAvif800 from "@/assets/optimized/ceramic-coating-service-800.avif";
import ceramicWebp400 from "@/assets/optimized/ceramic-coating-service-400.webp";
import ceramicWebp800 from "@/assets/optimized/ceramic-coating-service-800.webp";

const srcSet = (entries: [string, number][]) =>
  entries.map(([url, w]) => `${url} ${w}w`).join(", ");

const carDetailingImage = carWebp800;
const carDetailingSources = {
  avif: srcSet([[carAvif400, 400], [carAvif800, 800], [carAvif1200, 1200]]),
  webp: srcSet([[carWebp400, 400], [carWebp800, 800], [carWebp1200, 1200]]),
};
const paintCorrectionImage = paintWebp800;
const paintCorrectionSources = {
  avif: srcSet([[paintAvif400, 400], [paintAvif800, 800], [paintAvif1200, 1200]]),
  webp: srcSet([[paintWebp400, 400], [paintWebp800, 800], [paintWebp1200, 1200]]),
};
const rvDetailingImage = rvWebp800;
const rvDetailingSources = {
  avif: srcSet([[rvAvif400, 400], [rvAvif800, 800]]),
  webp: srcSet([[rvWebp400, 400], [rvWebp800, 800]]),
};
const ceramicCoatingImage = ceramicWebp800;
const ceramicCoatingSources = {
  avif: srcSet([[ceramicAvif400, 400], [ceramicAvif800, 800]]),
  webp: srcSet([[ceramicWebp400, 400], [ceramicWebp800, 800]]),
};
import polisherIcon from "@/assets/icons/orbital-polisher-icon.png";

const services = [
  {
    icon: Car,
    title: "Mobile Car Detailing",
    heading: "Mobile Car Detailing",
    description: "Complete interior and exterior detailing for sedans, SUVs, and trucks.",
    href: "/car-detailing-baton-rouge",
    image: carDetailingImage,
    sources: carDetailingSources,
    alt: "Mobile car detailing service in Baton Rouge Louisiana",
  },
  {
    icon: Droplets,
    title: "Ceramic Coating",
    heading: "Ceramic Coating & Paint Protection",
    description: "Long-lasting paint protection with professional-grade ceramic coating.",
    href: "/ceramic-coating-baton-rouge",
    image: ceramicCoatingImage,
    sources: ceramicCoatingSources,
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
    sources: paintCorrectionSources,
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
    sources: rvDetailingSources,
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

const IMAGE_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

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
                <picture>
                  {service.sources?.avif && (
                    <source type="image/avif" srcSet={service.sources.avif} sizes={IMAGE_SIZES} />
                  )}
                  {service.sources?.webp && (
                    <source type="image/webp" srcSet={service.sources.webp} sizes={IMAGE_SIZES} />
                  )}
                  <img
                    src={service.image}
                    alt={service.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    sizes={IMAGE_SIZES}
                    width={800}
                    height={600}
                  />
                </picture>
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
