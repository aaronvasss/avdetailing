import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { HelmetProvider } from "react-helmet-async";
import { CORE_FAQ_PATHS, corePageFaqs, pageFaqSchema, pageFaqHtml } from "@/lib/page-faqs";
import { LOCATION_PAGES } from "@/data/locationPages";
import { JOB_GALLERY, jobForPage } from "@/lib/job-gallery";
import { jobPairHtml, replacePageFaqSchema } from "@/lib/page-extras-html";
import { PageFaqSection } from "@/components/seo/PageFaqSection";

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