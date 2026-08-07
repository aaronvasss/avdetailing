// Plain-TS SEO schema constants and the public LocalBusiness schema.
// Kept free of React imports so build scripts (postbuild-seo) can use them.
export const SITE_URL = "https://avdetailing.net";

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

export const SERVICE_AREA_SCHEMA = SERVICE_CITIES.map((c) => ({
  "@type": "City",
  name: c.name,
  address: { "@type": "PostalAddress", addressLocality: c.name, addressRegion: "LA", addressCountry: "US" },
  geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng },
}));

// 30-mile service radius from Baton Rouge HQ
export const SERVICE_AREA_GEO = {
  "@type": "GeoCircle",
  geoMidpoint: { "@type": "GeoCoordinates", latitude: 30.4515, longitude: -91.1871 },
  geoRadius: "48280", // meters (~30 miles)
};

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
    email: "info@avdetailing.com",
    areaServed: [
      { "@type": "State", name: "Louisiana" },
      ...SERVICE_AREA_SCHEMA,
    ],
    serviceArea: SERVICE_AREA_GEO,
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
    hasMap: "https://www.google.com/maps/place/Baton+Rouge,+LA",
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Zelle, Venmo",
    sameAs: [
      "https://www.facebook.com/avdetailingg",
      "https://www.instagram.com/avdetailinngg/",
      "https://www.tiktok.com/@avdetailinngg",
      "https://www.youtube.com/@avdetailing",
    ],
    image: `${SITE_URL}/og-image.jpg`,
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

