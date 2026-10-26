import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { SEOHead } from "@/components/seo/SEOHead";

type Page = { path: string; title: string; noIndex?: boolean; follow?: boolean };
const head = () => ({
  titles: [...document.querySelectorAll("title")].map((t) => t.textContent),
  desc: [...document.querySelectorAll('meta[name="description"]')].map((m) => m.getAttribute("content")),
  canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute("href")),
  ogUrl: [...document.querySelectorAll('meta[property="og:url"]')].map((m) => m.getAttribute("content")),
  robots: [...document.querySelectorAll('meta[name="robots"]')].map((m) => m.getAttribute("content")),
});
const view = (p: Page) => (
  <HelmetProvider>
    <SEOHead title={p.title} description={`About ${p.title}`} path={p.path} noIndex={p.noIndex} follow={p.follow} />
  </HelmetProvider>
);

beforeEach(() => {
  // A prerendered noindex page: static tags written by postbuild, no data-rh.
  document.head.innerHTML = `<title>Old</title><meta name="description" content="old"/><meta name="robots" content="noindex, follow"/><link rel="canonical" href="https://avdetailing.net/rv-interior-detailing-baton-rouge"/><meta property="og:url" content="https://avdetailing.net/rv-interior-detailing-baton-rouge"/>`;
});

describe("SEOHead owns metadata across client navigation", () => {
  it("leaves exactly one matching set of tags and never a stale noindex", async () => {
    const steps: (Page & { robots: string })[] = [
      { path: "/rv-interior-detailing-baton-rouge", title: "RV Interior", noIndex: true, follow: true, robots: "noindex, follow" },
      { path: "/rv-detailing-baton-rouge", title: "RV", robots: "index" },
      { path: "/car-detailing-baton-rouge", title: "Car", robots: "index" },
      { path: "/book", title: "Book", robots: "noindex, nofollow" },
      { path: "/boat-detailing-baton-rouge", title: "Boat", robots: "index" },
    ];
    const { rerender } = render(view(steps[0]));
    for (const step of steps) {
      rerender(view(step));
      const url = `https://avdetailing.net${step.path}`;
      await waitFor(() => {
        const h = head();
        expect(h.canonical).toEqual([url]);
        expect(h.ogUrl).toEqual([url]);
        expect(h.desc.length).toBe(1);
        expect(h.titles.length).toBe(1);
        expect(h.robots.length).toBe(1);
        expect(h.robots[0]!.startsWith(step.robots)).toBe(true);
      });
    }
  });
});
