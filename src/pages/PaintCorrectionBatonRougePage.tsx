import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Sparkles,
  Search,
  Droplets,
  Wrench,
  Wind,
  Shield,
  MapPin,
  ArrowRight,
  Star,
  Award,
  Clock,
  Gauge,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/paint-correction-baton-rouge";
const TITLE = "Paint Correction in Baton Rouge, LA";
const DESCRIPTION =
  "Professional multi-stage paint correction in Baton Rouge — remove swirls, water spots, oxidation, and light scratches. 1-step, 2-step, and 3-step options with mirror-deep finish.";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Paint Correction",
  name: TITLE,
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
    { "@type": "City", name: "Baton Rouge" },
    { "@type": "City", name: "Gonzales" },
    { "@type": "City", name: "Prairieville" },
    { "@type": "City", name: "Walker" },
    { "@type": "City", name: "Denham Springs" },
    { "@type": "City", name: "Central" },
    { "@type": "City", name: "Zachary" },
  ],
  url: `${SITE_URL}${PAGE_PATH}`,
};

const SERVICE_AREAS = [
  "Baton Rouge",
  "Highland Road",
  "Shenandoah",
  "Central",
  "Zachary",
  "Gonzales",
  "Prairieville",
  "Walker",
  "Denham Springs",
];

const PROCESS = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Inspection & Paint Reading",
    body:
      "We grade your paint under direct LED inspection light to map every swirl, scratch, water spot, and oxidation zone before touching the panel.",
  },
  {
    icon: <Droplets className="h-5 w-5" />,
    title: "Decontamination Wash",
    body:
      "Foam pre-soak, two-bucket hand wash, iron remover, and clay-bar treatment to lift embedded contaminants the eye can't see.",
  },
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "Test Panel & Calibration",
    body:
      "We dial in the exact compound, pad, and machine speed on a single panel — so the rest of the car gets a proven combination, not a guess.",
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    title: "Multi-Stage Machine Polishing",
    body:
      "Dual-action and rotary polishers level the clear coat in controlled passes — 1, 2, or 3 stages depending on the damage we read.",
  },
  {
    icon: <Wind className="h-5 w-5" />,
    title: "IPA Wipedown & Final Inspection",
    body:
      "Every panel is wiped with isopropyl alcohol to strip polishing oils so what you see is the true, finished result — not a temporary shine.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Sealant or System X Coating",
    body:
      "Protect the work with a long-lasting sealant or upgrade to a System X ceramic coating so the gloss lasts for years, not weeks.",
  },
];

const TIERS = [
  {
    name: "1-Step Correction",
    tag: "Enhancement Polish",
    price: "from $400",
    duration: "4–6 hours",
    removes: "Removes 60–75% of defects",
    description:
      "Restores depth and gloss on paint with light swirls, haze, and dull spots. A great refresh for daily drivers and leased vehicles.",
    bullets: [
      "Single-stage machine polish",
      "Clear-coat safe compound + finishing polish",
      "Light to moderate swirl removal",
      "Brings back the showroom shine",
    ],
    accent: "neutral",
  },
  {
    name: "2-Step Correction",
    tag: "Most Requested",
    price: "from $500",
    duration: "6–9 hours",
    removes: "Removes 80–90% of defects",
    description:
      "Our most popular correction. Cuts deeper for moderate swirls and water spots, then refines to a true mirror finish on every panel.",
    bullets: [
      "Compound stage to level deeper defects",
      "Refining polish for glass-clear clarity",
      "Recommended prep for ceramic coating",
      "Best balance of result, time, and value",
    ],
    accent: "primary",
  },
  {
    name: "3-Step Correction",
    tag: "Concours Level",
    price: "from $650",
    duration: "8–12 hours",
    removes: "Removes 95%+ of defects",
    description:
      "Maximum correction for neglected paint, deeper scratches, oxidation, or show-car standards. Every panel finished to its highest possible clarity.",
    bullets: [
      "Heavy cut, refining polish, and jeweling stage",
      "Tackles deep scratches and heavy oxidation",
      "Show-car / concours-level finish",
      "Ideal foundation for 10-Year System X",
    ],
    accent: "neutral",
  },
];

