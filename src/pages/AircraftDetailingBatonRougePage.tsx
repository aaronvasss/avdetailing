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
import { AVIATION_OVERVIEW } from "@/lib/aviation-overview";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = AVIATION_OVERVIEW.path;

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Aircraft and Private Jet Detailing",
  name: AVIATION_OVERVIEW.h1,
  provider: { "@id": `${SITE_URL}/#business` },
  areaServed: ["Baton Rouge", "Lafayette", "New Orleans"].map(name => ({ "@type": "City", name })),
  url: `${SITE_URL}${PAGE_PATH}`,
};
const AIRPORTS = AVIATION_OVERVIEW.coverage;
const SERVICES = AVIATION_OVERVIEW.services;
const FLEET_TYPES = ["Private aircraft", "Private jets"];
const STANDARDS = ["Scope assessed for your aircraft", "Access and workspace coordinated per job", "Preferred dates discussed with your quote", "No aircraft booking deposit"];
const icons = { interior: Armchair, polishing: SprayCan, coating: ShieldCheck };

export default function AircraftDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title={AVIATION_OVERVIEW.title}
        description={AVIATION_OVERVIEW.description}
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
            Aircraft & Private Jet Detailing
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
            Aircraft & Private Jet Detailing in{" "}
            <span className="text-primary">Baton Rouge</span>
          </h1>

          {/* Airport code rail */}
          <div className="mt-8 flex flex-wrap gap-2">
            {AIRPORTS.map((a) => (
              <div
                key={a.code}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5"
              >
                <span className="font-mono text-sm font-bold text-primary">{a.code}</span>
                <span className="text-xs text-muted-foreground">{a.title}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
            {AVIATION_OVERVIEW.intro}
          </p>

          {/* CTAs + contact */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to={AVIATION_OVERVIEW.quoteHref}>Request an Aircraft Quote</Link>
            </Button>
            <Button asChild variant="outline" className="font-semibold tracking-wide">
              <a href="tel:2255216264">
                <Phone className="mr-2 h-4 w-4" />
                (225) 521-6264
              </a>
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="tel:2255216264" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary" />
              (225) 521-6264
            </a>
            <a href="sms:2255216264" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Text (225) 521-6264
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Airport & hangar access coordinated per job
            </span>
          </div>
        </div>
      </section>

      {/* STANDARDS + FLEET */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-custom max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Your Aircraft Appointment
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Aircraft-specific scope and arrangements
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
              Aircraft We Detail
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Private aircraft, including private jets
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
              Aircraft detailing services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SERVICES.map((s) => {
              const Icon = icons[s.icon];
              return (
                <article
                  key={s.title}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {/* spec header bar */}
                  <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-background/40">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                      {`SVC-0${SERVICES.indexOf(s) + 1}`}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-6 md:p-7 flex flex-col flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      <Link to={s.href} className="text-foreground hover:text-primary transition-colors">
                        {s.title}
                      </Link>
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base flex-1">
                      {s.description}
                    </p>
                    <Link
                      to={s.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all"
                    >
                      {s.link}
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
              Baton Rouge, Lafayette & New Orleans coverage
            </h2>
            <p className="text-muted-foreground">
              {AVIATION_OVERVIEW.coverageText}
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
                  {a.title}
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding border-b border-border">
        <div className="container-custom max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Aircraft quote & scheduling questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {AVIATION_OVERVIEW.questions.map(item => (
              <div key={item.question}>
                <h3 className="text-xl font-bold mb-3">{item.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-muted-foreground">
            Discuss <Link to="/aircraft-cleaning-baton-rouge" className="text-primary underline">exterior aircraft cleaning and condition assessment</Link>,
            explore <Link to="/aircraft-interior-detailing-baton-rouge" className="text-primary underline">aircraft interior deep cleaning and shampooing</Link>,
            or review <Link to="/aircraft-paint-protection-baton-rouge" className="text-primary underline">aircraft polishing and ceramic coating</Link>.
            Return to <Link to="/services" className="text-primary underline">all detailing services</Link>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-primary/60" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Request an aircraft quote
          </h2>
          <p className="text-muted-foreground mb-8">
            {AVIATION_OVERVIEW.quoteText}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild className="font-semibold tracking-wide">
              <Link to={AVIATION_OVERVIEW.quoteHref}>Request an Aircraft Quote</Link>
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
