import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Car,
  Shield,
  Sparkles,
  Sofa,
  Droplets,
  Lightbulb,
  Wind,
  PawPrint,
  Wrench,
  MapPin,
  ArrowRight,
} from "lucide-react";
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

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  linkText: string;
  children: React.ReactNode;
}

function ServiceCard({ icon, title, href, linkText, children }: ServiceCardProps) {
  return (
    <article className="group relative flex flex-col h-full rounded-2xl border border-border bg-card p-6 md:p-7 transition-all hover:border-primary/50 hover:shadow-lg">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="text-xl md:text-2xl font-bold mb-3 leading-tight">
        <Link to={href} className="text-foreground hover:text-primary transition-colors">
          {title}
        </Link>
      </h2>
      <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-5 flex-1">
        {children}
      </p>
      <Link
        to={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
      >
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

const SERVICE_AREAS = [
  "Highland Road",
  "Shenandoah",
  "Gonzales",
  "Prairieville",
  "Central Baton Rouge",
  "Walker",
  "Denham Springs",
];

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

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative container-custom max-w-5xl py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
            <Car className="h-3.5 w-3.5" />
            Mobile Detailing • Baton Rouge, LA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Car Detailing in Baton Rouge, LA
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
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

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-12 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Our Services</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Tap any service to see full details, pricing, and what's included.
            </p>
          </div>

          <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              icon={<Car className="h-6 w-6" />}
              title="Mobile Car Detailing in Baton Rouge"
              href="/mobile-car-detailing-baton-rouge"
              linkText="View mobile detailing"
            >
              Most detailing shops make you drive across Baton Rouge traffic and wait. AV Detailing eliminates that
              entirely — our{" "}
              <Link to="/mobile-car-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
                mobile car detailing service in Baton Rouge
              </Link>{" "}
              brings professional equipment, System X products, and trained technicians directly to your location
              across Highland Road, Shenandoah, Gonzales, Central Baton Rouge, and all surrounding areas. Same results
              as a premium shop, delivered to your door.
            </ServiceCard>

            <ServiceCard
              icon={<Shield className="h-6 w-6" />}
              title="Ceramic Coating in Baton Rouge"
              href="/ceramic-coating-baton-rouge"
              linkText="View ceramic coating"
            >
              Louisiana's UV index regularly exceeds 10 in summer — that level of sun exposure degrades standard wax
              and sealants within weeks. System X ceramic coating bonds directly to your vehicle's clear coat and
              delivers 3-year, 5-year, or 10-year protection against UV damage, water spots, oxidation, bird droppings,
              and chemical stains. Our{" "}
              <Link to="/ceramic-coating-baton-rouge" className="text-primary underline hover:text-primary/80">
                System X ceramic coating service in Baton Rouge
              </Link>{" "}
              is the most advanced paint protection available and the smartest long-term investment for any vehicle in
              Louisiana.
            </ServiceCard>

            <ServiceCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Paint Correction in Baton Rouge"
              href="/paint-correction-baton-rouge"
              linkText="View paint correction"
            >
              Swirl marks, water spots, light scratches, and oxidation build up on every vehicle driven on Baton Rouge
              roads. Our professional multi-stage machine polishing process removes those defects and restores your
              paint to a deep, mirror-like finish. Paint correction is also the required preparation step before any
              ceramic coating application. Discover how our{" "}
              <Link to="/paint-correction-baton-rouge" className="text-primary underline hover:text-primary/80">
                paint correction service in Baton Rouge
              </Link>{" "}
              completely transforms your vehicle's appearance.
            </ServiceCard>

            <ServiceCard
              icon={<Sofa className="h-6 w-6" />}
              title="Interior Car Detailing in Baton Rouge"
              href="/interior-detailing-baton-rouge"
              linkText="View interior detailing"
            >
              Baton Rouge summers turn car interiors into bacteria and mold environments — heat, humidity, food spills,
              and pet use compound fast without regular professional cleaning. Our interior service covers deep vacuum,
              dashboard and console treatment, door panels, leather conditioning, seat shampooing, carpet deep clean,
              and odor elimination — all on-site at your location. See what's included in our{" "}
              <Link to="/interior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
                interior car detailing service in Baton Rouge
              </Link>
              .
            </ServiceCard>

            <ServiceCard
              icon={<Droplets className="h-6 w-6" />}
              title="Exterior Car Detailing in Baton Rouge"
              href="/exterior-detailing-baton-rouge"
              linkText="View exterior detailing"
            >
              Highway 190, Highland Road, I-10, and Baton Rouge's industrial corridors coat your vehicle in tar, road
              grime, industrial fallout, and bugs that a regular car wash never fully removes. Our exterior detail
              includes hand wash, clay bar treatment, decontamination, polish, and full surface protection for paint,
              wheels, tires, trim, and glass. Explore our{" "}
              <Link to="/exterior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
                exterior car detailing service in Baton Rouge
              </Link>
              .
            </ServiceCard>

            <ServiceCard
              icon={<Lightbulb className="h-6 w-6" />}
              title="Headlight Restoration in Baton Rouge"
              href="/headlight-restoration-baton-rouge"
              linkText="View headlight restoration"
            >
              Louisiana's UV exposure yellows and oxidizes headlight lenses faster than almost any other state. Foggy
              headlights reduce nighttime visibility by up to 80% and make your vehicle look poorly maintained. Our
              process sands, compounds, polishes, and seals your lenses back to full clarity — at a fraction of
              replacement cost. Book our{" "}
              <Link to="/headlight-restoration-baton-rouge" className="text-primary underline hover:text-primary/80">
                headlight restoration service in Baton Rouge
              </Link>{" "}
              standalone or added to any detailing package.
            </ServiceCard>

            <ServiceCard
              icon={<Wind className="h-6 w-6" />}
              title="Odor Removal in Baton Rouge"
              href="/odor-removal-baton-rouge"
              linkText="View odor removal"
            >
              Smoke, mildew, pets, and food odors embed into fabric, carpet, and foam — and Louisiana's humidity makes
              them significantly worse over time. AV Detailing uses professional ozone and enzyme treatments that
              permanently neutralize odors at the source rather than masking them. Eliminate unwanted smells for good
              with our{" "}
              <Link to="/odor-removal-baton-rouge" className="text-primary underline hover:text-primary/80">
                car odor removal service in Baton Rouge
              </Link>
              .
            </ServiceCard>

            <ServiceCard
              icon={<PawPrint className="h-6 w-6" />}
              title="Pet Hair Removal in Baton Rouge"
              href="/pet-hair-removal-baton-rouge"
              linkText="View pet hair removal"
            >
              Pet hair embeds deep into carpet fibers and seat upholstery and resists ordinary vacuuming — especially
              in the static-heavy environment of a hot Louisiana vehicle. AV Detailing uses specialized extraction
              tools to remove pet hair from every interior surface. Our{" "}
              <Link to="/pet-hair-removal-baton-rouge" className="text-primary underline hover:text-primary/80">
                pet hair removal service in Baton Rouge
              </Link>{" "}
              restores your interior to a completely clean, hair-free finish.
            </ServiceCard>

            <ServiceCard
              icon={<Wrench className="h-6 w-6" />}
              title="Engine Bay Cleaning in Baton Rouge"
              href="/engine-bay-cleaning-baton-rouge"
              linkText="View engine bay cleaning"
            >
              Louisiana heat accelerates grease and oil buildup in engine bays, making leaks harder to detect and
              components harder to access during maintenance. Our controlled steam and professional degreaser process
              safely cleans your engine bay without damaging electronics or components. Add our{" "}
              <Link to="/engine-bay-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
                engine bay cleaning service in Baton Rouge
              </Link>{" "}
              to any detailing package.
            </ServiceCard>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
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
