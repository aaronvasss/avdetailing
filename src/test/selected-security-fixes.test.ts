import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { csvCell } from "../lib/csv-cell";
import { membershipPriceMatches, MEMBERSHIP_PRICE_IDS } from "../../supabase/functions/_shared/membership-identity";

describe("Selected security fixes", () => {
  it.each(["=HYPERLINK(\"x\")", "+cmd", "-cmd", "@SUM(1)", "  =1", "\t=1", "\r=1", "\uFEFF=1"])("neutralizes formula %s", value => {
    expect(csvCell(value).startsWith('"\'')).toBe(true);
  });
  it("escapes CSV delimiters without losing ordinary content", () => {
    expect(csvCell('Jane, "Customer"')).toBe('"Jane, ""Customer"""');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(125)).toBe('"125"');
  });
  it("uses safe CSV cells in all three selected exports", () => {
    for (const name of ["AdminAppointmentsTab", "AdminAnalyticsTab"]) {
      const source = readFileSync(`src/components/admin/${name}.tsx`, "utf8");
      expect(source).toContain('import { csvCell }');
      expect(source).not.toContain('const s = String(v ?? "")');
    }
  });
  it("matches membership privileges to the actual purchased price", () => {
    for (const [slug, price] of Object.entries(MEMBERSHIP_PRICE_IDS)) {
      expect(membershipPriceMatches(slug, [price])).toBe(true);
      expect(membershipPriceMatches(slug, ["price_untrusted"])).toBe(false);
      expect(membershipPriceMatches(slug, [price, price])).toBe(false);
    }
    expect(membershipPriceMatches("toString", ["anything"])).toBe(false);
    expect(membershipPriceMatches("weekly-premium", [MEMBERSHIP_PRICE_IDS.monthly])).toBe(false);
  });
  it("validates plan identity before signup or webhook side effects", () => {
    const checkout = readFileSync("supabase/functions/create-membership-checkout/index.ts", "utf8");
    expect(checkout.indexOf('plan.slug !== body.plan_slug')).toBeLessThan(checkout.indexOf('.insert({'));
    const webhook = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    expect(webhook.indexOf('!membershipPriceMatches(')).toBeLessThan(webhook.indexOf('inviteUserByEmail('));
  });
  it("does not log the selected email or phone diagnostics", () => {
    for (const name of ["create-checkout", "create-deposit-checkout", "create-membership-checkout", "check-subscription", "customer-portal"]) {
      const source = readFileSync(`supabase/functions/${name}/index.ts`, "utf8");
      expect(source).not.toMatch(/logStep\([^\n]*email:/);
    }
    const sms = readFileSync("supabase/functions/send-sms/index.ts", "utf8");
    expect(sms).not.toContain("claimsData.claims.email");
    expect(sms).not.toContain('to ${formatPhoneNumber(body.to)}');
  });
  it("does not let public contact matching overwrite CRM records", () => {
    const source = readFileSync("supabase/functions/create-booking/index.ts", "utf8");
    expect(source).toContain('if (isCallerStaff && Object.keys(updatePayload).length > 0)');
  });
});