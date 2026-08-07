import { Helmet } from "react-helmet-async";
import {
  SITE_URL,
  SERVICE_AREA_SCHEMA,
  SERVICE_AREA_GEO,
  localBusinessSchema,
} from "./schema";

export { localBusinessSchema };

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
