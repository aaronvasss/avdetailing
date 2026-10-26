import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

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
      expect(xml).not.toContain("<lastmod>");
      expect(xml).not.toMatch(/<loc>[^<]*\/(?:book|auth|account|admin|worker)(?:\/|<)/);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });
});