import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { ServiceLandingConfig, SERVICE_AREAS_TEXT } from "@/data/serviceLandingPages";
import { BOAT_HUB_PATH, BOAT_PACKAGES, relatedBoatLinks } from "@/lib/boat-seo";
import { usePricing } from "@/lib/pricing";
import { CAR_HUB_PATH, CAR_INTERIOR_BY_PACKAGE, CAR_ACTIVE_ADD_ONS, relatedCarLinks } from "@/lib/car-seo";
import { RV_HUB_PATH, RV_EXTERIOR_LINKS, RV_BUYING_GUIDANCE } from "@/lib/rv-seo";
import { aviationPolicy, AVIATION_COVERAGE_TEXT, AIRCRAFT_QUOTE_HREF } from "@/lib/aviation-policy";

const SITE_URL = "https://avdetailing.net";

interface Props {
  config: ServiceLandingConfig;
}

/**
 * Render an intro paragraph with {{l1}} / {{l2}} tokens replaced
 * by external authority anchor tags (open in new tab, rel=nofollow).
 */
function renderIntro(config: ServiceLandingConfig) {
  const { intro, link1, link2 } = config;
  const parts = intro.split(/(\{\{l1\}\}|\{\{l2\}\})/g);

  return parts.map((part, i) => {
    if (part === "{{l1}}") {
      return (
        <a
          key={i}
          href={link1.url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {link1.text}
        </a>
      );
    }
    if (part === "{{l2}}") {
      return (
        <a
          key={i}
          href={link2.url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {link2.text}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ServiceLandingTemplate({ config }: Props) {
  const pricing = usePricing();
  if (config.unavailable) return <UnavailableServicePage config={config} />;
  const isAircraft = config.slug.startsWith("aircraft-");
  const isRv = Boolean(config.rvPage);
  const isCar = Boolean(config.carPage);
  const isBoat = Boolean(config.boatPage);
  const crumbParent = isBoat ? { name: "Boat Detailing", path: BOAT_HUB_PATH } : isCar ? { name: "Car Detailing", path: CAR_HUB_PATH } : isAircraft ? { name: "Services", path: "/services" } : isRv ? { name: "RV Detailing", path: RV_HUB_PATH } : { name: "Services", path: "/car-detailing-baton-rouge" };
  const relatedLinks = isBoat ? relatedBoatLinks(`/${config.slug}`) : isCar ? relatedCarLinks(`/${config.slug}`) : isRv ? [{ text: "Exterior RV detailing overview", href: RV_HUB_PATH }, ...RV_EXTERIOR_LINKS.filter(l => l.href !== `/${config.slug}`)] : config.relatedLinks;
  const pagePath = `/${config.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: config.serviceType,
    name: config.title,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: isAircraft ? ["Baton Rouge", "Lafayette", "New Orleans"].map(name => ({ "@type": "City", name })) : [
      { "@type": "City", name: "Baton Rouge", geo: { "@type": "GeoCoordinates", latitude: 30.4515, longitude: -91.1871 } },
      { "@type": "Place", name: "Highland Road", geo: { "@type": "GeoCoordinates", latitude: 30.3963, longitude: -91.1271 } },
      { "@type": "Place", name: "Shenandoah", geo: { "@type": "GeoCoordinates", latitude: 30.3542, longitude: -91.0351 } },
      { "@type": "City", name: "Gonzales", geo: { "@type": "GeoCoordinates", latitude: 30.2382, longitude: -90.9201 } },
      { "@type": "City", name: "Prairieville", geo: { "@type": "GeoCoordinates", latitude: 30.3057, longitude: -90.9784 } },
      { "@type": "City", name: "Walker", geo: { "@type": "GeoCoordinates", latitude: 30.4866, longitude: -90.8631 } },
      { "@type": "City", name: "Denham Springs", geo: { "@type": "GeoCoordinates", latitude: 30.4855, longitude: -90.9559 } },
      { "@type": "City", name: "Central Baton Rouge", geo: { "@type": "GeoCoordinates", latitude: 30.5527, longitude: -91.0357 } },
      { "@type": "City", name: "Zachary", geo: { "@type": "GeoCoordinates", latitude: 30.6491, longitude: -91.1565 } },
      { "@type": "Place", name: "Old Jefferson", geo: { "@type": "GeoCoordinates", latitude: 30.4321, longitude: -91.1543 } },
      { "@type": "Place", name: "Highland Lakes", geo: { "@type": "GeoCoordinates", latitude: 30.4102, longitude: -91.0987 } },
    ],
    url: `${SITE_URL}${pagePath}`,
  };

  return (
    <Layout>
      <SEOHead title={config.seoTitle ?? config.title} description={config.metaDescription} path={pagePath} />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          crumbParent,
          { name: config.title, path: `/${config.slug}` },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li>
            <Link to={crumbParent.path} className="hover:text-primary transition-colors">
              {crumbParent.name}
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            {config.title}
          </li>
        </ol>
      </nav>


      {/* H1 + Intro */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {config.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {renderIntro(config)}
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            {config.processHeading ?? `How Our ${config.serviceType} Works`}
          </h2>
          <ol className="space-y-5">
            {config.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg pt-1">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            {config.scopeHeading ?? `Why Baton Rouge Customers Choose AV Detailing for ${config.serviceType}`}
          </h2>
          <ul className="space-y-4">
            {config.whyChoose.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 text-primary font-bold text-xl leading-none mt-1">
                  ✓
                </span>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {config.showBoatPackages && (
        <section className="section-padding">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Boat detailing packages</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {BOAT_PACKAGES.map((p) => (
                <article key={p.name} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                  <p className="text-primary font-semibold mb-3">from {pricing.label(pricing.packageFrom("boat", p.name))}</p>
                  <p className="text-sm text-muted-foreground flex-1">{p.scope}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Typical time: {p.duration}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-muted-foreground">Work outside these packages is quoted after we review your boat.</p>
          </div>
        </section>
      )}

      {config.showInteriorPackages && (
        <section className="section-padding">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Which package includes the interior work you need</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {CAR_INTERIOR_BY_PACKAGE.map((p) => (
                <article key={p.name} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-3">{p.name}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground flex-1">
                    {p.interior.map((i) => <li key={i} className="flex gap-2"><span className="text-primary">✓</span><span>{i}</span></li>)}
                  </ul>
                  {p.excludes && <p className="mt-3 text-xs italic text-muted-foreground">{p.excludes}</p>}
                  <Button asChild variant="outline" className="mt-5"><Link to={`/book?service=car&package=${p.slug}`}>Book {p.name.replace(" Package", "")}</Link></Button>
                </article>
              ))}
            </div>
            <p className="mt-6 text-muted-foreground">Available add-ons: {CAR_ACTIVE_ADD_ONS.join(", ")}. See <Link to={CAR_HUB_PATH} className="text-primary underline">package prices on the car detailing page</Link>.</p>
          </div>
        </section>
      )}

      {/* Service Areas */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{isAircraft ? "Related aircraft services & location arrangements" : isRv ? "Related exterior RV services & service areas" : isCar ? "Related car services & service areas" : isBoat ? "Related boat services & service areas" : "Service Areas"}</h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {isAircraft ? <>{AVIATION_COVERAGE_TEXT} See the <Link to="/aircraft-detailing-baton-rouge" className="text-primary underline">private-aircraft detailing overview</Link> for the complete service overview and quote guidance.</> : SERVICE_AREAS_TEXT}
          </p>
          {isRv && <p className="text-muted-foreground leading-relaxed text-base md:text-lg mt-4">Our RV service is exterior-only; we do not offer RV interior or upholstery cleaning.</p>}
          {relatedLinks && <ul className="mt-6 space-y-3">{relatedLinks.map(link => <li key={link.href}><Link to={link.href} className="text-primary underline underline-offset-4">{link.text}</Link></li>)}</ul>}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl text-center">
          {isAircraft && <p className="text-muted-foreground mb-6">{aviationPolicy.depositRequired ? "Discuss aircraft booking requirements with us." : "Aircraft bookings do not require a deposit."} Include your aircraft make/model, location, requested work, condition, preferred dates and contact details. Photos are optional.</p>}
          <p className="text-xl md:text-2xl font-semibold mb-6">
            Call{" "}
            <a href="tel:2255216264" className="text-primary hover:underline">
              (225) 521-6264
            </a>{" "}
            {isAircraft ? "or request an aircraft quote." : "or book online today."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to={isAircraft ? AIRCRAFT_QUOTE_HREF : "/book"}>{isAircraft ? "Request an Aircraft Quote" : "Book Online"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <a href="tel:2255216264">
                <Phone className="mr-2 h-5 w-5" />
                (225) 521-6264
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/** Legacy page for a service that is not offered: explains and links to available options. */
function UnavailableServicePage({ config }: Props) {
  const pagePath = `/${config.slug}`;
  const options = [{ text: "Exterior RV detailing overview", href: RV_HUB_PATH, description: "All exterior RV services and what to send us." }, ...RV_EXTERIOR_LINKS];
  return (
    <Layout>
      <SEOHead title={config.seoTitle ?? config.title} description={config.metaDescription} path={pagePath} noIndex follow />
      <JsonLd data={[
        localBusinessSchema(),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "RV Detailing", path: RV_HUB_PATH },
          { name: "RV Interior", path: pagePath },
        ]),
      ]} />
      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li><Link to={RV_HUB_PATH} className="hover:text-primary transition-colors">RV Detailing</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">RV Interior</li>
        </ol>
      </nav>
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{config.title}</h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{config.intro}</p>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Exterior RV options</h2>
          <ul className="space-y-4">
            {options.map((o) => (
              <li key={o.href}>
                <Link to={o.href} className="text-primary underline underline-offset-4 font-semibold">{o.text}</Link>
                <p className="text-muted-foreground mt-1">{o.description}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg">
            Questions? Call <a href="tel:2255216264" className="text-primary hover:underline">(225) 521-6264</a>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
