import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Anchor,
  Ship,
  Waves,
  Droplets,
  Sparkles,
  Shield,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { usePricing } from "@/lib/pricing";
import { BOAT_HUB_SEO, BOAT_PACKAGES, BOAT_INQUIRY_GUIDANCE } from "@/lib/boat-seo";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/boat-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Boat Detailing",
  name: "Boat Detailing in Baton Rouge, LA",
  provider: { "@id": `${SITE_URL}/#business` },
  areaServed: [
    { "@type": "City", name: "Baton Rouge", geo: { "@type": "GeoCoordinates", latitude: 30.4515, longitude: -91.1871 } },
    { "@type": "Place", name: "Highland Road", geo: { "@type": "GeoCoordinates", latitude: 30.3963, longitude: -91.1271 } },
    { "@type": "Place", name: "Shenandoah", geo: { "@type": "GeoCoordinates", latitude: 30.3542, longitude: -91.0351 } },
    { "@type": "City", name: "Gonzales", geo: { "@type": "GeoCoordinates", latitude: 30.2382, longitude: -90.9201 } },
    { "@type": "City", name: "Prairieville", geo: { "@type": "GeoCoordinates", latitude: 30.3057, longitude: -90.9784 } },
    { "@type": "City", name: "Walker", geo: { "@type": "GeoCoordinates", latitude: 30.4866, longitude: -90.8631 } },
    { "@type": "City", name: "Denham Springs", geo: { "@type": "GeoCoordinates", latitude: 30.4855, longitude: -90.9559 } },
    { "@type": "City", name: "Central", geo: { "@type": "GeoCoordinates", latitude: 30.5527, longitude: -91.0357 } },
  ],
  url: `${SITE_URL}${PAGE_PATH}`,
};

interface ServiceCardData {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  body: React.ReactNode;
  linkLabel: string;
}

const SERVICES: ServiceCardData[] = [
  { title: "Boat Ceramic Coating", href: "/boat-ceramic-coating-baton-rouge", icon: Shield, tagline: "Quoted after a finish assessment", linkLabel: "Boat ceramic coating in Baton Rouge",
    body: <>A protective layer for gelcoat or paint that can make routine cleaning easier. We review your finish first; oxidized gelcoat may need <Link to="/gelcoat-restoration-baton-rouge" className="text-primary underline">gelcoat restoration</Link> before coating. Boat Premium Detail includes a ceramic sealant.</> },
  { title: "Gelcoat Restoration", href: "/gelcoat-restoration-baton-rouge", icon: Sparkles, tagline: "For chalky, faded or oxidized finishes", linkLabel: "Gelcoat restoration assessment",
    body: <>We assess the finish and test an area before recommending Boat Full Detail (includes oxidation removal), Boat Premium Detail or a quoted restoration. Results depend on gelcoat condition.</> },
  { title: "Hull Cleaning", href: "/hull-cleaning-baton-rouge", icon: Droplets, tagline: "Waterline and hull staining, reviewed per request", linkLabel: "Boat hull cleaning assessment",
    body: <>Tell us the hull material, the staining you see and how the hull can be reached — on a trailer, on a lift, in a slip or afloat — and we will confirm what we can do.</> },
  { title: "Pontoon Cleaning", href: "/pontoon-cleaning-baton-rouge", icon: Waves, tagline: "Decks, vinyl seating and aluminum logs", linkLabel: "Pontoon boat cleaning and care",
    body: <>Match deck and vinyl cleaning to a boat package; aluminum log cleaning and heavier staining are quoted after we see the condition.</> },
  { title: "Mobile Boat Detailing", href: "/mobile-boat-detailing-baton-rouge", icon: Ship, tagline: "We come to where your boat is kept", linkLabel: "How mobile boat visits work",
    body: <>Appointments between 6 AM and 8 PM with a 30-minute arrival window, at locations that allow detailing work. See what to send before a visit.</> },
];

const SERVICE_AREAS = [
  "Baton Rouge",
  "Highland Road",
  "Shenandoah",
  "Gonzales",
  "Prairieville",
  "Walker",
  "Denham Springs",
  "Central",
];


export default function BoatDetailingBatonRougePage() {
  const pricing = usePricing();
  return (
    <Layout>
      <SEOHead
        title={BOAT_HUB_SEO.title}
        description={BOAT_HUB_SEO.description}
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Boat Detailing", path: PAGE_PATH },
        ]),
      ]} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">Boat Detailing</li>
        </ol>
      </nav>

      {/* HERO — horizon-band layout with overlapping stat strip */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-background" aria-hidden />
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          aria-hidden
        />
        <div className="container-custom relative pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-6">
            <Anchor className="h-3.5 w-3.5" />
            Marine Detailing · Baton Rouge, LA
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] max-w-4xl">
            {BOAT_HUB_SEO.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            {BOAT_HUB_SEO.intro}
          </p>

          {/* Packages */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 max-w-4xl">
            {BOAT_PACKAGES.map((p) => (
              <div key={p.name} className="bg-card px-5 py-5 md:px-6 md:py-6">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="mt-1 text-2xl font-bold text-primary leading-none">from {pricing.label(pricing.packageFrom("boat", p.name))}</div>
                <p className="mt-3 text-sm text-muted-foreground">{p.scope}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Typical time: {p.duration}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES — staggered numbered list with icon medallions */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-12 md:mb-16 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              Our Marine Services
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Boat services and assessments
            </h2>
          </div>

          <div className="space-y-5 md:space-y-6">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              const num = String(i + 1).padStart(2, "0");
              return (
                <article
                  key={svc.href}
                  className="group relative grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-primary/40 transition-colors"
                >
                  {/* Number + icon column */}
                  <div className="md:col-span-3 flex md:flex-col items-center md:items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-muted-foreground/60 leading-none">
                      {num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:col-span-9">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      <Link
                        to={svc.href}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {svc.title} in Baton Rouge
                      </Link>
                    </h3>
                    <p className="text-sm md:text-base text-primary/90 font-medium mb-4">
                      {svc.tagline}
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                      {svc.body}
                    </p>
                    <Link
                      to={svc.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                    >
                      {svc.linkLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVICE AREAS — compass-style panel */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
                Where We Run
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Mobile boat detailing across Greater Baton Rouge
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We work where your boat is kept when the location allows detailing. Call to
                confirm your address and any marina or storage rules.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_AREAS.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — minimal, centered, with rule line */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Book your boat detail today
          </h2>
          <p className="text-muted-foreground mb-8">
            Include: {BOAT_INQUIRY_GUIDANCE.join(" ")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">Book Online</Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:2255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
