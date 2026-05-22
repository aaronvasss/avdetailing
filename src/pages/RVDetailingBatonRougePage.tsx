import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/rv-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "RV Detailing",
  name: "RV Detailing in Baton Rouge, LA",
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
  areaServed: ["Baton Rouge", "Denham Springs", "Walker", "Gonzales", "Prairieville"],
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

export default function RVDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="RV Detailing in Baton Rouge, LA"
        description="Mobile RV detailing in Baton Rouge — oxidation removal, ceramic coating, roof cleaning, and interior detailing for Class A/B/C motorhomes, fifth wheels & travel trailers."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "RV Detailing in Baton Rouge, LA", path: PAGE_PATH },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            RV Detailing in Baton Rouge, LA
          </li>
        </ol>
      </nav>


      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            RV Detailing in Baton Rouge, LA
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            AV Detailing provides professional mobile RV detailing throughout Greater Baton Rouge and surrounding
            Louisiana parishes — we come to your driveway, storage facility, or campsite fully equipped. Louisiana is
            one of the harshest climates in the country for RVs: intense UV causes rapid oxidation, high humidity
            breeds mold and black streaks, and frequent rain creates hard water staining on roofs and sidewalls. All
            of these problems get worse fast without professional treatment. The{" "}
            <a
              href="https://www.rvia.org/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              RV Industry Association
            </a>{" "}
            recommends regular professional cleaning and surface protection as essential maintenance for preserving
            an RV's structural integrity and resale value. AV Detailing serves Baton Rouge, Denham Springs, Walker,
            Gonzales, Prairieville, and all surrounding areas.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <ServiceSection title="Mobile RV Detailing in Baton Rouge" href="/mobile-rv-detailing-baton-rouge">
            We bring our complete RV detailing setup directly to wherever your RV is parked — no hauling, no towing a
            large rig across Baton Rouge. Our{" "}
            <Link to="/mobile-rv-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              mobile RV detailing service in Baton Rouge
            </Link>{" "}
            handles Class A, B, and C motorhomes, fifth wheels, travel trailers, and toy haulers on-site at your
            home, storage unit, or campground anywhere in the Greater Baton Rouge area.
          </ServiceSection>

          <ServiceSection title="RV Oxidation Removal in Baton Rouge" href="/rv-oxidation-removal-baton-rouge">
            Chalky, dull, faded fiberglass is the most common and damaging effect of Louisiana's UV on RVs. Left
            untreated, oxidation permanently damages your RV's gelcoat and significantly drops its resale value. Our
            professional compounding and machine polishing process reverses years of sun damage. Our{" "}
            <Link to="/rv-oxidation-removal-baton-rouge" className="text-primary underline hover:text-primary/80">
              RV oxidation removal service in Baton Rouge
            </Link>{" "}
            restores your RV's exterior to its original finish.
          </ServiceSection>

          <ServiceSection title="RV Interior Detailing in Baton Rouge" href="/rv-interior-detailing-baton-rouge">
            An RV interior endures heavy use — cooking smells, pet odors, humidity, dust, and road grime all
            accumulate and worsen in Louisiana's climate. Our RV interior detailing covers deep vacuuming, kitchen
            and bathroom sanitization, carpet and upholstery shampooing, odor treatment, window cleaning, and full
            surface wipe-down throughout the cabin. Restore your living space with our{" "}
            <Link to="/rv-interior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              RV interior detailing service in Baton Rouge
            </Link>
            .
          </ServiceSection>

          <ServiceSection title="RV Ceramic Coating in Baton Rouge" href="/rv-ceramic-coating-baton-rouge">
            Applying System X ceramic coating to your RV creates a hard hydrophobic protective layer that defends
            against UV rays, oxidation, water spots, black streaks, bird droppings, and road grime — all critical
            threats to your RV's finish in Louisiana. It also dramatically reduces cleaning time after every trip.
            Protect your investment with our{" "}
            <Link to="/rv-ceramic-coating-baton-rouge" className="text-primary underline hover:text-primary/80">
              RV ceramic coating service in Baton Rouge
            </Link>
            .
          </ServiceSection>

          <ServiceSection title="RV Roof Cleaning in Baton Rouge" href="/rv-roof-cleaning-baton-rouge">
            RV roofs are ignored until they leak — but in Louisiana's rainfall and humidity, mold, algae, and black
            streak buildup on rubber and fiberglass roofs happens fast and causes real structural damage. Our
            technicians safely clean EPDM, TPO, fiberglass, and aluminum roof types. Schedule our{" "}
            <Link to="/rv-roof-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
              RV roof cleaning service in Baton Rouge
            </Link>{" "}
            before those issues become expensive repairs.
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
