import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { injectHeroPreload } from "@/lib/hero-preload";

const ORIGINALS = ["car-detail-after", "car-detail-before", "boat-detail-after", "boat-detail-before", "paint-correction-after", "paint-correction-before"];

describe("gallery photo delivery", () => {
  it("homepage and gallery cards never reference the original JPEGs in markup", () => {
    const preview = readFileSync("src/components/home/GalleryPreview.tsx", "utf8");
    expect(preview).not.toMatch(/assets\/gallery\/.*\.jpg/);
    const page = readFileSync("src/pages/GalleryPage.tsx", "utf8");
    expect(page).not.toMatch(/<img\s+src=\{item\.(before|after)\}/);
  });

  it("every variant used by cards is far smaller than its original (≤400 KB at 1200w)", () => {
    for (const n of ORIGINALS) {
      const orig = statSync(`src/assets/gallery/${n}.jpg`).size;
      for (const w of [400, 800]) for (const ext of ["avif", "webp"]) {
        const v = statSync(`src/assets/optimized/gallery-${n}-${w}.${ext}`).size;
        expect(v).toBeLessThan(orig);
        expect(v).toBeLessThan(200 * 1024);
      }
    }
    expect(statSync("src/assets/optimized/gallery-car-detail-after-1200.avif").size).toBeLessThan(400 * 1024);
  });

  it("card srcsets offer 400w and 800w and sizes match the 1/2/3-column grid", async () => {
    const { GALLERY_PHOTOS, GALLERY_CARD_SIZES } = await import("@/lib/gallery-images");
    expect(GALLERY_CARD_SIZES).toBe("(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw");
    for (const p of Object.values(GALLERY_PHOTOS)) {
      expect(p.avifSrcSet).toMatch(/ 400w/);
      expect(p.avifSrcSet).toMatch(/ 800w/);
      expect(p.webpSrcSet).toMatch(/ 800w/);
      expect(p.src).not.toMatch(/\.jpg/);
    }
  });
});

const HOME = `<html><head><title>x</title></head><body><div id="root"><picture><source type="image/avif" srcset="/assets/hero-bg-640-AbC1.avif 640w, /assets/hero-bg-1024-Zz9.avif 1024w" sizes="100vw"><source type="image/webp" srcset="/assets/hero-bg-640-q.webp 640w" sizes="100vw"><img src="/assets/hero-bg-1600-q.webp"></picture></div></body></html>`;

describe("homepage hero preload", () => {
  it("copies the captured hashed AVIF srcset/sizes into one head preload", () => {
    const out = injectHeroPreload(HOME);
    const head = out.split("</head>")[0];
    expect(head).toContain('imagesrcset="/assets/hero-bg-640-AbC1.avif 640w, /assets/hero-bg-1024-Zz9.avif 1024w"');
    expect(head).toContain('type="image/avif"');
    expect(head).toContain('imagesizes="100vw"');
    expect(injectHeroPreload(out).match(/data-hero-preload/g)).toHaveLength(1);
  });

  it("adds nothing to pages without the homepage hero (boat/RV/aviation/private)", () => {
    const other = `<html><head></head><body><picture><source type="image/avif" srcset="/assets/rv-detailing-800-x.avif 800w"></picture></body></html>`;
    expect(injectHeroPreload(other)).toBe(other);
  });

  it("postbuild applies the preload only to the / route", () => {
    const src = readFileSync("scripts/postbuild-seo.ts", "utf8");
    expect(src).toMatch(/route\.path === "\/" \? injectHeroPreload\(/);
    expect(readFileSync("index.html", "utf8")).not.toMatch(/hero-bg/);
  });
});
