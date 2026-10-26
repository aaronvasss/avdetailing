import { usePricing, formatPrice, CAR_PAGE_DISPLAY_FROM } from "@/lib/pricing";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { CAR_HUB_SEO } from "@/lib/car-seo";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/car-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Car Detailing",
  name: "Car Detailing in Baton Rouge, LA",
  provider: { "@id": `${SITE_URL}/#business` },
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


export default function CarDetailingBatonRougePage() {
  const pricing = usePricing();
  return (
    <Layout>
      <SEOHead
        title={CAR_HUB_SEO.title}
        description={CAR_HUB_SEO.description}
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Car Detailing", path: PAGE_PATH },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">Car Detailing</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative container-custom max-w-5xl py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
            {CAR_HUB_SEO.h1}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-2xl mb-6">
            {CAR_HUB_SEO.intro}
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="pt-8 md:pt-10 pb-16 md:pb-20 bg-background">
        <div className="container-custom max-w-6xl">
          <div className="mb-10 md:mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Detailing Packages</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Choose the level of care your vehicle deserves. For exact pricing on SUVs and trucks, call{" "}
              <a href="tel:2255216264" className="text-primary hover:underline">(225) 521-6264</a>.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-3 lg:items-stretch lg:gap-6">
            {/* Basic — Black */}
            <article className="order-2 lg:order-1 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-[hsl(0_0%_6%)] text-white border border-white/10 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-2">Essentials</span>
              <h3 className="text-2xl font-bold mb-1.5">Basic Package</h3>
              <p className="text-sm text-white/65 mb-4 leading-relaxed">
                Perfect for regular maintenance. Keeps your vehicle clean and fresh between full details.
              </p>
              <div className="mb-5 pb-5 border-b border-white/10">
                <span className="text-3xl font-bold">from {formatPrice(CAR_PAGE_DISPLAY_FROM.basic)}</span>
                <span className="block text-xs font-normal text-white/50 mt-1">Sedans & coupes</span>
              </div>
              <ul className="text-sm text-white/85 space-y-2.5 mb-7 flex-1">
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Light interior vacuum</span></li>
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Interior wipe down — dashboard, console, door panels</span></li>
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Hand wash & dry</span></li>
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Wheel cleaning</span></li>
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Tire shine</span></li>
                <li className="flex gap-2"><span className="text-white/70 mt-0.5">•</span><span>Exterior windows cleaned</span></li>
              </ul>
              <Button asChild variant="outline" className="w-full bg-white text-black hover:bg-white/90 border-white">
                <Link to="/book?service=car&package=basic">Book Now</Link>
              </Button>
            </article>

            {/* Gold — Center, Elevated */}
            <article className="order-1 lg:order-2 flex flex-col h-full rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[hsl(45_70%_14%)] via-[hsl(42_60%_9%)] to-[hsl(40_55%_5%)] border-2 border-[hsl(45_85%_55%)] shadow-2xl lg:scale-[1.04] lg:-my-2 relative mt-4 lg:mt-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_55%)] font-semibold px-3 py-1 shadow-lg whitespace-nowrap">
                  ★ Most Popular
                </Badge>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(45_85%_65%)] mb-2">Signature</span>
              <h3 className="text-2xl font-bold mb-1.5 text-white">Gold Package</h3>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                The complete detail. Every surface treated inside and out — the closest thing to a showroom finish.
              </p>
              <div className="mb-5 pb-5 border-b border-[hsl(45_85%_55%)]/25">
                <span className="text-3xl font-bold text-[hsl(45_85%_65%)]">from {pricing.label(pricing.packageFrom("car", "Gold Package"))}</span>
                <span className="block text-xs font-normal text-white/60 mt-1">Sedans & coupes</span>
              </div>
              <ul className="text-sm text-white/90 space-y-2.5 mb-7 flex-1">
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span className="font-semibold">Everything in Silver</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Seat & upholstery shampooing</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Leather cleaning & conditioning</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Carpet deep clean</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Wax application — paint protection</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Meticulous wheel detail & tire shine</span></li>
                <li className="flex gap-2"><span className="text-[hsl(45_85%_65%)] mt-0.5">✓</span><span>Door jamb cleaning</span></li>
              </ul>
              <Button asChild className="w-full bg-[hsl(45_85%_55%)] text-black hover:bg-[hsl(45_85%_60%)] font-semibold shadow-md">
                <Link to="/book?service=car&package=gold">Book Now</Link>
              </Button>
            </article>

            {/* Silver */}
            <article className="order-3 lg:order-3 flex flex-col h-full rounded-2xl p-6 sm:p-7 bg-gradient-to-b from-[hsl(0_0%_97%)] to-[hsl(0_0%_86%)] text-[hsl(0_0%_10%)] border border-[hsl(0_0%_72%)] shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(0_0%_35%)] mb-2">Daily Driver</span>
              <h3 className="text-2xl font-bold mb-1.5">Silver Package</h3>
              <p className="text-sm text-[hsl(0_0%_30%)] mb-4 leading-relaxed">
                A thorough interior and exterior clean for vehicles that see daily use.
              </p>
              <div className="mb-5 pb-5 border-b border-[hsl(0_0%_60%)]/40">
                <span className="text-3xl font-bold">from {pricing.label(pricing.packageFrom("car", "Silver Package"))}</span>
                <span className="block text-xs font-normal text-[hsl(0_0%_35%)] mt-1">Sedans & coupes</span>
              </div>
              <ul className="text-sm text-[hsl(0_0%_20%)] space-y-2.5 mb-3 flex-1">
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Deep vacuum — seats, carpets, mats, trunk</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Console, cup holders & door panel detail</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Dashboard & trim cleaning</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Hand wash & dry</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Full exterior wash</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Wheel & tire cleaning</span></li>
                <li className="flex gap-2"><span className="text-[hsl(0_0%_45%)] mt-0.5">•</span><span>Exterior windows cleaned</span></li>
              </ul>
              <p className="text-xs italic text-[hsl(0_0%_35%)] mb-5">Seat shampoo not included — upgrade to Gold.</p>
              <Button asChild className="w-full bg-black text-white hover:bg-black/85">
                <Link to="/book?service=car&package=silver">Book Now</Link>
              </Button>
            </article>
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
              See how mobile visits work — booking, the 30-minute arrival window and what to have ready — in our{" "}
              <Link to="/mobile-car-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">mobile car detailing guide for Baton Rouge</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Shield className="h-6 w-6" />}
              title="Ceramic Coating in Baton Rouge"
              href="/ceramic-coating-baton-rouge"
              linkText="View ceramic coating"
            >
              Ceramic coating adds a protective layer to your paint and is usually applied after paint correction. See the available tiers and pricing on our{" "}
              <Link to="/ceramic-coating-baton-rouge" className="text-primary underline hover:text-primary/80">ceramic coating page</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Paint Correction in Baton Rouge"
              href="/paint-correction-baton-rouge"
              linkText="View paint correction"
            >
              Machine polishing can reduce or remove swirls, water spots and light scratches. We assess your paint and recommend a 1-step, 2-step or 3-step option. Learn more about{" "}
              <Link to="/paint-correction-baton-rouge" className="text-primary underline hover:text-primary/80">paint correction in Baton Rouge</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Sofa className="h-6 w-6" />}
              title="Interior Car Detailing in Baton Rouge"
              href="/interior-detailing-baton-rouge"
              linkText="View interior detailing"
            >
              Need seat shampoo or a deeper cabin clean? Silver adds a deep vacuum and trim cleaning; seat and upholstery shampoo, leather conditioning and carpet deep cleaning are in Gold. Compare options on our{" "}
              <Link to="/interior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">interior car detailing page</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Droplets className="h-6 w-6" />}
              title="Exterior Car Detailing in Baton Rouge"
              href="/exterior-detailing-baton-rouge"
              linkText="View exterior detailing"
            >
              Hand wash and dry, wheels and tires, tire shine and exterior windows are in every package, and Exterior Only is available for washes. Explore{" "}
              <Link to="/exterior-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">exterior car detailing in Baton Rouge</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Lightbulb className="h-6 w-6" />}
              title="Headlight Restoration in Baton Rouge"
              href="/headlight-restoration-baton-rouge"
              linkText="View headlight restoration"
            >
              We check cloudy or yellowed lenses before restoring them. Add{" "}
              <Link to="/headlight-restoration-baton-rouge" className="text-primary underline hover:text-primary/80">headlight restoration</Link>{" "}to any car detailing booking.
            </ServiceCard>

            <ServiceCard
              icon={<Wind className="h-6 w-6" />}
              title="Odor Removal in Baton Rouge"
              href="/odor-removal-baton-rouge"
              linkText="View odor removal"
            >
              Tell us what the smell is and where it comes from, and we will recommend an interior package; results depend on the source. Learn about{" "}
              <Link to="/odor-removal-baton-rouge" className="text-primary underline hover:text-primary/80">car odor removal in Baton Rouge</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<PawPrint className="h-6 w-6" />}
              title="Pet Hair Removal in Baton Rouge"
              href="/pet-hair-removal-baton-rouge"
              linkText="View pet hair removal"
            >
              Embedded pet hair takes extra time to remove from carpet and upholstery. Read about{" "}
              <Link to="/pet-hair-removal-baton-rouge" className="text-primary underline hover:text-primary/80">pet hair removal in Baton Rouge</Link>.
            </ServiceCard>

            <ServiceCard
              icon={<Wrench className="h-6 w-6" />}
              title="Engine Bay Cleaning in Baton Rouge"
              href="/engine-bay-cleaning-baton-rouge"
              linkText="View engine bay cleaning"
            >
              A careful clean and dressing of the engine compartment. Add{" "}
              <Link to="/engine-bay-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">engine bay cleaning</Link>{" "}to any car detailing booking.
            </ServiceCard>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-custom max-w-4xl text-center">
          <p className="text-xl md:text-2xl font-semibold mb-6">
            Ready to book? Call{" "}
            <a href="tel:2255216264" className="text-primary hover:underline">
              (225) 521-6264
            </a>{" "}
            or book online today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to="/book">Book Online</Link>
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
