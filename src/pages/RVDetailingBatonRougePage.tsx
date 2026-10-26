import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone, Caravan, Sparkles, Shield, Truck, Droplets, MapPin, ArrowUpRight, ClipboardList } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { usePricing } from "@/lib/pricing";
import {
  RV_HUB_SEO,
  RV_EXTERIOR_LINKS,
  RV_BUYING_GUIDANCE,
  RV_HUB_FAQ_NOTE,
  RV_EXTERIOR_WASH_NAME,
  rvExteriorWashPriceLabel,
} from "@/lib/rv-seo";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = RV_HUB_SEO.path;

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Exterior RV Detailing",
  name: RV_HUB_SEO.h1,
  provider: { "@id": `${SITE_URL}/#business` },
  areaServed: ["Baton Rouge", "Denham Springs", "Walker", "Gonzales", "Prairieville", "Central"].map((name) => ({ "@type": "City", name })),
  url: `${SITE_URL}${PAGE_PATH}`,
};

const ICONS = [Truck, Sparkles, Shield, Droplets];

export default function RVDetailingBatonRougePage() {
  const pricing = usePricing();
  const priceLabel = rvExteriorWashPriceLabel(pricing.packageFrom("rv", RV_EXTERIOR_WASH_NAME));

  return (
    <Layout>
      <SEOHead title={RV_HUB_SEO.title} description={RV_HUB_SEO.description} path={PAGE_PATH} />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "RV Detailing", path: PAGE_PATH },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">RV Detailing</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-custom pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 relative z-10 min-w-0">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-6">
                <Caravan className="h-3.5 w-3.5" />
                Exterior-Only RV Service · Baton Rouge, LA
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] break-words">{RV_HUB_SEO.h1}</h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">{RV_HUB_SEO.intro}</p>
              {priceLabel && (
                <p className="mt-4 text-lg font-semibold">
                  <span className="text-primary">{priceLabel}</span>
                </p>
              )}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button asChild className="font-semibold tracking-wide">
                  <Link to="/book">Book Online</Link>
                </Button>
                <Button asChild variant="outline" className="font-semibold tracking-wide">
                  <a href="tel:2255216264"><Phone className="mr-2 h-4 w-4" />(225) 521-6264</a>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <a href="sms:2255216264" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="text-primary">✉</span> Text (225) 521-6264
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Baton Rouge, LA · 6 AM to 8 PM
                </span>
              </div>
            </div>

            <aside className="lg:col-span-5 min-w-0">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
                <h2 className="flex items-center gap-2 text-xl font-bold mb-5">
                  <ClipboardList className="h-5 w-5 text-primary" /> What to tell us about your RV
                </h2>
                <ul className="space-y-3">
                  {RV_BUYING_GUIDANCE.map((g) => (
                    <li key={g} className="flex gap-3 text-sm md:text-base text-muted-foreground">
                      <span className="text-primary font-bold">✓</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* EXTERIOR SERVICES */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Exterior RV Care</div>
            <h2 className="text-3xl md:text-4xl font-bold">Exterior RV services</h2>
            <p className="mt-4 text-muted-foreground">{RV_HUB_FAQ_NOTE}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {RV_EXTERIOR_LINKS.map((l, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Link
                  key={l.href}
                  to={l.href}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{l.text}</h3>
                  <p className="text-muted-foreground leading-relaxed">{l.description}</p>
                </Link>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            We do not offer RV interior, upholstery or carpet cleaning.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Plan your RV's exterior detail</h2>
          <p className="text-muted-foreground mb-8">
            Send your RV details, condition, location and the exterior work you want, and we will confirm the scope and price.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><Link to="/book">Book Online</Link></Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:2255216264"><Phone className="mr-2 h-4 w-4" />(225) 521-6264</a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
