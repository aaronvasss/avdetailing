import { describe, expect, it } from "vitest";
import { localBusinessSchema } from "@/components/seo/schema";
import { PUBLIC_OPENING_HOURS_SPECIFICATION } from "@/lib/public-business-facts";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { seedSeoAssets } from "./helpers/seo-assets";
import { schemaHasType } from "@/lib/schema-node";

describe("owner-confirmed daily public hours", () => {
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
    it(`${day} is open 06:00–20:00`, () => {
      const hours = localBusinessSchema().openingHoursSpecification.find(h => h.dayOfWeek === `https://schema.org/${day}`);
      expect(hours?.opens).toBe("06:00");
      expect(hours?.closes).toBe("20:00");
    });
  }
  it("contains exactly all seven days", () => expect(PUBLIC_OPENING_HOURS_SPECIFICATION).toHaveLength(7));
  it("initial homepage/contact schema retains the exact seven daily hours", () => {
    const temp = mkdtempSync(join(tmpdir(), "public-hours-"));
    try {
      mkdirSync(join(temp, "dist")); seedSeoAssets(temp);
      copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync(resolve("node_modules/.bin/tsx"), [resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      for (const path of ["dist/index.html", "dist/contact/index.html"]) {
        const html = readFileSync(join(temp, path), "utf8");
        const nodes = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => {
          const s = JSON.parse(m[1]); return Array.isArray(s) ? s : [s];
        });
        expect(nodes.find(n => schemaHasType(n, "LocalBusiness"))?.openingHoursSpecification).toEqual(PUBLIC_OPENING_HOURS_SPECIFICATION);
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
});