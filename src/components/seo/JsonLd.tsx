import { Helmet } from "react-helmet-async";

const SITE_URL = "https://avdetailing.net";

// Cities served (Baton Rouge metro + surrounding parishes)
const SERVICE_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Baton Rouge", lat: 30.4515, lng: -91.1871 },
  { name: "Prairieville", lat: 30.3057, lng: -90.9784 },
  { name: "Gonzales", lat: 30.2382, lng: -90.9201 },
  { name: "Denham Springs", lat: 30.4855, lng: -90.9559 },
  { name: "Walker", lat: 30.4866, lng: -90.8631 },
  { name: "Livingston", lat: 30.5024, lng: -90.7484 },
  { name: "Central", lat: 30.5527, lng: -91.0357 },
  { name: "Zachary", lat: 30.6491, lng: -91.1565 },
  { name: "Baker", lat: 30.5852, lng: -91.1684 },
  { name: "Port Allen", lat: 30.4521, lng: -91.2107 },
  { name: "Brusly", lat: 30.3935, lng: -91.2540 },
  { name: "Addis", lat: 30.3563, lng: -91.2654 },
  { name: "Plaquemine", lat: 30.2905, lng: -91.2348 },
  { name: "St. Gabriel", lat: 30.2563, lng: -91.0987 },
  { name: "Geismar", lat: 30.2210, lng: -90.9962 },
  { name: "St. Amant", lat: 30.1996, lng: -90.8312 },
  { name: "Sorrento", lat: 30.1838, lng: -90.8589 },
  { name: "Watson", lat: 30.5852, lng: -90.9495 },
];

const SERVICE_AREA_SCHEMA = SERVICE_CITIES.map((c) => ({
  "@type": "City",
  name: c.name,
  address: { "@type": "PostalAddress", addressLocality: c.name, addressRegion: "LA", addressCountry: "US" },
  geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng },
}));

// 50-mile service radius from Baton Rouge HQ
const SERVICE_AREA_GEO = {
  "@type": "GeoCircle",
  geoMidpoint: { "@type": "GeoCoordinates", latitude: 30.4515, longitude: -91.1871 },
  geoRadius: "80467", // meters (~50 miles)
};

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
    telephone: "+12255216264",
    email: "aaronvasquez@avdetailingg.com",
    areaServed: [
      { "@type": "State", name: "Louisiana" },
      ...SERVICE_AREA_SCHEMA,
    ],
    serviceArea: SERVICE_AREA_GEO,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mobile Service",
      addressLocality: "Baton Rouge",
      addressRegion: "LA",
      postalCode: "70809",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 30.4515,
      longitude: -91.1871,
    },
    hasMap: "https://www.google.com/maps/place/Baton+Rouge,+LA",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "114",
      bestRating: "5",
      worstRating: "1",
    },
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Zelle, Venmo",
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
    areaServed: [
      { "@type": "State", name: "Louisiana" },
      ...SERVICE_AREA_SCHEMA,
    ],
    serviceArea: SERVICE_AREA_GEO,
    ...(priceRange && { priceRange }),
  };
}

export function aboutPageSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/about`,
    name: "About AV Detailing",
    description,
    mainEntity: { "@id": `${SITE_URL}/#business` },
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: `${SITE_URL}/contact`,
    name: "Contact AV Detailing",
    mainEntity: { "@id": `${SITE_URL}/#business` },
  };
}

export function itemListSchema(
  name: string,
  items: { name: string; path: string; description?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${item.path}`,
      name: item.name,
      ...(item.description && { description: item.description }),
    })),
  };
}

export function offerCatalogSchema(
  name: string,
  offers: { name: string; price: number; description?: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name,
    provider: { "@id": `${SITE_URL}/#business` },
    itemListElement: offers.map((o) => ({
      "@type": "Offer",
      price: o.price.toFixed(2),
      priceCurrency: "USD",
      ...(o.url && { url: `${SITE_URL}${o.url}` }),
      itemOffered: {
        "@type": "Service",
        name: o.name,
        ...(o.description && { description: o.description }),
        provider: { "@id": `${SITE_URL}/#business` },
      },
    })),
  };
}

export function imageGallerySchema(
  images: { url: string; caption?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    url: `${SITE_URL}/gallery`,
    name: "AV Detailing Before & After Gallery",
    image: images.map((img) => ({
      "@type": "ImageObject",
      contentUrl: img.url,
      ...(img.caption && { caption: img.caption }),
    })),
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
