import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { LocationPageConfig } from "@/data/locationPages";

const SITE_URL = "https://avdetailing.net";

interface Props {
  config: LocationPageConfig;
}

function renderIntro(config: LocationPageConfig) {
  const parts = config.intro.split(/(\{\{l1\}\}|\{\{l2\}\})/g);
  return parts.map((part, i) => {
    if (part === "{{l1}}") {
      return (
        <a key={i} href={config.link1.url} target="_blank" rel="nofollow noopener noreferrer" className="text-primary underline hover:text-primary/80">
          {config.link1.text}
        </a>
      );
    }
    if (part === "{{l2}}") {
      return (
        <a key={i} href={config.link2.url} target="_blank" rel="nofollow noopener noreferrer" className="text-primary underline hover:text-primary/80">
          {config.link2.text}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function LocationLandingTemplate({ config }: Props) {
  const pagePath = `/${config.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Mobile Car Detailing",
    name: config.titleH1,
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
    areaServed: { "@type": "Place", name: config.city },
    url: `${SITE_URL}${pagePath}`,
  };

  return (
    <Layout>
      <SEOHead title={`${config.titleTag} | AV Detailing`} description={config.metaDescription} path={pagePath} />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
          { name: config.titleH1, path: `/${config.slug}` },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li>
            <Link to="/service-areas" className="hover:text-primary transition-colors">
              Service Areas
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            {config.titleH1}
          </li>
        </ol>
      </nav>


      {/* H1 + Intro */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {config.titleH1}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {renderIntro(config)}
          </p>
        </div>
      </section>

      {/* Services Offered */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Mobile Detailing Services Available in {config.city}
          </h2>
          <ul className="space-y-5">
            {config.services.map((s, i) => (
              <li key={i}>
                <h3 className="text-xl font-semibold mb-1">{s.name}</h3>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  {s.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Why {config.city} Customers Choose AV Detailing
          </h2>
          <ul className="space-y-4">
            {config.whyChoose.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 text-primary font-bold text-xl leading-none mt-1">✓</span>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Neighborhoods and Areas We Serve in {config.city}
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            {config.neighborhoods}
          </p>
        </div>
      </section>

      {/* Surrounding Areas */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Serving {config.city} and All Surrounding Areas
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            Beyond {config.city}, AV Detailing serves all of Greater Baton Rouge — from{" "}
            <Link to="/car-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              car detailing across Baton Rouge
            </Link>{" "}
            to specialized{" "}
            <Link to="/rv-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              RV detailing
            </Link>
            ,{" "}
            <Link to="/boat-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              boat detailing
            </Link>
            , and{" "}
            <Link to="/aircraft-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              aircraft detailing
            </Link>{" "}
            throughout the region. Whether you're in {config.city} or anywhere in the surrounding parishes, our mobile team comes to you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
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
