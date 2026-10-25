/** Public utility pages are crawlable but never search-indexable. */
export const UTILITY_ROUTE_SEO = [
  {
    path: "/book",
    title: "Book a Mobile Detailing Appointment — AV Detailing",
    description: "Schedule an AV Detailing appointment. Choose your detailing service, vehicle, package, add-ons, and available appointment time.",
    heading: "Book a Mobile Detailing Appointment",
  },
  {
    path: "/auth",
    title: "Sign In — AV Detailing",
    description: "Sign in to your AV Detailing account to manage appointments, vehicles, memberships, and service records.",
    heading: "Welcome Back",
  },
] as const;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Replace even a fully prerendered homepage, without leaving nested markup behind. */
export function rewriteUtilityHtml(html: string, route: (typeof UTILITY_ROUTE_SEO)[number]): string {
  const root = /<div\b[^>]*\bid=["']root["'][^>]*>/i.exec(html);
  if (!root) throw new Error(`Missing app root for ${route.path}`);
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = root.index + root[0].length;
  let depth = 1;
  let end = -1;
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(html))) {
    depth += /^<\/div/i.test(tag[0]) ? -1 : 1;
    if (depth === 0) { end = tags.lastIndex; break; }
  }
  if (end < 0) throw new Error(`Unclosed app root for ${route.path}`);
  const content = `<div id="root"><main data-utility-content><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.description)}</p></main></div>`;
  let out = html.slice(0, root.index) + content + html.slice(end);
  // No homepage schema or metadata belongs to these utility responses.
  out = out.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  out = out.replace(/<meta\b(?=[^>]*\b(?:name|property)=["'](?:description|robots|googlebot|og:(?:title|description|url)|twitter:(?:title|description))["'])[^>]*>/gi, "");
  out = out.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, "");
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const url = `https://avdetailing.net${route.path}`;
  return out.replace(/<\/head>/i, `<title>${title}</title><meta name="description" content="${description}" /><meta name="robots" content="noindex, nofollow" /><link rel="canonical" href="${url}" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${url}" /><meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${description}" /></head>`);
}