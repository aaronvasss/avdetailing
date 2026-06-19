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
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/boat-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Boat Detailing",
  name: "Boat Detailing in Baton Rouge, LA",
  provider: {
    "@type": "LocalBusiness",
    name: "AV Detailing",
    telephone: "+12255216264",
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Baton Rouge",
      addressRegion: "LA",
      addressCountry: "US",
    },
  },
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
  {
    title: "Mobile Boat Detailing",
    href: "/mobile-boat-detailing-baton-rouge",
    icon: Ship,
    tagline: "We come to your marina, slip, or driveway",
    linkLabel: "Mobile boat detailing in Baton Rouge",
    body: (
      <>
        Fully equipped on-site service for every vessel type — fishing and bass boats, ski
        boats, pontoons, cruisers, and yachts. No trailering, no hassle. We work at your
        marina, storage facility, or home anywhere in the Baton Rouge area.
      </>
    ),
  },
  {
    title: "Boat Ceramic Coating",
    href: "/boat-ceramic-coating-baton-rouge",
    icon: Shield,
    tagline: "System X marine — long-term gelcoat protection",
    linkLabel: "Boat ceramic coating service in Baton Rouge",
    body: (
      <>
        A durable hydrophobic layer over your gelcoat and paint that resists UV burn,
        oxidation, water spotting, and algae — the four biggest threats on Louisiana waters.
        Cuts post-trip cleanup dramatically and preserves long-term resale value.
      </>
    ),
  },
  {
    title: "Gelcoat Restoration",
    href: "/gelcoat-restoration-baton-rouge",
    icon: Sparkles,
    tagline: "Bring back factory gloss on faded, chalky finishes",
    linkLabel: "Gelcoat restoration service in Baton Rouge",
    body: (
      <>
        Louisiana sun and humidity oxidize gelcoat fast. Professional compounding, machine
        polishing, and sealing restore original depth and color. Our most-requested service
        on boats five years and older.
      </>
    ),
  },
  {
    title: "Hull Cleaning",
    href: "/hull-cleaning-baton-rouge",
    icon: Droplets,
    tagline: "Waterline scum, algae, and hard-water deposits — gone",
    linkLabel: "Hull cleaning service in Baton Rouge",
    body: (
      <>
        Buildup from the Mississippi, False River, Blind River, and surrounding lakes stains
        permanently if ignored. We safely strip contamination from fiberglass, aluminum, and
        painted hulls without damaging the finish.
      </>
    ),
  },
  {
    title: "Pontoon Cleaning",
    href: "/pontoon-cleaning-baton-rouge",
    icon: Waves,
    tagline: "Aluminum logs, deck, vinyl seats & bimini",
    linkLabel: "Pontoon cleaning service in Baton Rouge",
    body: (
      <>
        Pontoon logs collect oxidation and stains a garden hose can't touch. We polish
        aluminum logs, deep-clean decks, restore vinyl seating, and treat bimini tops so
        your pontoon looks sharp all season.
      </>
    ),
  },
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

const STATS = [
  { value: "5", label: "Boat services offered" },
  { value: "On-site", label: "Marina & driveway service" },
  { value: "System X", label: "Marine ceramic certified" },
];

export default function BoatDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="Boat Detailing in Baton Rouge, LA"
        description="Mobile boat detailing in Baton Rouge — ceramic coating, gelcoat restoration, hull cleaning & pontoon detailing at your marina or driveway."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Boat Detailing in Baton Rouge, LA", path: PAGE_PATH },
        ]),
      ]} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            Boat Detailing in Baton Rouge, LA
          </li>
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
            Boat Detailing in <span className="text-primary">Baton Rouge</span>, LA
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Louisiana has more boats per capita than almost any state, and the Mississippi,
            False River, Blind River, and our local lakes punish every vessel with UV,
            algae, and hard water. AV Detailing protects your boat where it lives — fully
            mobile to your marina, launch, storage facility, or driveway. The{" "}
            <a
              href="https://www.wlf.louisiana.gov/page/boating"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Louisiana Department of Wildlife and Fisheries
            </a>{" "}
            encourages every owner to keep their vessel properly maintained for safety and
            longevity on the water.
          </p>

          {/* Stat strip */}
          <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 max-w-2xl">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card px-4 py-5 md:px-6 md:py-6">
                <div className="text-xl md:text-2xl font-bold text-primary leading-none">{s.value}</div>
                <div className="mt-2 text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
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
              Built for Louisiana water, sun, and humidity
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
                Service across the Baton Rouge waterways
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We meet your boat at the marina, the launch, the storage yard, or your
                driveway. If you're on the water in the greater Baton Rouge area, we cover
                you.
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
            Have questions about your vessel? Call us and we'll walk through the right
            service for your boat and your water.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">Book Online</Link>
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
}
