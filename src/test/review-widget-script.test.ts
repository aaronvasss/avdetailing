import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

describe("global review widget script removal", () => {
  it("index.html no longer loads or preconnects to reputationhub on every route", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/reputationhub\.site/);
    // Unrelated hosts the task said to keep.
    expect(html).toContain('href="https://beta.leadconnectorhq.com"');
    expect(html).toContain('href="https://link.msgsndr.com"');
  });

  it("no rendered component depends on the widget script or its embed URL", () => {
    const hits = execSync("rg -l 'review-widget|GOOGLE_REVIEWS_WIDGET_URL|reputationhub' src --glob '!src/test/**' || true").toString().trim().split("\n").filter(Boolean);
    expect(hits).toEqual(["src/lib/google-business.ts"]);
  });

  it("the shared review block still uses Google profile links", () => {
    const src = readFileSync("src/components/reviews/GoogleReviews.tsx", "utf8");
    expect(src).toMatch(/GOOGLE_REVIEWS_URL/);
    expect(src).toMatch(/GOOGLE_WRITE_REVIEW_URL/);
    expect(src).toMatch(/loadFeaturedReviews/);
  });
});
