import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  SprayCan,
  Armchair,
  CheckCircle2,
  MapPin,
  ArrowUpRight,
  Mail,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/aircraft-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Aircraft Detailing",
  name: "Aircraft Detailing Serving Baton Rouge, Lafayette & New Orleans Airports",
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

const AIRPORTS = [
  { code: "BTR", name: "Baton Rouge Metropolitan Airport", city: "Baton Rouge, LA" },
  { code: "LFT", name: "Lafayette Regional Airport", city: "Lafayette, LA" },
  { code: "MSY", name: "Louis Armstrong New Orleans Intl.", city: "Kenner, LA" },
  { code: "NEW", name: "New Orleans Lakefront Airport", city: "New Orleans, LA" },
];

const FLEET_TYPES = [
  "Single-Engine Piston",
  "Twin-Engine Piston",
  "Turboprops",
  "Light & Mid-Size Jets",
  "Helicopters & Rotorcraft",
  "Charter & Corporate",
];

const SERVICES = [
  {
    code: "SVC-01",
    title: "Aircraft Exterior Cleaning",
    href: "/aircraft-cleaning-baton-rouge",
    icon: SprayCan,
    summary: "Aviation-approved cleaning for painted aluminum, composites & plexiglass.",
    body: (
      <>
        Regular exterior cleaning removes exhaust residue, bug deposits, bird droppings, salt
        deposits, and environmental contamination that damage your aircraft's finish and can
        accelerate corrosion. We use only aviation-approved cleaning solutions safe for
        painted aluminum, composite panels, and plexiglass. Book our{" "}
        <Link to="/aircraft-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
          aircraft exterior cleaning service
        </Link>{" "}
        at BTR, LFT, MSY, NEW, or any South Louisiana general aviation airport.
      </>
    ),
    linkLabel: "Aircraft exterior cleaning service",
  },
  {
    code: "SVC-02",
    title: "Aircraft Interior Detailing",
    href: "/aircraft-interior-detailing-baton-rouge",
    icon: Armchair,
    summary: "Cabin-grade interior care formulated for aviation surfaces.",
    body: (
      <>
        Your aircraft cabin reflects your standards as a pilot or operator. AV Detailing's
        interior service covers seat cleaning and conditioning, carpet vacuuming and
        shampooing, instrument shroud and panel wipe-down, window and door seal cleaning, and
        odor elimination — all performed with products specifically formulated and safe for
        aviation interiors. Schedule our{" "}
        <Link to="/aircraft-interior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
          aircraft interior detailing service
        </Link>{" "}
        at your home airport.
      </>
    ),
    linkLabel: "Aircraft interior detailing service",
  },
  {
    code: "SVC-03",
    title: "Aircraft Paint Protection",
    href: "/aircraft-paint-protection-baton-rouge",
    icon: ShieldCheck,
    summary: "Aviation sealants & coatings against UV, salt air, and humidity.",
    body: (
      <>
        South Louisiana's UV, humidity, and coastal salt air degrade aircraft paint and
        aluminum surfaces faster than most regions in the country. Our{" "}
        <Link to="/aircraft-paint-protection-baton-rouge" className="text-primary underline hover:text-primary/80">
          aircraft paint protection service
        </Link>{" "}
        applies professional-grade aviation sealant and protective coatings that shield your
        exterior, slow corrosion, reduce cleaning time between services, and preserve your
        aircraft's resale value.
      </>
    ),
    linkLabel: "Aircraft paint protection service",
  },
];

const STANDARDS = [
  "Aviation-approved chemicals only",
  "Trained on aluminum, composite & plexiglass",
  "Corrosion-conscious procedures",
  "Hangar or ramp service by appointment",
];

