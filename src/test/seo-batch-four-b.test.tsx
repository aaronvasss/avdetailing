import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { render, waitFor, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { SEOHead } from "@/components/seo/SEOHead";
import { CARE_GUIDES, GUIDE_PUBLISH_DATE } from "@/lib/guides";
import { SPANISH_PAGES, LANGUAGE_PAIRS, languageAlternates } from "@/lib/language-pages";
import { EDITORIAL_ROUTES, spanishPackagePrices } from "@/lib/editorial-html";
import { seedSeoAssets } from "./helpers/seo-assets";
import { schemaHasType } from "@/lib/schema-node";

describe("batch 4B indexing and published content", () => {
  it("keeps four approved article URLs and both Spanish URLs", () => {
    expect(CARE_GUIDES.map(g => g.path)).toEqual(["/guides/ceramic-coating-vs-wax", "/guides/remove-lovebugs-car-paint", "/guides/boat-oxidation-gelcoat-care", "/guides/how-often-detail-car"]);
    expect(SPANISH_PAGES.map(p => p.path)).toEqual(["/es", "/es/detallado-de-autos-baton-rouge"]);
  });
  it("translates existing car display prices without changing charges", () => {
    expect(spanishPackagePrices(259.17, 362.8)).toEqual([{ name: "Basic", price: "$140" }, { name: "Silver", price: "$259" }, { name: "Gold", price: "$363" }]);
    expect(spanishPackagePrices(299, 399)[1].price).toBe("$299");
  });
  it("emits substantive shared initial HTML, article authors/dates and reciprocal language pairs", () => {
    const temp = mkdtempSync(join(tmpdir(), "seo-four-b-"));
    try {
      mkdirSync(join(temp, "dist")); seedSeoAssets(temp); copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync(resolve("node_modules/.bin/tsx"), [resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      for (const page of EDITORIAL_ROUTES) {
        const dom = new JSDOM(readFileSync(join(temp, `dist${page.path}/index.html`), "utf8"));
        const d = dom.window.document;
        expect(d.title).toBe(page.title);
        expect(d.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(page.description);
        expect(d.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
        expect(d.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://avdetailing.net${page.path}`);
        expect(d.querySelector('meta[name="robots"]')?.getAttribute("content")).toMatch(/^index/);
        const nodes = [...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(n => { const s = JSON.parse(n.textContent ?? "{}"); return Array.isArray(s) ? s : [s]; });
        expect(nodes.filter(n => schemaHasType(n, "LocalBusiness"))).toHaveLength(1);
        expect(nodes.filter(n => ["FAQPage", "Review"].includes(n["@type"]) || n.aggregateRating)).toHaveLength(0);
        const guide = CARE_GUIDES.find(g => g.path === page.path);
        if (guide) {
          const articles = nodes.filter(n => n["@type"] === "Article");
          expect(articles).toHaveLength(1);
          expect(articles[0].author.name).toBe("AV Detailing");
          expect(articles[0].datePublished).toBe("2026-11-07");
          expect(articles[0].mainEntityOfPage).toBe(`https://avdetailing.net${page.path}`);
          expect(nodes.filter(n => n["@type"] === "BreadcrumbList")).toHaveLength(1);
          expect(d.querySelector("time")?.getAttribute("datetime")).toBe(GUIDE_PUBLISH_DATE);
          for (const section of guide.sections) for (const p of section.paragraphs) expect(d.body.textContent).toContain(p);
          for (const l of [...guide.links, { href: "/book" }]) expect(d.querySelector(`a[href="${l.href}"]`)).not.toBeNull();
          expect(d.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("article");
        }
        if (page.path.startsWith("/es")) {
          expect(d.documentElement.lang).toBe("es");
          const spanish = SPANISH_PAGES.find(p => p.path === page.path);
          for (const section of spanish?.sections ?? []) for (const p of section.paragraphs) expect(d.body.textContent).toContain(p);
        }
        dom.window.close();
      }
      for (const pair of LANGUAGE_PAIRS) for (const path of [pair.en, pair.es]) {
        const dom = new JSDOM(readFileSync(join(temp, path === "/" ? "dist/index.html" : `dist${path}/index.html`), "utf8"));
        const links = [...dom.window.document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => [l.getAttribute("hreflang"), l.getAttribute("href")]);
        expect(links).toEqual([["en", `https://avdetailing.net${pair.en}`], ["es", `https://avdetailing.net${pair.es}`], ["x-default", `https://avdetailing.net${pair.en}`]]);
        dom.window.close();
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
  it("restores language and removes obsolete alternates during navigation", async () => {
    document.head.innerHTML = '<link rel="alternate" hreflang="bad" href="https://example.com">';
    const view = (path: string) => <HelmetProvider><SEOHead title="AV Detailing" description="Care guidance" path={path} type={path.startsWith("/guides/") ? "article" : "website"} /></HelmetProvider>;
    const screen = render(view("/es"));
    await waitFor(() => expect(document.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(3));
    expect(document.documentElement.lang).toBe("es");
    screen.rerender(view("/"));
    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
    screen.rerender(view(CARE_GUIDES[0].path));
    await waitFor(() => expect(document.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(0));
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("article");
    expect(languageAlternates("/book")).toEqual([]);
    cleanup();
  });
});