import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PUBLIC_PAYMENT_METHODS, PUBLIC_PAYMENT_ANSWER } from "@/lib/public-business-facts";
import { localBusinessSchema } from "@/components/seo/schema";

const banned = /\b(cash|venmo|cash app|zelle|efectivo)\b/i;

describe("card-only public payment copy", () => {
  it("lists only credit and debit cards", () => {
    expect([...PUBLIC_PAYMENT_METHODS]).toEqual(["Credit Card", "Debit Card"]);
  });
  it("schema paymentAccepted is card-only", () => {
    const s = (typeof localBusinessSchema === "function" ? (localBusinessSchema as any)() : localBusinessSchema) as any;
    expect(s.paymentAccepted).toBe("Credit Card, Debit Card");
  });
  it("FAQ answer says cards only and declines other methods", () => {
    expect(PUBLIC_PAYMENT_ANSWER).toMatch(/credit and debit cards only/);
    expect(PUBLIC_PAYMENT_ANSWER).toMatch(/do not accept cash, Venmo, Cash App or Zelle/);
  });
  it("Spanish pages and llms.txt never offer cash or app payments", () => {
    const es = readFileSync("src/lib/language-pages.ts", "utf8");
    expect(es).not.toMatch(/Aceptamos efectivo/);
    expect(es).toMatch(/Aceptamos solo tarjetas de crédito y débito/);
    const llms = readFileSync("public/llms.txt", "utf8").split("\n").find(l => l.startsWith("Payment methods"))!;
    expect(llms).toMatch(/credit and debit cards only/);
  });
  it("customer Payments tab has no external pay options", () => {
    const tab = readFileSync("src/components/account/PaymentsTab.tsx", "utf8");
    expect(tab).not.toMatch(/venmo_link|cashapp_link|zelle_link|Other Ways to Pay/);
  });
});