export default function AircraftDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="Aircraft Detailing in Baton Rouge, Lafayette & New Orleans, LA"
        description="Professional aircraft cleaning & detailing at BTR, LFT, MSY, NEW and South Louisiana general aviation airports. Aviation-safe products for painted aluminum, composites & plexiglass."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Aircraft Detailing Serving Baton Rouge, Lafayette & New Orleans Airports", path: PAGE_PATH },
        ]),
      ]} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            Aircraft Detailing · BTR · LFT · MSY · NEW
          </li>
        </ol>
      </nav>

      {/* HERO — flight-data style with airport code rail */}
      <section className="relative overflow-hidden border-b border-border">
        {/* faint grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="container-custom relative pt-10 pb-14 md:pt-16 md:pb-20">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-6">
            <PlaneTakeoff className="h-3.5 w-3.5" />
            AVIATION DETAILING · SOUTH LOUISIANA
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] max-w-5xl">
            Aircraft Detailing Serving{" "}
            <span className="text-primary">Baton Rouge, Lafayette & New Orleans</span>{" "}
            Airports
          </h1>

          {/* Airport code rail */}
          <div className="mt-8 flex flex-wrap gap-2">
            {AIRPORTS.map((a) => (
              <div
                key={a.code}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5"
              >
                <span className="font-mono text-sm font-bold text-primary">{a.code}</span>
                <span className="text-xs text-muted-foreground">{a.city}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
            AV Detailing provides professional aircraft cleaning and detailing for private,
            charter, and corporate aircraft throughout South Louisiana. We service piston
            singles and twins, turboprops, light and mid-size jets, and helicopters at
            Baton Rouge Metropolitan Airport (BTR), Lafayette Regional Airport (LFT), Louis
            Armstrong New Orleans International Airport (MSY), New Orleans Lakefront Airport
            (NEW), and surrounding general aviation fields. All work is performed using only
            aviation-safe products and procedures by trained detailing professionals who
            understand the care required for painted aluminum, composite surfaces, and
            aircraft plexiglass. According to the{" "}
            <a
              href="https://www.faa.gov/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Federal Aviation Administration
            </a>
            , regular cleaning and surface maintenance is an essential component of overall
            aircraft care. For airport-specific information, visit{" "}
            <a
              href="https://www.flybtr.com/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Baton Rouge Metropolitan Airport
            </a>
            .
          </p>

          {/* CTAs + contact */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">Request Aircraft Service</Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:+12255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="tel:+12255216264" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary" />
              (225) 521-6264
            </a>
            <a href="sms:+12252284796" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Text (225) 228-4796
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Hangar & ramp · BTR · LFT · MSY · NEW
            </span>
          </div>
        </div>
      </section>

      {/* STANDARDS + FLEET */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-custom max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Operating Standards
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Aviation-grade care, not a car wash
            </h2>
            <ul className="space-y-3">
              {STANDARDS.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-base md:text-lg">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Fleet Types We Service
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              From single-engine pistons to rotorcraft
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FLEET_TYPES.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <Plane className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES — spec-sheet panels */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Service Catalog
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Three core services, fully aviation-compliant
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <article
                  key={s.code}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {/* spec header bar */}
                  <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-background/40">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                      {s.code}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-6 md:p-7 flex flex-col flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      <Link to={s.href} className="text-foreground hover:text-primary transition-colors">
                        {s.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-primary/90 font-medium mb-4">{s.summary}</p>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base flex-1">
                      {s.body}
                    </p>
                    <Link
                      to={s.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all"
                    >
                      {s.linkLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* AIRPORTS COVERED */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Coverage Map
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              South Louisiana airports we service
            </h2>
            <p className="text-muted-foreground">
              Plus surrounding general aviation fields by request. We coordinate access with
              your FBO or hangar in advance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AIRPORTS.map((a) => (
              <div
                key={a.code}
                className="rounded-2xl border border-border bg-background p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-2xl font-bold text-primary">{a.code}</span>
                  <Plane className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-semibold text-foreground leading-snug">
                  {a.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{a.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Schedule your aircraft detail
          </h2>
          <p className="text-muted-foreground mb-8">
            Call or message for a quote. We coordinate hangar or ramp access with your FBO and
            arrive with aviation-approved equipment ready to go.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to="/book">Request Service</Link>
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
