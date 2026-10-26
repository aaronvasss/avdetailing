import { describe, it, expect } from "vitest";
import { LOCATION_PAGES } from "@/data/locationPages";
import { SERVICE_LANDING_BY_SLUG } from "@/data/serviceLandingPages";

const BANNED = [/ozone/i, /System X/i, /luxury/i, /affluent/i, /safer night/i, /water and power/i, /built into every exterior/i, /decontamination, clay bar/i, /resale value/i, /7 day/i, /lifted truck/i];
const text = (p: (typeof LOCATION_PAGES)[number]) =>
  JSON.stringify([p.metaDescription, p.intro, p.services, p.whyChoose, p.neighborhoods, p.localNotes ?? [], p.faqs ?? []]);

describe("city car pages", () => {
  it("keeps the eight existing city URLs", () => {
    expect(LOCATION_PAGES.map((p) => p.slug)).toHaveLength(8);
  });
  it.each(LOCATION_PAGES.map((p) => [p.slug, p] as const))("%s has no unsupported claims or filler links", (_s, p) => {
    for (const re of BANNED) expect(text(p)).not.toMatch(re);
    expect(p.link1).toBeUndefined();
    expect(p.link2).toBeUndefined();
    expect(p.intro).not.toMatch(/\{\{l[12]\}\}/);
  });
  it("links every listed service to an existing service page", () => {
    for (const s of LOCATION_PAGES[0].services) {
      const slug = s.href.replace(/^\//, "");
      expect(SERVICE_LANDING_BY_SLUG[slug] ?? ["paint-correction-baton-rouge", "ceramic-coating-baton-rouge"].includes(slug)).toBeTruthy();
    }
  });
  it("treats clay bar as an add-on, not part of every wash", () => {
    const ext = LOCATION_PAGES[0].services.find((s) => s.name === "Exterior Detailing")!;
    expect(ext.description).toMatch(/Clay bar treatment is a separate add-on/);
  });
  it("has distinct meta descriptions", () => {
    expect(new Set(LOCATION_PAGES.map((p) => p.metaDescription)).size).toBe(LOCATION_PAGES.length);
  });
});
