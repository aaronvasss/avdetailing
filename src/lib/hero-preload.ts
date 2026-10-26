/**
 * Homepage-only hero preload for initial HTML. The srcset/sizes are copied
 * from the captured hero <picture> AVIF source in the same document, so the
 * hashed build URLs always match what the browser would pick (no guessing).
 * type="image/avif" makes non-AVIF browsers skip the preload and use the
 * picture's WebP fallback, avoiding a duplicate hero download.
 */
export function injectHeroPreload(html: string): string {
  if (/<link[^>]+rel="preload"[^>]+data-hero-preload/i.test(html)) return html;
  const source = html.match(/<source\b[^>]*type="image\/avif"[^>]*>/gi)?.find((tag) => /hero-bg-\d+[^"\s]*\.avif/.test(tag));
  if (!source) return html;
  const srcset = source.match(/srcset="([^"]+)"/i)?.[1];
  const sizes = source.match(/sizes="([^"]+)"/i)?.[1] ?? "100vw";
  if (!srcset) return html;
  const link = `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high" data-hero-preload>`;
  return html.replace(/<\/head>/i, `${link}</head>`);
}
