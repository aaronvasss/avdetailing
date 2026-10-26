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
