import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, Sun, Droplets, Sparkles, MapPin, CheckCircle2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { SERVICE_AREAS_TEXT } from "@/data/serviceLandingPages";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/ceramic-coating-baton-rouge";
const TITLE = "Ceramic Coating in Baton Rouge, LA";
const DESCRIPTION =
  "System X ceramic coating in Baton Rouge — 3-year, 6-year, and 10-year tiers. Permanent hydrophobic protection against Louisiana UV, humidity, and water spots.";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Ceramic Coating",
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

const STEPS = [
  "Free consultation — choose the 3-year, 6-year, or 10-year System X tier.",
  "Multi-stage paint correction to remove swirls and defects (mandatory prep).",
  "Surface prep with IPA wipedown to remove all oils and polish residue.",
  "System X ceramic coating applied in a controlled, contamination-free environment.",
  "24-hour cure period followed by a final walkaround inspection.",
];

const WHY_CHOOSE = [
  "Exclusively System X — one of the industry-leading ceramic coating brands.",
  "Three tiers offered: 3-year, 6-year (most popular), and 10-year.",
  "Paint correction prep included to avoid locking swirls in under the coating.",
  "Hydrophobic protection engineered for Louisiana UV, humidity, and rain.",
];

export default function CeramicCoatingBatonRougePage() {
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
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li>
            <Link to="/car-detailing-baton-rouge" className="hover:text-primary transition-colors">
              Services
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
            System X Certified • Baton Rouge, LA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {TITLE}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
            Louisiana's UV index regularly tops 10 in summer — intense enough to break down standard wax and
            synthetic sealants in just weeks. Ceramic coating is a semi-permanent hydrophobic protective layer
            that bonds chemically to your vehicle's clear coat. AV Detailing exclusively installs{" "}
            <strong className="text-foreground">System X</strong>, one of the most respected ceramic brands in the
            industry, in three tiers: <strong className="text-foreground">3-year</strong>,{" "}
            <strong className="text-foreground">6-year (most popular)</strong>, and{" "}
            <strong className="text-foreground">10-year</strong>. Black and dark-colored vehicles see the biggest
            visual improvement and the largest protection benefit under our Louisiana sun. According to{" "}
            <a
              href="https://www.consumerreports.org/cars/car-care/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Consumer Reports
            </a>
            , paint protection is one of the most cost-effective ways to preserve a vehicle's resale value, and{" "}
            <a
              href="https://www.deq.louisiana.gov/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              the Louisiana DEQ
            </a>{" "}
            highlights how UV and pollutant exposure accelerate finish degradation across South Louisiana.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/book">Book Online</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <a href="tel:+12255216264">
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
              Choose the protection level your vehicle deserves. All tiers include mandatory paint correction prep.
              Call{" "}
              <a href="tel:+12255216264" className="text-primary hover:underline">(225) 521-6264</a> for exact
              pricing on SUVs and trucks.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-3 lg:items-stretch">
            {/* 3-Year — Black */}
            <article className="order-2 lg:order-1 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-[hsl(0_0%_6%)] text-white border border-white/10 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-2">Entry Protection</span>
              <h3 className="text-2xl font-bold mb-1.5">System X 3-Year</h3>
              <p className="text-sm text-white/65 mb-4 leading-relaxed">
                A strong starting point for daily drivers. Real ceramic protection without the long-term commitment.
              </p>
              <div className="mb-5 pb-5 border-b border/10 border-white/10">
                <span className="text-3xl font-bold">from $800</span>
                <span className="block text-xs font-normal text-white/50 mt-1">Sedans & coupes · 8-hour install</span>
              </div>
              <ul className="text-sm text-white/85 space-y-2.5 mb-7 flex-1">
                <li className="flex gap-2"><span className="text-white/40 mt-0.5">•</span><span>3 years of hydrophobic protection</span></li>
                <li className="flex gap-2"><span className="text-white/40 mt-0.5">•</span><span>UV, water-spot & oxidation resistance</span></li>
                <li className="flex gap-2"><span className="text-white/40 mt-0.5">•</span><span>Mandatory 1-step paint correction prep</span></li>
                <li className="flex gap-2"><span className="text-white/40 mt-0.5">•</span><span>Easier washes — dirt & grime release</span></li>
                <li className="flex gap-2"><span className="text-white/40 mt-0.5">•</span><span>Deeper, glossier finish</span></li>
              </ul>
              <Button asChild variant="outline" className="w-full bg-white text-black hover:bg-white/90 border-white">
                <Link to="/book">Book Now</Link>
              </Button>
            </article>

            {/* 6-Year — Center, Elevated */}
            <article className="order-1 lg:order-2 flex flex-col h-full rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[hsl(45_70%_14%)] via-[hsl(42_60%_9%)] to-[hsl(40_55%_5%)] border-2 border-[hsl(45_85%_55%)] shadow-2xl lg:scale-[1.04] lg:-my-2 relative mt-4 lg:mt-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_55%)] font-semibold px-3 py-1 shadow-lg whitespace-nowrap">
                  ★ Most Popular
                </Badge>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(45_85%_65%)] mb-2">Best Value</span>
              <h3 className="text-2xl font-bold mb-1.5 text-white">System X 6-Year</h3>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                Our most-installed tier. The sweet spot of protection, durability, and value for Louisiana drivers.
              </p>
              <div className="mb-5 pb-5 border-b border-[hsl(45_85%_55%)]/25">
                <span className="text-3xl font-bold text-[hsl(45_85%_65%)]">from $1,200</span>
                <span className="block text-xs font-normal text-white/60 mt-1">Sedans & coupes · 8-hour install</span>
              </div>
              <ul className="text-sm text-white/90 space-y-2.5 mb-7 flex-1">
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span className="font-semibold">Everything in 3-Year</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>6 years of full ceramic protection</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Stronger UV & chemical resistance</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Multi-stage paint correction included</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Maximum hydrophobic beading</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Wheel face coating available as add-on</span></li>
              </ul>
              <Button asChild className="w-full bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_60%)] font-semibold shadow-md">
                <Link to="/book">Book Now</Link>
              </Button>
            </article>

            {/* 10-Year — Silver */}
            <article className="order-3 lg:order-3 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-gradient-to-b from-[hsl(0_0%_97%)] to-[hsl(0_0%_86%)] text-[hsl(0_0%_10%)] border border-[hsl(0_0%_72%)] shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(0_0%_35%)] mb-2">Lifetime Tier</span>
              <h3 className="text-2xl font-bold mb-1.5">System X 10-Year</h3>
              <p className="text-sm text-[hsl(0_0%_30%)] mb-4 leading-relaxed">
                The highest level of System X protection we install. Built for long-term ownership and showroom standards.
              </p>
              <div className="mb-5 pb-5 border-b border-[hsl(0_0%_60%)]/40">
                <span className="text-3xl font-bold">from $1,600</span>
                <span className="block text-xs font-normal text-[hsl(0_0%_35%)] mt-1">Sedans & coupes · 8-hour install</span>
              </div>
              <ul className="text-sm text-[hsl(0_0%_20%)] space-y-2.5 mb-3 flex-1">
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Everything in 6-Year</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>10 years of ceramic protection</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Maximum hardness & scratch resistance</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Premium multi-step correction included</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Mirror-deep gloss finish</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Best long-term resale-value play</span></li>
              </ul>
              <p className="text-xs italic text-[hsl(0_0%_35%)] mb-5">Recommended for new or freshly painted vehicles.</p>
              <Button asChild className="w-full bg-black text-white hover:bg-black/85">
                <Link to="/book">Book Now</Link>
              </Button>
            </article>
          </div>
        </div>
      </section>

      {/* What Ceramic Coating Protects Against */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-custom max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What It Protects Against</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Built specifically for the conditions vehicles face across Greater Baton Rouge.
            </p>
          </div>
          <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Sun className="h-6 w-6" />, title: "UV & Sun Damage", body: "Stops oxidation and color fade caused by Louisiana's 10+ UV index." },
              { icon: <Droplets className="h-6 w-6" />, title: "Water Spots & Rain", body: "Hydrophobic surface beads water and resists hard-water etching." },
              { icon: <Shield className="h-6 w-6" />, title: "Chemicals & Fallout", body: "Resists bird droppings, tree sap, bug acids, and industrial fallout." },
              { icon: <Sparkles className="h-6 w-6" />, title: "Swirls & Dullness", body: "Locked-in gloss after correction — no need to constantly re-polish." },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-border bg-background p-5 md:p-6 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {c.icon}
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-12 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How Our Ceramic Coating Service Works</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              A clear, five-step process from consultation to a final, fully cured finish.
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
            Why Baton Rouge Customers Choose AV Detailing for Ceramic Coating
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {WHY_CHOOSE.map((item, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-background p-4">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item}</p>
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
                <a href="tel:+12255216264" className="text-primary hover:underline font-medium">
                  (225) 521-6264
                </a>{" "}
                — we likely do.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
