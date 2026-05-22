import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

const SITE_URL = "https://avdetailing.net";
const PAGE_PATH = "/boat-detailing-baton-rouge";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Boat Detailing",
  name: "Boat Detailing in Baton Rouge, LA",
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
  areaServed: ["Baton Rouge", "False River", "Blind River", "Mississippi River"],
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

export default function BoatDetailingBatonRougePage() {
  return (
    <Layout>
      <SEOHead
        title="Boat Detailing in Baton Rouge, LA"
        description="Mobile boat detailing in Baton Rouge — ceramic coating, gelcoat restoration, hull cleaning, and pontoon detailing on Louisiana waterways. We come to your marina, launch, or driveway."
        path={PAGE_PATH}
      />
      <JsonLd data={[
        localBusinessSchema(),
        serviceSchema,
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Boat Detailing in Baton Rouge, LA", path: PAGE_PATH },
        ]),
      ]} />

      <nav aria-label="Breadcrumb" className="container-custom pt-6 pb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium" aria-current="page">
            Boat Detailing in Baton Rouge, LA
          </li>
        </ol>
      </nav>


      <section className="section-padding bg-card">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Boat Detailing in Baton Rouge, LA
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            AV Detailing provides professional mobile boat detailing throughout the Baton Rouge area and surrounding
            Louisiana waterways — we come to your marina, launch, storage facility, or driveway fully equipped.
            Louisiana has more boats per capita than almost any other state, and Baton Rouge area waterways including
            the Mississippi River, False River, Blind River, and surrounding lakes mean serious UV, algae, and water
            exposure for every vessel. Regular professional detailing is essential to protect your boat's finish,
            value, and performance. The{" "}
            <a
              href="https://www.wlf.louisiana.gov/page/boating"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Louisiana Department of Wildlife and Fisheries
            </a>{" "}
            encourages all Louisiana boat owners to keep vessels properly maintained for safety and longevity on the
            water.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <ServiceSection title="Mobile Boat Detailing in Baton Rouge" href="/mobile-boat-detailing-baton-rouge">
            AV Detailing brings professional boat detailing directly to your marina or storage location anywhere in
            the Baton Rouge area. No trailering required. Our{" "}
            <Link to="/mobile-boat-detailing-baton-rouge" className="text-primary underline hover:text-primary/80">
              mobile boat detailing service in Baton Rouge
            </Link>{" "}
            is fully equipped for all vessel types and sizes — fishing boats, bass boats, ski boats, pontoons,
            cruisers, and yachts — serviced on-site wherever your boat lives.
          </ServiceSection>

          <ServiceSection title="Boat Ceramic Coating in Baton Rouge" href="/boat-ceramic-coating-baton-rouge">
            System X marine ceramic coating creates a durable protective layer on your boat's gelcoat and paint that
            resists UV damage, oxidation, water staining, and algae growth — all major threats on Louisiana
            waterways. It also dramatically reduces cleaning time after every outing. Learn more about our{" "}
            <Link to="/boat-ceramic-coating-baton-rouge" className="text-primary underline hover:text-primary/80">
              boat ceramic coating service in Baton Rouge
            </Link>{" "}
            and protect your vessel long-term.
          </ServiceSection>

          <ServiceSection title="Gelcoat Restoration in Baton Rouge" href="/gelcoat-restoration-baton-rouge">
            Oxidized, chalky, faded gelcoat is one of the most common problems for boats on Louisiana waters — UV and
            humidity work fast. Our professional compounding, machine polishing, and sealant application restores
            your boat's original gloss and color depth. Our{" "}
            <Link to="/gelcoat-restoration-baton-rouge" className="text-primary underline hover:text-primary/80">
              gelcoat restoration service in Baton Rouge
            </Link>{" "}
            is the most popular service we perform on boats over 5 years old.
          </ServiceSection>

          <ServiceSection title="Hull Cleaning in Baton Rouge" href="/hull-cleaning-baton-rouge">
            Waterline scum, algae, hard water deposits, and oxidation build up on your hull after every outing on
            Baton Rouge area rivers and lakes. Regular cleaning prevents permanent staining and preserves your
            vessel's performance and appearance. AV Detailing's{" "}
            <Link to="/hull-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
              hull cleaning service in Baton Rouge
            </Link>{" "}
            removes all surface contamination from fiberglass, aluminum, and painted hulls.
          </ServiceSection>

          <ServiceSection title="Pontoon Cleaning in Baton Rouge" href="/pontoon-cleaning-baton-rouge">
            Pontoon logs collect oxidation, water stains, and algae that standard hosing cannot touch. AV Detailing
            specializes in full pontoon detailing including aluminum log polishing, deck cleaning, vinyl seat
            restoration, and bimini top treatment. Our{" "}
            <Link to="/pontoon-cleaning-baton-rouge" className="text-primary underline hover:text-primary/80">
              pontoon cleaning service in Baton Rouge
            </Link>{" "}
            keeps your pontoon looking sharp all season long on Baton Rouge area lakes and rivers.
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
