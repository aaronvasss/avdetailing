import { usePricing, type ServiceKey } from "@/lib/pricing";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Car,
  Droplets,
  Ship,
  Caravan,
  Plane,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { SERVICES_DIRECTORY_SEO, SERVICES_DIRECTORY_ITEMS } from "@/lib/services-directory-seo";
import { JsonLd, localBusinessSchema, itemListSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

type Service = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  service: ServiceKey;
  tag: string;
};

const ICONS: Record<ServiceKey, Service["icon"]> = { car: Car, ceramic: Droplets, paint: Sparkles, boat: Ship, rv: Caravan, aircraft: Plane };

// Shared with the initial-HTML fallback so crawler and rendered content match.
const services: Service[] = SERVICES_DIRECTORY_ITEMS.map((item) => ({ ...item, icon: ICONS[item.service] }));

const ServicesPage = () => {
  const pricing = usePricing();
  return (
    <Layout>
      <SEOHead
        title={SERVICES_DIRECTORY_SEO.title}
        description={SERVICES_DIRECTORY_SEO.description}
        path="/services"
      />
      <JsonLd
        data={itemListSchema(
          "AV Detailing Services",
          services.map((s) => ({ name: s.title, path: s.href, description: s.description }))
        )}
      />
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />

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
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Our Services · Baton Rouge, LA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-4xl">
            Mobile Detailing <span className="text-primary">Services</span> in Baton Rouge
          </h1>
          <p className="mt-6 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
            AV Detailing brings professional mobile detailing directly to your home, office,
            marina, or hangar throughout Greater Baton Rouge — Highland Road, Shenandoah,
            Gonzales, Prairieville, Denham Springs, Walker, Zachary, Central, and surrounding
            parishes within 30 miles. From quick maintenance washes to System X ceramic coating
            and aircraft detailing by quote, we cover everything you drive, ride, or fly.
          </p>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
            For private aircraft, explore our <Link to="/aircraft-detailing-baton-rouge" className="text-primary underline">aircraft and private jet detailing overview</Link> to discuss cabin cleaning, polishing or ceramic coating and coordinate your airport or hangar location.
          </p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  to={service.href}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {/* Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {service.tag}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-5">
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Title + description */}
                  <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed flex-1">
                    {service.description}
                  </p>

                  {/* Price footer */}
                  <div className="mt-6 pt-5 border-t border-border flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {pricing.startingAt(service.service) == null ? "Pricing" : "Starting at"}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-primary leading-none">
                          {pricing.label(pricing.startingAt(service.service), "By Quote")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary group-hover:underline">
                      View details
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Not sure which service you need?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contact us for a free consultation. We'll assess your vehicle and recommend the
            best service package for your needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/contact">
                Get a Free Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:2255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Explore more
            </p>
            <div className="flex justify-center gap-6">
              <Link to="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                View Our Gallery
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
