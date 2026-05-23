import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { ServiceLandingConfig, SERVICE_AREAS_TEXT } from "@/data/serviceLandingPages";

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
  const pagePath = `/${config.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: config.serviceType,
    name: config.title,
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
      { "@type": "City", name: "Central Baton Rouge", geo: { "@type": "GeoCoordinates", latitude: 30.5527, longitude: -91.0357 } },
      { "@type": "City", name: "Zachary", geo: { "@type": "GeoCoordinates", latitude: 30.6491, longitude: -91.1565 } },
      { "@type": "Place", name: "Old Jefferson", geo: { "@type": "GeoCoordinates", latitude: 30.4321, longitude: -91.1543 } },
      { "@type": "Place", name: "Highland Lakes", geo: { "@type": "GeoCoordinates", latitude: 30.4102, longitude: -91.0987 } },
    ],
    url: `${SITE_URL}${pagePath}`,
  };

  return (
    <Layout>
      <SEOHead title={config.title} description={config.metaDescription} path={pagePath} />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/car-detailing-baton-rouge" },
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
            <Link to="/car-detailing-baton-rouge" className="hover:text-primary transition-colors">
              Services
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
            How Our {config.serviceType} Works
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
            Why Baton Rouge Customers Choose AV Detailing for {config.serviceType}
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

      {/* Service Areas */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Service Areas</h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {SERVICE_AREAS_TEXT}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl text-center">
          <p className="text-xl md:text-2xl font-semibold mb-6">
            Call{" "}
            <a href="tel:+12255216264" className="text-primary hover:underline">
              (225) 521-6264
            </a>{" "}
            or book online today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        </div>
      </section>
    </Layout>
  );
}
