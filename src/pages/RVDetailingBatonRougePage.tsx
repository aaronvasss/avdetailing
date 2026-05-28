import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Caravan,
  Sparkles,
  Sofa,
  Shield,
  CloudRain,
  Sun,
  Droplets,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/rv-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "RV Detailing",
  name: "RV Detailing in Baton Rouge, LA",
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

const SERVICE_AREAS = [
  "Baton Rouge",
  "Denham Springs",
  "Walker",
  "Gonzales",
  "Prairieville",
  "Central",
  "Highland Road",
  "Shenandoah",
];

const CLIMATE_THREATS = [
  { icon: Sun, label: "Intense UV", note: "Rapid gelcoat oxidation" },
  { icon: Droplets, label: "High Humidity", note: "Mold & black streaks" },
  { icon: CloudRain, label: "Heavy Rainfall", note: "Hard water staining" },
];

export default function RVDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="RV Detailing in Baton Rouge, LA"
        description="Mobile RV detailing in Baton Rouge — oxidation removal, ceramic coating & roof cleaning for Class A/B/C motorhomes, fifth wheels & travel trailers."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "RV Detailing in Baton Rouge, LA", path: PAGE_PATH },
        ]),
      ]} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            RV Detailing in Baton Rouge, LA
          </li>
        </ol>
      </nav>

      {/* HERO — editorial split with oversized "RV" mark */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-custom pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-6">
                <Caravan className="h-3.5 w-3.5" />
                Mobile RV Detailing · Baton Rouge, LA
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
                RV Detailing in{" "}
                <span className="text-primary">Baton Rouge</span>, LA
              </h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                We bring a complete RV detailing setup directly to your driveway, storage
                facility, or campsite — no hauling a Class A across town. Louisiana is one
                of the harshest climates in the country for RVs, and the{" "}
                <a
                  href="https://www.rvia.org/"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  RV Industry Association
                </a>{" "}
                recommends regular professional cleaning and surface protection to preserve
                structural integrity and resale value. AV Detailing serves Baton Rouge,
                Denham Springs, Walker, Gonzales, Prairieville, and all surrounding areas.
              </p>

              {/* CTAs + contact info */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
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
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <a
                  href="tel:+12255216264"
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  (225) 521-6264
                </a>
                <a
                  href="sms:+12252284796"
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <span className="text-primary">✉</span>
                  Text (225) 228-4796
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Baton Rouge, LA · Mon–Sun 6AM–8PM
                </span>
              </div>
            </div>

            {/* Climate threats panel */}
            <aside className="lg:col-span-5">
              <div className="relative rounded-2xl border border-border bg-card p-6 md:p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
                  Louisiana Climate Threats
                </div>
                <ul className="space-y-4">
                  {CLIMATE_THREATS.map((t) => {
                    const Icon = t.icon;
                    return (
                      <li key={t.label} className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{t.label}</div>
                          <div className="text-sm text-muted-foreground">{t.note}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* SERVICES — bento grid */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-12 md:mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
                Complete RV Care
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Five services. One mobile setup. Your driveway.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground md:max-w-xs">
              Class A, B & C motorhomes · Fifth wheels · Travel trailers · Toy haulers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
            {/* Featured: Mobile RV (large tile) */}
            <Link
              to="/mobile-rv-detailing-baton-rouge"
              className="group md:col-span-4 md:row-span-2 relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-background p-7 md:p-9 hover:border-primary/50 transition-colors"
            >
              <Caravan className="absolute -right-6 -bottom-6 h-48 w-48 text-primary/5 group-hover:text-primary/10 transition-colors" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Featured Service
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Mobile RV Detailing in Baton Rouge
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-xl mb-6">
                  We bring our complete RV detailing setup directly to wherever your RV is
                  parked — no hauling, no towing a large rig across Baton Rouge. We handle
                  Class A, B, and C motorhomes, fifth wheels, travel trailers, and toy
                  haulers on-site at your home, storage unit, or campground anywhere in the
                  Greater Baton Rouge area.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                  Mobile RV detailing service in Baton Rouge
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Oxidation Removal */}
            <BentoCard
              href="/rv-oxidation-removal-baton-rouge"
              icon={Sparkles}
              title="RV Oxidation Removal"
              linkLabel="RV oxidation removal service in Baton Rouge"
              colSpan="md:col-span-2"
            >
              Chalky, dull, faded fiberglass is the most damaging effect of Louisiana's UV.
              Our compounding and machine polishing reverses years of sun damage and
              restores your RV's original gelcoat.
            </BentoCard>

            {/* Interior Detailing */}
            <BentoCard
              href="/rv-interior-detailing-baton-rouge"
              icon={Sofa}
              title="RV Interior Detailing"
              linkLabel="RV interior detailing service in Baton Rouge"
              colSpan="md:col-span-2"
            >
              Deep vacuuming, kitchen & bath sanitization, carpet and upholstery shampoo,
              odor treatment, window cleaning, and full surface wipe-down throughout the
              cabin.
            </BentoCard>

            {/* Ceramic Coating */}
            <BentoCard
              href="/rv-ceramic-coating-baton-rouge"
              icon={Shield}
              title="RV Ceramic Coating"
              linkLabel="RV ceramic coating service in Baton Rouge"
              colSpan="md:col-span-3"
            >
              System X creates a hard hydrophobic layer that defends against UV, oxidation,
              water spots, black streaks, bird droppings, and road grime — and dramatically
              reduces cleaning time after every trip.
            </BentoCard>

            {/* Roof Cleaning */}
            <BentoCard
              href="/rv-roof-cleaning-baton-rouge"
              icon={CloudRain}
              title="RV Roof Cleaning"
              linkLabel="RV roof cleaning service in Baton Rouge"
              colSpan="md:col-span-3"
            >
              Roofs get ignored until they leak. In Louisiana's rainfall, mold and black
              streaks on EPDM, TPO, fiberglass, and aluminum roofs cause real structural
              damage. We clean them safely before issues turn expensive.
            </BentoCard>
          </div>
        </div>
      </section>

      {/* SERVICE AREAS — mile-marker ribbon */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              On the Road
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Where we service RVs across Greater Baton Rouge
            </h2>
            <p className="text-muted-foreground">
              Driveway, storage lot, or campground — if it's in the area, we'll roll up
              fully equipped.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
            {SERVICE_AREAS.map((area) => (
              <div
                key={area}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — minimal centered */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Book your RV detail today
          </h2>
          <p className="text-muted-foreground mb-8">
            Questions about your rig? Call us and we'll match the right service to your RV
            and your schedule.
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

function BentoCard({
  href,
  icon: Icon,
  title,
  linkLabel,
  colSpan,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  linkLabel: string;
  colSpan: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={href}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/50 transition-colors ${colSpan}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
        {title} in Baton Rouge
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-4">
        {children}
      </p>
      <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
        {linkLabel}
      </span>
    </Link>
  );
}