const REASONS = [
  {
    icon: <Award className="h-5 w-5" />,
    title: "Trained on Baton Rouge Paint",
    body:
      "We correct paint every week on cars exposed to Louisiana sun, parish industrial fallout, and Gulf humidity. Local conditions, local experience.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Honest Paint Reading",
    body:
      "We tell you what your paint actually needs — 1, 2, or 3 stages. No upsell to a 3-step when a 1-step will already make it look incredible.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Safe, Measured Approach",
    body:
      "Test panels and paint-thickness awareness on every job. We level defects, not your clear coat — your finish has to last for years after we leave.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Coating-Ready Finish",
    body:
      "Our corrections are prepped to System X spec — IPA wiped, oil-free, and ready to bond. Your ceramic coating locks in clarity, not swirls.",
  },
];

export default function PaintCorrectionBatonRougePage() {
  return (
    <Layout>
      <SEOHead title={TITLE} description={DESCRIPTION} path={PAGE_PATH} />
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/car-detailing-baton-rouge" },
            { name: TITLE, path: PAGE_PATH },
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li><Link to="/car-detailing-baton-rouge" className="hover:text-primary transition-colors">Services</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">{TITLE}</li>
        </ol>
      </nav>

      {/* Hero — editorial split layout (different from car detailing & ceramic) */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="container-custom max-w-7xl py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Mirror-Finish Paint Correction
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5">
                Bring your paint <span className="text-primary">back to glass.</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-2xl">
                Every Baton Rouge car collects swirls, water spots, and light scratches — and our UV makes them
                louder than they should be. Paint correction is a precise multi-stage machine-polishing process
                that physically removes those defects from your clear coat and restores a deep, wet, mirror-like
                finish. It's also the mandatory prep step before any ceramic coating — applying a coating over
                swirls locks them in forever.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="text-base">
                  <Link to="/book">
                    Book Paint Correction
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <a href="tel:+12255216264">
                    <Phone className="mr-2 h-5 w-5" />
                    (225) 521-6264
                  </a>
                </Button>
              </div>
            </div>

            {/* Stat panel — distinct from ceramic & detailing pages */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  By the numbers
                </div>
                <dl className="grid grid-cols-2 gap-5">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Defects removed</dt>
                    <dd className="text-3xl font-bold">up to 95%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Correction stages</dt>
                    <dd className="text-3xl font-bold">1 · 2 · 3</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Starting at</dt>
                    <dd className="text-3xl font-bold text-primary">$400</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mobile in</dt>
                    <dd className="text-3xl font-bold">Baton Rouge</dd>
                  </div>
                </dl>
                <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Required prep before any <strong className="text-foreground">System X</strong> ceramic coating.
                    Skip the swirls — don't lock them under your coating.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Correction Tiers — horizontal feature rows, different from card grids */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-14 max-w-3xl">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">
              Pricing & Stages
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Choose the correction stage that matches your paint.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Final pricing depends on vehicle size and paint condition. Call{" "}
              <a href="tel:+12255216264" className="text-primary hover:underline">(225) 521-6264</a> for an
              exact quote after a free paint inspection.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            {TIERS.map((tier, idx) => {
              const isFeatured = tier.accent === "primary";
              return (
                <article
                  key={tier.name}
                  className={`relative rounded-3xl border transition-all hover:shadow-2xl ${
                    isFeatured
                      ? "border-primary/60 bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-xl"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="grid md:grid-cols-12 gap-6 p-6 md:p-8">
                    {/* Left — index + name */}
                    <div className="md:col-span-4 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${
                            isFeatured
                              ? "bg-primary text-primary-foreground"
                              : "bg-foreground/5 text-foreground border border-border"
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        {isFeatured && (
                          <Badge className="bg-primary text-primary-foreground hover:bg-primary font-semibold">
                            ★ {tier.tag}
                          </Badge>
                        )}
                        {!isFeatured && (
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {tier.tag}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {tier.description}
                      </p>
                      <div className="mt-auto">
                        <div className="text-3xl md:text-4xl font-bold mb-1">
                          {tier.price}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {tier.duration}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5" /> {tier.removes}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle — bullets */}
                    <div className="md:col-span-5">
                      <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
                        {tier.bullets.map((b) => (
                          <li key={b} className="flex gap-2 text-sm text-foreground/90">
                            <Sparkles className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isFeatured ? "text-primary" : "text-muted-foreground"}`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right — CTA */}
                    <div className="md:col-span-3 flex flex-col justify-end gap-4">
                      <div className="text-right md:text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Starting at</div>
                        <div className="text-3xl md:text-4xl font-bold">{tier.price}</div>
                      </div>
                      <Button
                        asChild
                        className={`w-full font-semibold tracking-wide ${
                          isFeatured
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        }`}
                      >
                        <Link to="/book">
                          Book Now
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <a
                        href="tel:+12255216264"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors text-center md:text-right"
                      >
                        Or call for a custom quote
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Our Paint Correction Works — vertical timeline, distinct from numbered grid on ceramic page */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">
              Our Process
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              How our paint correction works.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              A measured, six-stage process built around safe, repeatable results — not shortcuts.
            </p>
          </div>

          <ol className="relative">
            {/* vertical line */}
            <div className="absolute left-5 md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent md:-translate-x-1/2" aria-hidden="true" />

            {PROCESS.map((step, i) => {
              const left = i % 2 === 0;
              return (
                <li key={step.title} className="relative pl-14 md:pl-0 mb-10 md:mb-12 last:mb-0">
                  {/* number node */}
                  <div className="absolute left-0 md:left-1/2 top-0 md:-translate-x-1/2 z-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold ring-4 ring-background shadow-lg">
                      {i + 1}
                    </div>
                  </div>

                  <div className={`md:grid md:grid-cols-2 md:gap-12 ${left ? "" : ""}`}>
                    <div className={`${left ? "md:pr-12 md:text-right" : "md:col-start-2 md:pl-12"}`}>
                      <div
                        className={`inline-flex items-center gap-2 text-primary mb-2 ${
                          left ? "md:flex-row-reverse" : ""
                        }`}
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                          {step.icon}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Stage {i + 1} of {PROCESS.length}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Why Baton Rouge Customers Choose AV Detailing — split with big quote, different from ceramic checklist */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">
                Why AV Detailing
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
                Why Baton Rouge customers choose AV Detailing for paint correction.
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                Paint correction is the most skill-dependent service in the detailing world. A bad polish job
                burns through clear coat and can't be undone. We take it seriously — calibrated tools, paint
                reading, and a finish built to hold up under Louisiana sun.
              </p>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6">
                <p className="text-foreground/90 italic leading-relaxed text-sm md:text-base">
                  "Our standard is simple: when the lights hit the paint after we finish, it looks like glass —
                  and it stays that way."
                </p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  — AV Detailing Team
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                {REASONS.map((r) => (
                  <div
                    key={r.title}
                    className="group rounded-2xl border border-border bg-background p-5 md:p-6 transition-all hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {r.icon}
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-2">{r.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas — full-width map-style chip cloud, distinct layout */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-background to-card p-8 md:p-12 lg:p-14 shadow-sm relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 text-primary mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Service Areas</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Mobile across <span className="text-primary">Greater Baton Rouge.</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                  We bring the correction setup to your driveway, office, or shop. If your address sits within
                  Greater Baton Rouge, chances are we're already in your neighborhood.
                </p>
                <Button asChild size="lg" variant="outline">
                  <a href="tel:+12255216264">
                    <Phone className="mr-2 h-5 w-5" />
                    Check My Address
                  </a>
                </Button>
              </div>

              <div className="lg:col-span-7">
                <div className="flex flex-wrap gap-2.5">
                  {SERVICE_AREAS.map((area) => (
                    <span
                      key={area}
                      className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-default"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {area}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Not listed? Call us — we cover most of the Greater Baton Rouge metro and surrounding parishes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
