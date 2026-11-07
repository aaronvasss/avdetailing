import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { HelmetProvider } from "react-helmet-async";
import { CORE_FAQ_PATHS, corePageFaqs, pageFaqSchema, pageFaqHtml } from "@/lib/page-faqs";
import { LOCATION_PAGES } from "@/data/locationPages";
import { JOB_GALLERY, jobForPage } from "@/lib/job-gallery";
import { jobPairHtml, replacePageFaqSchema } from "@/lib/page-extras-html";
import { PageFaqSection } from "@/components/seo/PageFaqSection";
import { seedSeoAssets } from "./helpers/seo-assets";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

describe("shared public FAQ data", () => {
  for (const path of CORE_FAQ_PATHS) {
    it(`${path} has 4–6 accessible questions and exact schema answers`, () => {
      const faqs = corePageFaqs(path);
      expect(faqs.length).toBeGreaterThanOrEqual(4);
      expect(faqs.length).toBeLessThanOrEqual(6);
      expect(pageFaqSchema(faqs).mainEntity.map(q => ({ question: q.name, answer: q.acceptedAnswer.text }))).toEqual(faqs);
      const rendered = renderToStaticMarkup(createElement(HelmetProvider, {}, createElement(PageFaqSection, { faqs })));
      expect((rendered.match(/aria-expanded="false"/g) ?? []).length).toBe(faqs.length);
      expect((pageFaqHtml(faqs).match(/<details>/g) ?? []).length).toBe(faqs.length);
    });
  }
  for (const page of LOCATION_PAGES) {
    it(`${page.slug} has four city FAQs using its actual neighborhood data`, () => {
      expect(page.faqs).toHaveLength(4);
      expect(page.faqs?.[1].answer).toBe(page.neighborhoods);
    });
  }
  it("car FAQ uses the approved 140 display and supplied live package pricing", () => {
    const prices = { packageFrom: (_s: string, name: string) => name === "Silver Package" ? 301 : 402, label: (n: number | null) => `$${n}` };
    const answer = corePageFaqs("/car-detailing-baton-rouge", prices)[0].answer;
    expect(answer).toContain("$140"); expect(answer).toContain("$301"); expect(answer).toContain("$402");
  });
  it("ceramic uses current 850/1300/1700 prices and the legacy key's 6-Year display", () => {
    const answer = corePageFaqs("/ceramic-coating-baton-rouge")[0].answer;
    expect(answer).toContain("$850 for the 3-Year option");
    expect(answer).toContain("$1,300 for the 6-Year option");
    expect(answer).toContain("$1,700 for the 10-Year option");
  });
  it("keeps paint correction separately quoted", () => expect(corePageFaqs("/ceramic-coating-baton-rouge")[1].answer).toContain("quoted separately"));
  it("keeps the 350 exterior-only RV policy and offered roof cleaning", () => {
    const faqs = corePageFaqs("/rv-detailing-baton-rouge");
    expect(faqs[0].answer).toContain("$350"); expect(faqs[1].answer).toContain("exterior-only"); expect(faqs[2].answer).toContain("roof cleaning is offered");
  });
  it("keeps hull cleaning out of water on trailer/lift only", () => expect(corePageFaqs("/boat-detailing-baton-rouge")[1].answer).toContain("only with the boat out of the water on a trailer or lift"));
  it("keeps aircraft no deposit", () => expect(corePageFaqs("/aircraft-detailing-baton-rouge")[1].answer).toContain("do not require a deposit"));
  it("replaces homepage and repeated FAQ nodes without removing business/breadcrumb nodes", () => {
    const html = '<html><head><script type="application/ld+json">[{"@type":"LocalBusiness"},{"@type":"FAQPage"},{"@type":"BreadcrumbList"}]</script><script type="application/ld+json">{"@type":"FAQPage"}</script></head></html>';
    const out = replacePageFaqSchema(html, corePageFaqs(CORE_FAQ_PATHS[0]));
    expect((out.match(/"@type":"FAQPage"/g) ?? []).length).toBe(1);
    expect(out).toContain('"@type":"LocalBusiness"'); expect(out).toContain('"@type":"BreadcrumbList"');
  });
});
describe("genuine photo routing and emitted assets", () => {
  it("postbuild emits one matching FAQPage, city breadcrumbs and real optimized pictures from an empty shell", () => {
    const temp = mkdtempSync(join(tmpdir(), "batch-two-seo-"));
    try {
      mkdirSync(join(temp, "dist")); seedSeoAssets(temp);
      copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync(resolve("node_modules/.bin/tsx"), [resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      for (const path of [...CORE_FAQ_PATHS, ...LOCATION_PAGES.map(p => `/${p.slug}`)]) {
        const html = readFileSync(join(temp, `dist${path}/index.html`), "utf8");
        const faqs = LOCATION_PAGES.find(p => `/${p.slug}` === path)?.faqs ?? corePageFaqs(path);
        const scripts = Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)).flatMap(m => { const node = JSON.parse(m[1]); return Array.isArray(node) ? node : [node]; });
        const schemas = scripts.filter(node => node["@type"] === "FAQPage");
        expect(schemas).toHaveLength(1);
        expect(schemas[0]).toEqual(pageFaqSchema(faqs));
        expect(html).toContain(pageFaqHtml(faqs));
        expect(scripts.filter(node => node["@type"] === "LocalBusiness")).toHaveLength(1);
        expect(scripts.some(node => node["@type"] === "Service")).toBe(true);
        expect(scripts.some(node => node["@type"] === "BreadcrumbList")).toBe(true);
      }
      for (const path of ["car-detailing-baton-rouge", "mobile-car-detailing-baton-rouge", "interior-detailing-baton-rouge", "exterior-detailing-baton-rouge", "ceramic-coating-baton-rouge", "paint-correction-baton-rouge", "boat-detailing-baton-rouge", "mobile-boat-detailing-baton-rouge", "gelcoat-restoration-baton-rouge"]) {
        const html = readFileSync(join(temp, `dist/${path}/index.html`), "utf8");
        expect(html).toContain('data-job-pair=');
        const images = Array.from(html.matchAll(/<img[^>]+src="(\/assets\/gallery-[^"]+)"/g));
        expect(images).toHaveLength(2);
        for (const image of images) expect(readFileSync(join(temp, "dist", image[1])).length).toBeGreaterThan(0);
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
  it("uses confirmed Range Rover/Porsche/yacht jobs without attributing coating to the Porsche", () => {
    expect(jobForPage("/interior-detailing-baton-rouge")?.vehicle).toBe("Range Rover Biography");
    expect(jobForPage("/ceramic-coating-baton-rouge")?.service).toBe("Paint correction");
    expect(jobForPage("/gelcoat-restoration-baton-rouge")?.service).toBe("Marine detail");
    expect(jobForPage("/aircraft-detailing-baton-rouge")).toBeUndefined();
  });
  it("resolves actual build filenames and refuses absent assets", () => {
    const files = ["before", "after"].flatMap(stage => [400, 800].flatMap(w => ["avif", "webp"].map(format => `gallery-car-detail-${stage}-${w}-actualhash.${format}`)));
    const html = jobPairHtml(JOB_GALLERY[0], files);
    expect(html).toContain("/assets/gallery-car-detail-before-400-actualhash.avif 400w");
    expect((html.match(/loading="lazy"/g) ?? []).length).toBe(2);
    expect(() => jobPairHtml(JOB_GALLERY[0], [])).toThrow("Missing emitted gallery asset");
  });
});