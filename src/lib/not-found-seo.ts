export const NOT_FOUND_SEO = { title: "Page Not Found | AV Detailing", description: "This page does not exist. Explore AV Detailing services, service areas or book an appointment." };
export const NOT_FOUND_LINKS = [{ href: "/", text: "Home" }, { href: "/services", text: "Services" }, { href: "/service-areas", text: "Service Areas" }, { href: "/book", text: "Book" }];
/** Serving this optional fallback with HTTP 404 is a static-host decision. */
export function notFoundHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${NOT_FOUND_SEO.title}</title><meta name="description" content="${NOT_FOUND_SEO.description}"><meta name="robots" content="noindex, follow"></head><body><main><h1>Page not found</h1><p>The page you requested does not exist.</p><nav>${NOT_FOUND_LINKS.map(l => `<a href="${l.href}">${l.text}</a>`).join(" · ")}</nav></main></body></html>`;
}