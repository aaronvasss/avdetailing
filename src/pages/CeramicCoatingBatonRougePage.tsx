import { usePricing } from "@/lib/pricing";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, MapPin, CheckCircle2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { SERVICE_AREAS_TEXT } from "@/data/serviceLandingPages";
import { CERAMIC_PATH, CERAMIC_SEO, CERAMIC_TIERS, CERAMIC_STEPS, CERAMIC_BUYING_GUIDANCE, CERAMIC_LINKS, tierPrices } from "@/lib/ceramic-seo";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = CERAMIC_PATH;
const TITLE = CERAMIC_SEO.h1;

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Ceramic Coating",
  name: TITLE,
  provider: { "@id": `${SITE_URL}/#business` },
  areaServed: [
    { "@type": "City", name: "Baton Rouge" },
    { "@type": "Place", name: "Highland Road" },
    { "@type": "Place", name: "Shenandoah" },
    { "@type": "City", name: "Gonzales" },
    { "@type": "City", name: "Prairieville" },
    { "@type": "City", name: "Walker" },
    { "@type": "City", name: "Denham Springs" },
    { "@type": "City", name: "Central Baton Rouge" },
    { "@type": "City", name: "Zachary" },
  ],
  url: `${SITE_URL}${PAGE_PATH}`,
};

const SERVICE_AREAS = [
  "Highland Road",
  "Shenandoah",
  "Gonzales",
  "Prairieville",
  "Central Baton Rouge",
  "Walker",
  "Denham Springs",
];

const STEPS = CERAMIC_STEPS;
const WHY_CHOOSE = CERAMIC_BUYING_GUIDANCE;

