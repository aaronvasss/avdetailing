import { escapeFaqHtml, pageFaqHtml, pageFaqSchema, type PageFaq } from "./page-faqs";
import { JOB_GALLERY, GALLERY_INTRO, jobForPage, jobCaption, jobAlt } from "./job-gallery";

/** Actual emitted filenames are supplied by postbuild; missing assets fail, never guessed URLs. */
export function jobPairHtml(job: typeof JOB_GALLERY[number], assetFiles: string[]): string {
  const picture = (stage: "before" | "after") => {
    const stem = `gallery-${job.assetStem}-${stage}`;
    const urls = (format: string) => [400, 800].map(width => {
      const file = assetFiles.find(f => f.startsWith(`${stem}-${width}-`) && f.endsWith(`.${format}`));
      if (!file) throw new Error(`Missing emitted gallery asset: ${stem}-${width}.${format}`);
      return { width, url: `/assets/${file}` };
    });
    const avif = urls("avif"), webp = urls("webp");
    const set = (items: typeof avif) => items.map(p => `${p.url} ${p.width}w`).join(", ");
    return `<figure><picture><source type="image/avif" srcset="${set(avif)}" sizes="(min-width: 768px) 420px, 100vw"><source type="image/webp" srcset="${set(webp)}" sizes="(min-width: 768px) 420px, 100vw"><img src="${webp[1].url}" alt="${escapeFaqHtml(jobAlt(job, stage))}" loading="lazy" decoding="async" width="800" height="600"></picture><figcaption>${stage === "before" ? "Before" : "After"} · ${escapeFaqHtml(jobCaption(job))}</figcaption></figure>`;
  };
  return `<section data-job-pair="${job.key}"><h2>${escapeFaqHtml(jobCaption(job))}</h2>${picture("before")}${picture("after")}</section>`;
}
export function pageExtrasHtml(path: string, faqs: PageFaq[], assets: string[]): string {
  const job = jobForPage(path);
  return (job ? jobPairHtml(job, assets) : "") + pageFaqHtml(faqs);
}
export function galleryInitialHtml(assets: string[]): string {
  return `<h1>Before &amp; After Gallery</h1><p>${escapeFaqHtml(GALLERY_INTRO)}</p>${JOB_GALLERY.map(job => jobPairHtml(job, assets)).join("")}`;
}

/** Remove inherited/duplicate FAQPage nodes while preserving every other schema node. */
export function replacePageFaqSchema(html: string, faqs: PageFaq[]): string {
  const strip = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strip).filter(v => v != null);
    if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      if (node["@type"] === "FAQPage") return null;
      if (Array.isArray(node["@graph"])) return { ...node, "@graph": strip(node["@graph"]) };
    }
    return value;
  };
  const out = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>\s*/gi, (full, json: string) => {
    try {
      const remaining = strip(JSON.parse(json));
      return remaining == null || (Array.isArray(remaining) && !remaining.length) ? "" : full.replace(json, JSON.stringify(remaining).replace(/</g, "\\u003c"));
    } catch { return full; }
  });
  return faqs.length ? out.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(pageFaqSchema(faqs)).replace(/</g, "\\u003c")}</script></head>`) : out;
}