import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { UTILITY_ROUTE_SEO } from "@/lib/utility-route-seo";
import { STATIC_ROUTE_SEO } from "@/lib/static-route-seo";
import { languageAlternates } from "@/lib/language-pages";

export const INDEX_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
const DEFAULT_OG_IMAGE = "https://avdetailing.net/og-image.jpg";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
  /** With noIndex, let crawlers follow links (legacy unavailable-service pages). */
  follow?: boolean;
  omitCanonical?: boolean;
}

export function SEOHead({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  follow = false,
  omitCanonical = false,
}: SEOHeadProps) {
  const utility = UTILITY_ROUTE_SEO.find((route) => route.path === path);
  const shared = STATIC_ROUTE_SEO.find((route) => route.path === path);
  title = utility?.title ?? shared?.title ?? title;
  description = utility?.description ?? shared?.description ?? description;
  noIndex = Boolean(utility) || noIndex;
  const pageUrl = `https://avdetailing.net${path === "/" ? "/" : path}`;
  useEffect(() => {
    document.documentElement.lang = path === "/es" || path.startsWith("/es/") ? "es" : "en";
    document.querySelectorAll('link[rel="alternate"][hreflang]:not([data-rh])').forEach(tag => tag.remove());
    // SEOHead is the single metadata owner on every route. Static/prerendered
    // fallback tags (no data-rh) only serve the first response: drop them for
    // good once Helmet owns the head, so a previous route's description or
    // robots directive can never come back during client navigation.
    document
      .querySelectorAll('meta[name="description"]:not([data-rh]), meta[name="robots"]:not([data-rh]), meta[property="og:title"]:not([data-rh]), meta[property="og:description"]:not([data-rh]), meta[name="twitter:title"]:not([data-rh]), meta[name="twitter:description"]:not([data-rh])')
      .forEach((tag) => tag.remove());
    // Canonical/og:url stay outside Helmet (single prerendered tag, see note
    // below); keep exactly one and point it at this route (no query/hash).
    const ensureOne = (selector: string, create: () => Element) => {
      const all = [...document.querySelectorAll(selector)];
      all.slice(1).forEach((tag) => tag.remove());
      if (all[0]) return all[0];
      const tag = create();
      document.head.appendChild(tag);
      return tag;
    };
    if (omitCanonical) {
      document.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach((tag) => tag.remove());
      return;
    }
    ensureOne('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }))
      .setAttribute("href", pageUrl);
    ensureOne('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    }).setAttribute("content", pageUrl);
    ensureOne('meta[property="og:type"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:type");
      return m;
    }).setAttribute("content", type);
  }, [pageUrl, omitCanonical, path, type]);
  const fullTitle = path === "/"
    ? title
    : title.includes("AV Detailing")
      ? title
      : `${title} — AV Detailing`;
  return (
    <Helmet>
      {languageAlternates(path).map(alternate => <link key={alternate.lang} rel="alternate" hrefLang={alternate.lang} href={`https://avdetailing.net${alternate.path}`} />)}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? (follow && !utility ? "noindex, follow" : "noindex, nofollow") : INDEX_ROBOTS} />

      {/*
        NOTE: <link rel="canonical">, <meta property="og:url"> and
        <meta property="og:type"> are intentionally NOT emitted here —
        they are written into the prerendered HTML by
        scripts/postbuild-seo.ts. Emitting them from react-helmet too
        creates duplicates that crawlers (Semrush, etc.) flag as
        "Multiple canonical URLs".
      */}

      {/* Open Graph (title/description/image only) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AV Detailing" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