export default function CeramicCoatingBatonRougePage() {
  const pricing = usePricing();
  return (
    <Layout>
      <SEOHead title={CERAMIC_SEO.title} description={CERAMIC_SEO.description} path={PAGE_PATH} />
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Car Detailing", path: "/car-detailing-baton-rouge" },
            { name: TITLE, path: PAGE_PATH },
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li>
            <Link to="/car-detailing-baton-rouge" className="hover:text-primary transition-colors">
              Car Detailing
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">{TITLE}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative container-custom max-w-5xl py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
            <Shield className="h-3.5 w-3.5" />
            System X Ceramic Coating • Baton Rouge, LA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {TITLE}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
            AV Detailing applies <strong className="text-foreground">System X</strong> ceramic coatings at your home or
            office in Baton Rouge in three tiers: 3-year, 6-year and 10-year. A coating adds a protective layer over clear
            coat that makes routine washing easier. Because it seals in whatever is underneath, we look at your paint
            first; swirls or scratches you want reduced are handled with{" "}
            <Link to="/paint-correction-baton-rouge" className="text-primary underline hover:text-primary/80">paint correction</Link>
            , which is quoted separately. Compare tiers below or see our{" "}
            <Link to="/car-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">car detailing packages</Link>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/book">Book Online</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <a href="tel:2255216264">
                <Phone className="mr-2 h-5 w-5" />
                (225) 521-6264
              </a>
            </Button>
          </div>

          {/* Service area chips */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
              <MapPin className="h-3.5 w-3.5" />
              Serving:
            </span>
            {SERVICE_AREAS.map((area) => (
              <span
                key={area}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Coating Tiers */}
      <section className="pt-10 md:pt-12 pb-16 md:pb-20 bg-background">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">System X Coating Tiers</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Starting prices by tier and vehicle type. Paint correction, if your paint needs it, is quoted separately —
              see 
              <Link to="/paint-correction-baton-rouge" className="text-primary hover:underline">paint correction options</Link>.
              Questions? Call 
              <a href="tel:2255216264" className="text-primary hover:underline">(225) 521-6264</a>.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-3 lg:items-stretch">
            {(() => { const t = CERAMIC_TIERS[0]; const p = tierPrices(t.key); return (
            <article className="order-2 lg:order-1 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-[hsl(0_0%_6%)] text-white border border-white/10 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-2">{t.label}</span>
              <h3 className="text-2xl font-bold mb-1.5">{t.name}</h3>
              <p className="text-sm text-white/65 mb-4 leading-relaxed">{t.summary}</p>
              <div className="mb-5 pb-5 border-b border-white/10">
                <span className="text-3xl font-bold">from {pricing.label(p.car)}</span>
                <span className="block text-xs font-normal text-white/50 mt-1">Sedans & coupes · SUVs & trucks from {pricing.label(p.suvTruck)}</span>
              </div>
              <ul className="text-sm text-white/85 space-y-2.5 mb-7 flex-1">
                {t.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>{pt}</span></li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full bg-white text-black hover:bg-white/90 border-white">
                <Link to="/book">Book {t.name}</Link>
              </Button>
            </article>
            ); })()}

            {(() => { const t = CERAMIC_TIERS[1]; const p = tierPrices(t.key); return (
            <article className="order-1 lg:order-2 flex flex-col h-full rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[hsl(45_70%_14%)] via-[hsl(42_60%_9%)] to-[hsl(40_55%_5%)] border-2 border-[hsl(45_85%_55%)] shadow-2xl lg:scale-[1.04] lg:-my-2 relative mt-4 lg:mt-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_55%)] font-semibold px-3 py-1 shadow-lg whitespace-nowrap">
                  Longest Tier
                </Badge>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(45_85%_65%)] mb-2">{t.label}</span>
              <h3 className="text-2xl font-bold mb-1.5">{t.name}</h3>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">{t.summary}</p>
              <div className="mb-5 pb-5 border-b border-[hsl(45_85%_55%)]/25">
                <span className="text-3xl font-bold text-[hsl(45_85%_65%)]">from {pricing.label(p.car)}</span>
                <span className="block text-xs font-normal text-white/60 mt-1">Sedans & coupes · SUVs & trucks from {pricing.label(p.suvTruck)}</span>
              </div>
              <ul className="text-sm text-white/90 space-y-2.5 mb-7 flex-1">
                {t.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>{pt}</span></li>
                ))}
              </ul>
              <Button asChild className="w-full bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_60%)] font-semibold shadow-md">
                <Link to="/book">Book {t.name}</Link>
              </Button>
            </article>
            ); })()}

            {(() => { const t = CERAMIC_TIERS[2]; const p = tierPrices(t.key); return (
            <article className="order-3 lg:order-3 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-gradient-to-b from-[hsl(0_0%_97%)] to-[hsl(0_0%_86%)] text-[hsl(0_0%_10%)] border border-[hsl(0_0%_72%)] shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(0_0%_35%)] mb-2">{t.label}</span>
              <h3 className="text-2xl font-bold mb-1.5">{t.name}</h3>
              <p className="text-sm text-[hsl(0_0%_30%)] mb-4 leading-relaxed">{t.summary}</p>
              <div className="mb-5 pb-5 border-b border-[hsl(0_0%_60%)]/40">
                <span className="text-3xl font-bold">from {pricing.label(p.car)}</span>
                <span className="block text-xs font-normal text-[hsl(0_0%_35%)] mt-1">Sedans & coupes · SUVs & trucks from {pricing.label(p.suvTruck)}</span>
              </div>
              <ul className="text-sm text-[hsl(0_0%_20%)] space-y-2.5 mb-7 flex-1">
                {t.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>{pt}</span></li>
                ))}
              </ul>
              <Button asChild className="w-full bg-black text-white hover:bg-black/85">
                <Link to="/book">Book {t.name}</Link>
              </Button>
            </article>
            ); })()}

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-12 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How Our Ceramic Coating Service Works</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              What happens from booking to the final walkaround.
            </p>
          </div>

          <ol className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={i}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {i + 1} of {STEPS.length}
                  </span>
                </div>
                <p className="text-foreground/90 leading-relaxed text-sm md:text-base">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Before You Book Ceramic Coating
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {WHY_CHOOSE.map((item, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-background p-4">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item}</p>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-wrap gap-3">
            {CERAMIC_LINKS.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="text-primary underline hover:text-primary/80">{l.text}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Service Areas */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                <MapPin className="h-3.5 w-3.5" />
                Mobile Service Across Greater Baton Rouge
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Service Areas</h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                {SERVICE_AREAS_TEXT}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
                Neighborhoods We Cover
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {SERVICE_AREAS.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {area}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                Not sure if we cover your area? Call{" "}
                <a href="tel:2255216264" className="text-primary hover:underline font-medium">
                  (225) 521-6264
                </a>{" "}
                and we'll confirm.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
