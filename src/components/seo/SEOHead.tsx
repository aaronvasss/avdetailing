import { Helmet } from "react-helmet-async";
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
