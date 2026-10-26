import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { SERVICES_DIRECTORY_ITEMS } from "@/lib/services-directory-seo";

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe("/services directory SEO", () => {
  it("initial HTML is indexable with one self-canonical, title, description and section links", () => {
    const temp = mkdtempSync(join(tmpdir(), "services-seo-"));
    try {
      mkdirSync(join(temp, "dist"));
      copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync("npx", ["tsx", resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      const html = readFileSync(join(temp, "dist/services/index.html"), "utf8");
      expect(count(html, /<title>/g)).toBe(1);
      expect(count(html, /<meta\s+name="description"/g)).toBe(1);
      expect(count(html, /rel="canonical"/g)).toBe(1);
      expect(html).toContain('<link rel="canonical" href="https://avdetailing.net/services" />');
      expect(html).not.toMatch(/noindex|nofollow/i);
      for (const s of SERVICES_DIRECTORY_ITEMS) expect(html).toContain(`href="${s.href}"`);
      expect(readFileSync(join(temp, "dist/book/index.html"), "utf8")).toMatch(/noindex/);
      expect(readFileSync(join(temp, "dist/auth/index.html"), "utf8")).toMatch(/noindex/);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);

  it("sitemap lists /services once without lastmod and still excludes utility pages", () => {
    const temp = mkdtempSync(join(tmpdir(), "services-sitemap-"));
    try {
      mkdirSync(join(temp, "public"));
      execFileSync("bun", [resolve("scripts/generate-sitemap.ts")], { cwd: temp });
      const xml = readFileSync(join(temp, "public/sitemap.xml"), "utf8");
      expect(count(xml, /<loc>https:\/\/avdetailing\.net\/services<\/loc>/g)).toBe(1);
      expect(xml).not.toContain("<lastmod>");
      expect(xml).not.toMatch(/<loc>[^<]*\/(?:book|auth|account|admin|worker)(?:\/|<)/);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });

  it("does not pick a disputed ceramic duration", () => {
    const ceramic = SERVICES_DIRECTORY_ITEMS.find(s => s.service === "ceramic")!;
    expect(ceramic.description).not.toMatch(/\d+-year|\b[56]\b/);
  });
});
