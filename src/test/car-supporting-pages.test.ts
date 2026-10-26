import { describe, it, expect } from "vitest";
import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";

const SLUGS = ["exterior-detailing-baton-rouge", "headlight-restoration-baton-rouge", "odor-removal-baton-rouge", "pet-hair-removal-baton-rouge", "engine-bay-cleaning-baton-rouge"];
const BANNED = /ozone|enzyme|HEPA|permanent|allergen|80%|full brightness|electronics|steam|guarantee|\.gov|nhtsa|epa\b|not confirmed|clay-bar decontamination included/i;
const pages = SLUGS.map((s) => SERVICE_LANDING_PAGES.find((p) => p.slug === s)!);
const text = (p: (typeof pages)[number]) => [p.title, p.seoTitle, p.metaDescription, p.intro, ...p.steps, ...p.whyChoose].join(" ");

describe("car supporting pages", () => {
  it("are car pages without authority-link filler or unsupported claims", () => {
    for (const p of pages) {
      expect(p.carPage).toBe(true);
      expect(p.link1.url + p.link2.url).toBe("");
      expect(text(p)).not.toMatch(BANNED);
    }
  });
  it("have distinct titles and descriptions", () => {
    expect(new Set(pages.map((p) => p.seoTitle)).size).toBe(5);
    expect(new Set(pages.map((p) => p.metaDescription)).size).toBe(5);
  });
  it("headlight and engine bay are booked as add-ons; odor and pet hair ask for details first", () => {
    expect(text(pages[1])).toMatch(/add-ons step/);
    expect(text(pages[4])).toMatch(/add-ons step/);
    for (const p of [pages[2], pages[3]]) expect(text(p)).toMatch(/confirm the scope/);
  });
  it("exterior page does not promise clay bar in every wash", () => {
    expect(text(pages[0])).toMatch(/Clay bar treatment is a separate add-on/);
  });
});
