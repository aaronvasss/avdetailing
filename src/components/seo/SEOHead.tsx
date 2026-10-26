import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { UTILITY_ROUTE_SEO } from "@/lib/utility-route-seo";

const DEFAULT_OG_IMAGE = "https://avdetailing.net/og-image.jpg";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SEOHeadProps) {
  const utility = UTILITY_ROUTE_SEO.find((route) => route.path === path);
  title = utility?.title ?? title;
  description = utility?.description ?? description;
  noIndex = Boolean(utility) || noIndex;
  useEffect(() => {
    if (!path.startsWith("/aircraft-") && path !== "/services") return;
    // Aviation and the services directory own its static fallback tags during client navigation too.
    const fallbacks = [...document.querySelectorAll('meta[name="description"]:not([data-rh]), meta[property="og:title"]:not([data-rh]), meta[property="og:description"]:not([data-rh]), meta[name="twitter:title"]:not([data-rh]), meta[name="twitter:description"]:not([data-rh])')];
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const existingOgUrl = document.querySelector('meta[property="og:url"]');
    const canonical = existingCanonical ?? document.createElement("link");
    const ogUrl = existingOgUrl ?? document.createElement("meta");
    if (!existingCanonical) {
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    if (!existingOgUrl) {
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    const oldCanonical = canonical?.getAttribute("href");
    const oldOgUrl = ogUrl?.getAttribute("content");
    fallbacks.forEach(tag => tag.remove());
    canonical?.setAttribute("href", `https://avdetailing.net${path}`);
    ogUrl?.setAttribute("content", `https://avdetailing.net${path}`);
    return () => {
      fallbacks.forEach(tag => document.head.appendChild(tag));
      if (!existingCanonical) canonical.remove();
      if (!existingOgUrl) ogUrl.remove();
      if (oldCanonical) canonical?.setAttribute("href", oldCanonical);
      if (oldOgUrl) ogUrl?.setAttribute("content", oldOgUrl);
    };
  }, [path]);
  useEffect(() => {
    if (!noIndex) return;
    // The generic development shell (or a client-side service→utility visit)
    // has an unmanaged index directive. Let Helmet own the utility policy.
    const fallback = document.querySelector<HTMLMetaElement>('meta[name="robots"]:not([data-rh])');
    if (!fallback) return;
    fallback.remove();
    return () => { document.head.appendChild(fallback); };
  }, [noIndex]);
  const fullTitle = path === "/"
    ? title
    : title.includes("AV Detailing")
      ? title
      : `${title} — AV Detailing`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

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
