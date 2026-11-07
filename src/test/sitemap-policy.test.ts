import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { CARE_GUIDES, GUIDES_INDEX, GUIDE_PUBLISH_DATE } from "@/lib/guides";
import { SPANISH_PAGES } from "@/lib/language-pages";

describe("public sitemap policy", () => {
  it("includes all four canonical aviation pages without inferred lastmod or private routes", () => {
    const temp = mkdtempSync(join(tmpdir(), "aviation-sitemap-"));
    try {
      mkdirSync(join(temp, "public"));
      execFileSync("bun", [resolve("scripts/generate-sitemap.ts")], { cwd: temp });
      const xml = readFileSync(join(temp, "public/sitemap.xml"), "utf8");
      for (const slug of ["aircraft-detailing-baton-rouge", "aircraft-cleaning-baton-rouge", "aircraft-interior-detailing-baton-rouge", "aircraft-paint-protection-baton-rouge"]) {
        expect(xml.match(new RegExp(`<loc>https://avdetailing.net/${slug}</loc>`, "g"))).toHaveLength(1);
      }
      for (const page of [GUIDES_INDEX, ...CARE_GUIDES, ...SPANISH_PAGES]) expect(xml.match(new RegExp(`<loc>https://avdetailing.net${page.path}</loc>`, "g"))).toHaveLength(1);
      const dated = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].filter(m => m[1].includes("<lastmod>"));
      expect(dated).toHaveLength(4);
      for (const entry of dated) {
        expect(entry[1]).toContain(`<lastmod>${GUIDE_PUBLISH_DATE}</lastmod>`);
        expect(CARE_GUIDES.some(page => entry[1].includes(`<loc>https://avdetailing.net${page.path}</loc>`))).toBe(true);
      }
      expect(xml).not.toMatch(/<loc>[^<]*\/(?:book|auth|account|admin|worker)(?:\/|<)/);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });
});