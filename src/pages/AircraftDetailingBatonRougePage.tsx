import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema } from "@/components/seo/JsonLd";

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
    "Baton Rouge Metropolitan Airport (BTR)",
    "Lafayette Regional Airport (LFT)",
    "Louis Armstrong New Orleans International Airport (MSY)",
    "New Orleans Lakefront Airport (NEW)",
  ],
  url: `${SITE_URL}${PAGE_PATH}`,
};

interface SectionProps {
  title: string;
  href: string;
  children: React.ReactNode;
}

function ServiceSection({ title, href, children }: SectionProps) {
  return (
    <article className="mb-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        <Link to={href} className="text-foreground hover:text-primary transition-colors">
          {title}
        </Link>
      </h2>
      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{children}</p>
    </article>
  );
}

export default function AircraftDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="Aircraft Detailing in Baton Rouge, Lafayette & New Orleans, LA"
        description="Professional aircraft cleaning & detailing at BTR, LFT, MSY, NEW and South Louisiana general aviation airports. Aviation-safe products for painted aluminum, composites & plexiglass."
        path={PAGE_PATH}
      />
      <JsonLd data={[localBusinessSchema(), serviceSchema]} />

      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Aircraft Detailing Serving Baton Rouge, Lafayette & New Orleans Airports
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            AV Detailing provides professional aircraft cleaning and detailing for private, charter, and corporate
            aircraft throughout South Louisiana. We service aircraft at Baton Rouge Metropolitan Airport (BTR),
            Lafayette Regional Airport (LFT), Louis Armstrong New Orleans International Airport (MSY), New Orleans
            Lakefront Airport (NEW), and surrounding general aviation fields across the region. All work is performed
            using only aviation-safe products and procedures by trained detailing professionals who understand the
            care required for painted aluminum, composite surfaces, and aircraft plexiglass. South Louisiana's
            coastal humidity, salt air, UV, and industrial fallout make regular aircraft cleaning critical for
            corrosion prevention and surface longevity. According to the{" "}
            <a
              href="https://www.faa.gov/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Federal Aviation Administration
            </a>
            , regular cleaning and surface maintenance is an essential component of overall aircraft care. For
            airport-specific information, visit{" "}
            <a
              href="https://www.flybtr.com/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Baton Rouge Metropolitan Airport
            </a>
            .
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <ServiceSection title="Aircraft Exterior Cleaning" href="/aircraft-cleaning-baton-rouge">
            Regular exterior cleaning removes exhaust residue, bug deposits, bird droppings, salt deposits, and
            environmental contamination that damage your aircraft's finish and can accelerate corrosion. AV Detailing
            uses only aviation-approved cleaning solutions safe for painted aluminum, composite panels, and
            plexiglass. Book our{" "}
            <Link to="/aircraft-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
              aircraft exterior cleaning service
            </Link>{" "}
            at BTR, LFT, MSY, NEW, or any South Louisiana general aviation airport.
          </ServiceSection>

          <ServiceSection title="Aircraft Interior Detailing" href="/aircraft-interior-detailing-baton-rouge">
            Your aircraft cabin reflects your standards as a pilot or operator. AV Detailing's aircraft interior
            service covers seat cleaning and conditioning, carpet vacuuming and shampooing, instrument shroud and
            panel wipe-down, window and door seal cleaning, and odor elimination — all performed with products
            specifically formulated and safe for aviation interiors. Schedule our{" "}
            <Link
              to="/aircraft-interior-detailing-baton-rouge"
              className="text-primary underline hover:text-primary/80"
            >
              aircraft interior detailing service
            </Link>{" "}
            at your home airport.
          </ServiceSection>

          <ServiceSection title="Aircraft Paint Protection" href="/aircraft-paint-protection-baton-rouge">
            South Louisiana's UV, humidity, and coastal salt air degrade aircraft paint and aluminum surfaces faster
            than most regions in the country. Our{" "}
            <Link
              to="/aircraft-paint-protection-baton-rouge"
              className="text-primary underline hover:text-primary/80"
            >
              aircraft paint protection service
            </Link>{" "}
            applies professional-grade aviation sealant and protective coatings that shield your aircraft's exterior,
            slow corrosion, reduce cleaning time between services, and preserve your aircraft's resale value.
          </ServiceSection>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl text-center">
          <p className="text-xl md:text-2xl font-semibold mb-6">
            Ready to book? Call{" "}
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
