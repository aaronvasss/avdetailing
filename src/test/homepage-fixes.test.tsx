import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ServicesSection } from "@/components/home/ServicesSection";

describe("homepage fixes", () => {
  it("hero no longer shows the redundant subtitle but keeps the single H1", () => {
    const hero = readFileSync("src/components/home/HeroSection.tsx", "utf8");
    expect(hero).not.toContain("Mobile Detailing That Comes to You");
    expect(hero.match(/<h1/g)?.length).toBe(1);
  });

  it("all six service photos are served locally with responsive AVIF/WebP up to 1200w", () => {
    const { container } = render(<MemoryRouter><ServicesSection /></MemoryRouter>);
    const pictures = container.querySelectorAll("picture");
    expect(pictures.length).toBe(6);
    expect(container.innerHTML).not.toContain("unsplash");
    pictures.forEach((p) => {
      expect(p.querySelector('source[type="image/avif"]')?.getAttribute("srcset")).toMatch(/ 400w/);
      expect(p.querySelector("img")?.getAttribute("loading")).toBe("lazy");
    });
  });
});

describe("gallery photo prefetch and hero visibility", () => {
  it("hero headline, description and buttons render without an opacity entrance animation", () => {
    const hero = readFileSync("src/components/home/HeroSection.tsx", "utf8");
    const h1 = hero.slice(hero.indexOf("<h1"), hero.indexOf(">", hero.indexOf("<h1")));
    expect(h1).not.toMatch(/animate-fade/);
    expect(hero).not.toMatch(/mb-8 animate-fade-in-up/);
    expect(hero).not.toMatch(/mb-12 animate-fade-in-up/);
  });

  it("gallery photos start lazy and switch to eager only when near the viewport", async () => {
    const { act } = await import("@testing-library/react");
    let cb: ((e: { isIntersecting: boolean }[]) => void) | null = null;
    let margin = "";
    (globalThis as any).IntersectionObserver = class {
      constructor(fn: any, opts: any) { cb = fn; margin = opts.rootMargin; }
      observe() {} disconnect() {}
    };
    const { GalleryPreview } = await import("@/components/home/GalleryPreview");
    const { container } = render(<MemoryRouter><GalleryPreview /></MemoryRouter>);
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs.length).toBe(6);
    imgs.forEach((i) => expect(i.getAttribute("loading")).toBe("lazy"));
    expect(margin).toBe("1500px 0px");
    act(() => cb!([{ isIntersecting: true }]));
    expect(imgs.some((i) => i.getAttribute("loading") === "eager")).toBe(true);
  });
});
