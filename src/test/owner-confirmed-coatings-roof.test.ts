import { describe, it, expect } from "vitest";
import { SERVICE_LANDING_BY_SLUG } from "@/data/serviceLandingPages";
import { RV_EXTERIOR_LINKS } from "@/lib/rv-seo";

const txt = (slug: string) => JSON.stringify(SERVICE_LANDING_BY_SLUG[slug]);

describe("owner-confirmed coating and roof facts", () => {
  it("car ceramic page names System X without certification or authority filler", () => {
    const t = txt("ceramic-coating-baton-rouge");
    expect(t).toMatch(/System X/);
    expect(t).not.toMatch(/certif|industry-leading|most respected|semi-permanent|consumerreports|deq\.louisiana/i);
  });
  it("boat coating is a separate System X service from Premium Detail's sealant, quote-based", () => {
    const t = txt("boat-ceramic-coating-baton-rouge");
    expect(t).toMatch(/System X/);
    expect(t).toMatch(/separate service/);
    expect(t).toMatch(/Premium Detail.*ceramic sealant/);
    expect(t).not.toMatch(/\$\d/);
  });
  it("RV roof cleaning is offered and assessed, not reviewed case by case", () => {
    const t = txt("rv-roof-cleaning-baton-rouge");
    expect(t).toMatch(/offers RV roof cleaning/);
    expect(t).toMatch(/material/);
    expect(t).not.toMatch(/case by case|seal repair|pressure/i);
    expect(RV_EXTERIOR_LINKS.some((l) => l.href === "/rv-roof-cleaning-baton-rouge")).toBe(true);
  });
  it("no System X claim on aviation pages", () => {
    for (const s of ["aircraft-cleaning-baton-rouge", "aircraft-interior-detailing-baton-rouge", "aircraft-paint-protection-baton-rouge"])
      expect(txt(s)).not.toMatch(/System X/);
  });
});
