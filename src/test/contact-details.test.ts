import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { localBusinessSchema } from "@/components/seo/schema";

const EMAIL = "aaronvasquez@avdetailingg.com"; // owner-confirmed, not a typo
const FILES = [
  "src/components/layout/Footer.tsx",
  "src/pages/ContactPage.tsx",
  "src/pages/PrivacyPolicyPage.tsx",
  "src/pages/TermsAndConditionsPage.tsx",
  "src/components/account/BookingDetailsDialog.tsx",
  "src/components/seo/schema.ts",
];

describe("public contact details", () => {
  it("business schema uses the exact owner-confirmed email and phone", () => {
    const s = localBusinessSchema() as Record<string, unknown>;
    expect(s.email).toBe(EMAIL);
    expect(String(s.telephone)).toMatch(/225.?521.?6264/);
  });
  it.each(FILES)("%s links mailto to the confirmed email and never the single-g domain", (f) => {
    const src = readFileSync(f, "utf8");
    expect(src).toContain(EMAIL);
    expect(src).not.toMatch(/aaronvasquez@avdetailing\.com/);
  });
});
