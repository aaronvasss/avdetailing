import { Helmet } from "react-helmet-async";

const SITE_URL = "https://avdetailing.net";

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

// Reusable schema generators
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: "AV Detailing",
    description:
      "Premium mobile detailing for cars, boats, RVs, and aircraft in Baton Rouge, Louisiana.",
    url: SITE_URL,
    telephone: "+12252284796",
    email: "aaronvasquez@avdetailingg.com",
    areaServed: [
      { "@type": "State", name: "Louisiana" },
      { "@type": "City", name: "Baton Rouge", addressRegion: "LA" },
      { "@type": "City", name: "Prairieville", addressRegion: "LA" },
      { "@type": "City", name: "Gonzales", addressRegion: "LA" },
      { "@type": "City", name: "Denham Springs", addressRegion: "LA" },
      { "@type": "City", name: "Central", addressRegion: "LA" },
      { "@type": "City", name: "Zachary", addressRegion: "LA" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Baton Rouge",
      addressRegion: "LA",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 30.4515,
      longitude: -91.1871,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "85",
      bestRating: "5",
    },
    priceRange: "$$",
    openingHours: "Mo-Sa 08:00-18:00",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    sameAs: [
      "https://www.instagram.com/avdetailing",
      "https://www.facebook.com/avdetailing",
    ],
    image: `${SITE_URL}/favicon.png`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Auto Detailing Services",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Car Detailing" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ceramic Coating" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Paint Correction" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Boat Detailing" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "RV Detailing" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Aircraft Detailing" } },
      ],
    },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function serviceSchema(
  name: string,
  description: string,
  path: string,
  priceRange?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: {
      "@type": "City",
      name: "Baton Rouge",
      addressRegion: "LA",
    },
    ...(priceRange && { priceRange }),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
