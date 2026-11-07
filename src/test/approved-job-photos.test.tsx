import { describe, expect, it } from "vitest";
import { APPROVED_JOB_PHOTOS, APPROVED_PHOTO_PAGES, approvedPhotosForPage, approvedPhotoCaption } from "@/lib/approved-job-photos";
import { approvedPhotoHtml } from "@/lib/page-extras-html";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { seedSeoAssets } from "./helpers/seo-assets";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ServicesSection } from "@/components/home/ServicesSection";

describe("owner-approved job photos", () => {
  it("uses exactly five approved identities without labeling them before/after or inferred treatments", () => {
    expect(APPROVED_JOB_PHOTOS.map(p => [p.vehicle, p.service])).toEqual([
      ["Cessna Citation", "Private jet detail"], ["Cessna Citation", "Private jet detail"],
      ["Motorhome", "Exterior foam wash"], ["Renaissance Prowler 31", "Boat detail"], ["Renaissance Prowler 31", "Boat detail"],
    ]);
    for (const photo of APPROVED_JOB_PHOTOS) {
      expect(photo.alt).toContain("Baton Rouge");
      expect(approvedPhotoCaption(photo)).not.toMatch(/coating|restoration|before|after|roof/i);
      for (const srcset of [photo.photo.avifSrcSet, photo.photo.webpSrcSet]) {
        expect(srcset).toMatch(/400w/); expect(srcset).toMatch(/800w/); expect(srcset).toMatch(/1200w/);
      }
      expect(approvedPhotoHtml(photo)).toContain('loading="lazy"');
      expect(approvedPhotoHtml(photo)).toContain('width="800" height="600"');
    }
  });
  it("maps the 15 requested pages and excludes the unavailable RV-interior route", () => {
    expect(Object.values(APPROVED_PHOTO_PAGES).flat()).toHaveLength(15);
    for (const path of APPROVED_PHOTO_PAGES.aircraft) expect(approvedPhotosForPage(path).map(p => p.key)).toEqual(["aircraftHangar", "aircraftDetail"]);
    for (const path of APPROVED_PHOTO_PAGES.rv) expect(approvedPhotosForPage(path).map(p => p.key)).toEqual(["rvFoam"]);
    for (const path of APPROVED_PHOTO_PAGES.boat) expect(approvedPhotosForPage(path).map(p => p.key)).toEqual(["boatSide", "boatBow"]);
    expect(approvedPhotosForPage("/rv-interior-detailing-baton-rouge")).toEqual([]);
  });
  it("homepage specialty cards use the exact approved boat, jet and RV photos", () => {
    const { container } = render(<MemoryRouter><ServicesSection /></MemoryRouter>);
    for (const [path, index] of [["boat", 3], ["aircraft", 0], ["rv", 2]] as const) {
      expect(container.querySelector(`a[href="/${path}-detailing-baton-rouge"] img`)?.getAttribute("src")).toBe(APPROVED_JOB_PHOTOS[index].photo.src);
    }
  });
  it("public source contains no Unsplash host references", () => {
    const scan = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? scan(join(dir, e.name)) : /\.(tsx?|html|json|xml|css)$/.test(e.name) ? [join(dir, e.name)] : []);
    for (const file of [...scan("src"), ...scan("public"), ...scan("scripts"), "index.html"]) expect(readFileSync(file, "utf8")).not.toMatch(/images\.unsplash\.com/);
  });
  it("postbuild includes all assigned photos and five gallery ImageObjects", () => {
    const temp = mkdtempSync(join(tmpdir(), "approved-jobs-seo-"));
    try {
      mkdirSync(join(temp, "dist")); seedSeoAssets(temp); copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync(resolve("node_modules/.bin/tsx"), [resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      for (const path of Object.values(APPROVED_PHOTO_PAGES).flat()) {
        const html = readFileSync(join(temp, `dist${path}/index.html`), "utf8");
        for (const p of approvedPhotosForPage(path)) expect(html).toContain(approvedPhotoHtml(p));
      }
      const gallery = readFileSync(join(temp, "dist/gallery/index.html"), "utf8");
      const schemas = Array.from(gallery.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)).flatMap(m => { const s = JSON.parse(m[1]); return Array.isArray(s) ? s : [s]; });
      const imageGallery = schemas.filter(s => s["@type"] === "ImageGallery"); expect(imageGallery).toHaveLength(1);
      for (const p of APPROVED_JOB_PHOTOS) {
        expect(gallery).toContain(approvedPhotoHtml(p));
        expect(imageGallery[0].image).toContainEqual({ "@type": "ImageObject", contentUrl: p.photo.src, caption: approvedPhotoCaption(p) });
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
});