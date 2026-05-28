/**
 * Post-build SEO step.
 *
 * For every public route, emits dist/<route>/index.html with a UNIQUE
 * <title>, <meta name="description">, <link rel="canonical">,
 * <meta property="og:title">, <meta property="og:description">,
 * <meta property="og:url"> and <meta name="twitter:*">.
 *
 * This is the source of truth for non-JS crawlers (Semrush, Ahrefs,
 * social previews). It runs whether or not vite-plugin-prerender
 * succeeded — if a prerendered file already exists for the route,
 * the meta tags are rewritten in place; otherwise the file is
 * created from dist/index.html as the shell.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { SERVICE_LANDING_PAGES } from "../src/data/serviceLandingPages";
import { LOCATION_PAGES } from "../src/data/locationPages";

const DIST = join(process.cwd(), "dist");
const SITE = "https://avdetailing.net";
const SHELL_PATH = join(DIST, "index.html");

if (!existsSync(SHELL_PATH)) {
  console.warn("[postbuild-seo] dist/index.html not found, skipping");
  process.exit(0);
}

interface RouteMeta {
  path: string;
  title: string;
  description: string;
}

const STATIC_ROUTES: RouteMeta[] = [
  {
    path: "/",
    title: "Car Detailing Service in Baton Rouge, LA | AV Detailing",
    description:
      "AV Detailing — Baton Rouge's #1 mobile car detailing service. System X ceramic coating, paint correction, RV, boat & aircraft detailing. We come to you. Call (225) 521-6264.",
  },
  {
    path: "/about",
    title: "About AV Detailing | Baton Rouge Mobile Detailing",
    description:
      "Meet the family behind AV Detailing — a fully-insured mobile detailing crew serving Baton Rouge with 115+ five-star Google reviews and System X-certified technicians.",
  },
  {
    path: "/services",
    title: "Mobile Detailing Services in Baton Rouge | AV Detailing",
    description:
      "Browse every AV Detailing service — car, RV, boat & aircraft detailing, ceramic coating, paint correction, interior shampoo and more. Mobile across Greater Baton Rouge.",
  },
  {
    path: "/memberships",
    title: "Detailing Memberships | AV Detailing",
    description:
      "Monthly, bi-weekly, and weekly mobile detailing memberships in Baton Rouge. Keep your car, truck, or SUV showroom-fresh year-round and skip the booking line.",
  },
  {
    path: "/gallery",
    title: "Before & After Gallery | AV Detailing",
    description:
      "Real before-and-after photos from AV Detailing jobs — paint correction, ceramic coating, interior shampoo, boat and RV restorations across Baton Rouge, LA.",
  },
  {
    path: "/reviews",
    title: "Customer Reviews & Testimonials | AV Detailing Baton Rouge",
    description:
      "Read 115+ five-star Google reviews from AV Detailing customers in Baton Rouge, LA. See why we're the top-rated mobile auto, RV, boat & aircraft detailing service.",
  },
  {
    path: "/contact",
    title: "Contact Us | AV Detailing",
    description:
      "Call (225) 521-6264 or message AV Detailing to book mobile car, RV, boat or aircraft detailing in Baton Rouge, Prairieville, Gonzales, Walker and Denham Springs.",
  },
  {
    path: "/service-areas",
    title: "Mobile Detailing Service Areas | AV Detailing",
    description:
      "AV Detailing mobile service areas — Baton Rouge, Highland Road, Shenandoah, Gonzales, Prairieville, Walker, Denham Springs, Zachary and Central, Louisiana.",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | AV Detailing",
    description:
      "How AV Detailing collects, uses and protects customer information, including phone numbers and SMS opt-in details for booking confirmations and reminders.",
  },
  {
    path: "/terms-and-conditions",
    title: "Terms & Conditions | AV Detailing",
    description:
      "AV Detailing booking terms, SMS consent disclosure, cancellation policy, deposits, refunds and service guarantees for mobile detailing in Baton Rouge, LA.",
  },
];

const SERVICE_ROUTES: RouteMeta[] = SERVICE_LANDING_PAGES.map((p) => ({
  path: `/${p.slug}`,
  title: `${p.title} | AV Detailing`,
  description: p.metaDescription,
}));

const LOCATION_ROUTES: RouteMeta[] = LOCATION_PAGES.map((p) => ({
  path: `/${p.slug}`,
  title: `${p.titleTag} | AV Detailing`,
  description: p.metaDescription,
}));

const ALL_ROUTES: RouteMeta[] = [
  ...STATIC_ROUTES,
  ...SERVICE_ROUTES,
  ...LOCATION_ROUTES,
];

const SHELL = readFileSync(SHELL_PATH, "utf8");

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rewrite(html: string, m: RouteMeta): string {
  const url = `${SITE}${m.path === "/" ? "/" : m.path}`;
  const t = escapeAttr(m.title);
  const d = escapeAttr(m.description);

  let out = html;

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);

  // meta name="description"
  if (/<meta\s+name=["']description["'][^>]*>/i.test(out)) {
    out = out.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${d}" />`,
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <meta name="description" content="${d}" />`,
    );
  }

  // canonical
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(out)) {
    out = out.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${url}" />`,
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <link rel="canonical" href="${url}" />`,
    );
  }

  // og:title / og:description / og:url
  out = out.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${t}" />`,
  );
  out = out.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${d}" />`,
  );
  out = out.replace(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${url}" />`,
  );

  // twitter
  out = out.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${t}" />`,
  );
  out = out.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${d}" />`,
  );

  return out;
}

let written = 0;
const seen = new Set<string>();

for (const route of ALL_ROUTES) {
  if (seen.has(route.path)) continue;
  seen.add(route.path);

  const target =
    route.path === "/"
      ? SHELL_PATH
      : join(DIST, route.path.replace(/^\//, ""), "index.html");

  const base = existsSync(target) ? readFileSync(target, "utf8") : SHELL;
  const rewritten = rewrite(base, route);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, rewritten);
  written++;
}

console.log(`[postbuild-seo] wrote ${written} route HTML files`);
