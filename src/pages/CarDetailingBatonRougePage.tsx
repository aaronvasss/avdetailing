import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/car-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Car Detailing",
  name: "Car Detailing in Baton Rouge, LA",
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
    { "@type": "City", name: "Central", geo: { "@type": "GeoCoordinates", latitude: 30.5527, longitude: -91.0357 } },
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
      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
        {children}
      </p>
    </article>
  );
}

export default function CarDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="Car Detailing in Baton Rouge, LA"
        description="Baton Rouge's premier mobile car detailing — System X ceramic coating, paint correction & interior detailing across Baton Rouge & surrounding parishes."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Car Detailing in Baton Rouge, LA", path: PAGE_PATH },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            Car Detailing in Baton Rouge, LA
          </li>
        </ol>
      </nav>


      {/* Hero / Intro */}
      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Car Detailing in Baton Rouge, LA
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            AV Detailing is Baton Rouge's premier mobile car detailing service — we come directly to your home,
            office, or anywhere across the Greater Baton Rouge area including Highland Road, Shenandoah, Gonzales,
            Prairieville, Central Baton Rouge, Walker, and Denham Springs. No drop-off required. Our packages are
            built for every vehicle type and every budget, from a quick exterior wash to a full paint correction
            with System X ceramic coating. Louisiana's combination of intense UV, humidity, road tar, and industrial
            fallout makes professional detailing not just cosmetic — it's vehicle preservation. According to{" "}
            <a
              href="https://www.consumerreports.org/cars/car-maintenance/how-to-maintain-your-cars-value-a1145789541/"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Consumer Reports
            </a>
            , regular professional detailing is one of the most effective ways to protect your vehicle's long-term
            value, especially in high-humidity climates.
          </p>
        </div>
      </section>

      {/* Service Sections */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <ServiceSection title="Mobile Car Detailing in Baton Rouge" href="/mobile-car-detailing-baton-rouge">
            Most detailing shops make you drive across Baton Rouge traffic and wait. AV Detailing eliminates that
            entirely — our{" "}
            <Link to="/mobile-car-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              mobile car detailing service in Baton Rouge
            </Link>{" "}
            brings professional equipment, System X products, and trained technicians directly to your location
            across Highland Road, Shenandoah, Gonzales, Central Baton Rouge, and all surrounding areas. Same results
            as a premium shop, delivered to your door.
          </ServiceSection>

          <ServiceSection title="Ceramic Coating in Baton Rouge" href="/ceramic-coating-baton-rouge">
            Louisiana's UV index regularly exceeds 10 in summer — that level of sun exposure degrades standard wax
            and sealants within weeks. System X ceramic coating bonds directly to your vehicle's clear coat and
            delivers 3-year, 5-year, or 10-year protection against UV damage, water spots, oxidation, bird droppings,
            and chemical stains. Our{" "}
            <Link to="/ceramic-coating-baton-rouge" className="text-primary underline hover:text-primary/80">
              System X ceramic coating service in Baton Rouge
            </Link>{" "}
            is the most advanced paint protection available and the smartest long-term investment for any vehicle in
            Louisiana.
          </ServiceSection>

          <ServiceSection title="Paint Correction in Baton Rouge" href="/paint-correction-baton-rouge">
            Swirl marks, water spots, light scratches, and oxidation build up on every vehicle driven on Baton Rouge
            roads. Our professional multi-stage machine polishing process removes those defects and restores your
            paint to a deep, mirror-like finish. Paint correction is also the required preparation step before any
            ceramic coating application. Discover how our{" "}
            <Link to="/paint-correction-baton-rouge" className="text-primary underline hover:text-primary/80">
              paint correction service in Baton Rouge
            </Link>{" "}
            completely transforms your vehicle's appearance.
          </ServiceSection>

          <ServiceSection title="Interior Car Detailing in Baton Rouge" href="/interior-detailing-baton-rouge">
            Baton Rouge summers turn car interiors into bacteria and mold environments — heat, humidity, food spills,
            and pet use compound fast without regular professional cleaning. Our interior service covers deep vacuum,
            dashboard and console treatment, door panels, leather conditioning, seat shampooing, carpet deep clean,
            and odor elimination — all on-site at your location. See what's included in our{" "}
            <Link to="/interior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              interior car detailing service in Baton Rouge
            </Link>
            .
          </ServiceSection>

          <ServiceSection title="Exterior Car Detailing in Baton Rouge" href="/exterior-detailing-baton-rouge">
            Highway 190, Highland Road, I-10, and Baton Rouge's industrial corridors coat your vehicle in tar, road
            grime, industrial fallout, and bugs that a regular car wash never fully removes. Our exterior detail
            includes hand wash, clay bar treatment, decontamination, polish, and full surface protection for paint,
            wheels, tires, trim, and glass. Explore our{" "}
            <Link to="/exterior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              exterior car detailing service in Baton Rouge
            </Link>
            .
          </ServiceSection>

          <ServiceSection title="Headlight Restoration in Baton Rouge" href="/headlight-restoration-baton-rouge">
            Louisiana's UV exposure yellows and oxidizes headlight lenses faster than almost any other state. Foggy
            headlights reduce nighttime visibility by up to 80% and make your vehicle look poorly maintained. Our
            process sands, compounds, polishes, and seals your lenses back to full clarity — at a fraction of
            replacement cost. Book our{" "}
            <Link to="/headlight-restoration-baton-rouge" className="text-primary underline hover:text-primary/80">
              headlight restoration service in Baton Rouge
            </Link>{" "}
            standalone or added to any detailing package.
          </ServiceSection>

          <ServiceSection title="Odor Removal in Baton Rouge" href="/odor-removal-baton-rouge">
            Smoke, mildew, pets, and food odors embed into fabric, carpet, and foam — and Louisiana's humidity makes
            them significantly worse over time. AV Detailing uses professional ozone and enzyme treatments that
            permanently neutralize odors at the source rather than masking them. Eliminate unwanted smells for good
            with our{" "}
            <Link to="/odor-removal-baton-rouge" className="text-primary underline hover:text-primary/80">
              car odor removal service in Baton Rouge
            </Link>
            .
          </ServiceSection>

          <ServiceSection title="Pet Hair Removal in Baton Rouge" href="/pet-hair-removal-baton-rouge">
            Pet hair embeds deep into carpet fibers and seat upholstery and resists ordinary vacuuming — especially
            in the static-heavy environment of a hot Louisiana vehicle. AV Detailing uses specialized extraction
            tools to remove pet hair from every interior surface. Our{" "}
            <Link to="/pet-hair-removal-baton-rouge" className="text-primary underline hover:text-primary/80">
              pet hair removal service in Baton Rouge
            </Link>{" "}
            restores your interior to a completely clean, hair-free finish.
          </ServiceSection>

          <ServiceSection title="Engine Bay Cleaning in Baton Rouge" href="/engine-bay-cleaning-baton-rouge">
            Louisiana heat accelerates grease and oil buildup in engine bays, making leaks harder to detect and
            components harder to access during maintenance. Our controlled steam and professional degreaser process
            safely cleans your engine bay without damaging electronics or components. Add our{" "}
            <Link to="/engine-bay-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
              engine bay cleaning service in Baton Rouge
            </Link>{" "}
            to any detailing package.
          </ServiceSection>
        </div>
      </section>

      {/* CTA */}
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
