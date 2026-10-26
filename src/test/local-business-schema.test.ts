import { describe, it, expect } from "vitest";
import { localBusinessSchema } from "@/components/seo/schema";
import { GOOGLE_REVIEWS_URL } from "@/lib/google-business";

describe("localBusinessSchema", () => {
  const s = localBusinessSchema() as Record<string, unknown>;
  it("points hasMap at the business's own Google Maps listing", () => {
    expect(s.hasMap).toBe(GOOGLE_REVIEWS_URL);
  });
  it("has no business coordinates or street address", () => {
    expect(s.geo).toBeUndefined();
    expect((s.address as Record<string, unknown>).streetAddress).toBeUndefined();
  });
  it("keeps one stable entity with the public phone and email", () => {
    expect(s["@id"]).toBe("https://avdetailing.net/#business");
    expect(s.telephone).toBe("+12255216264");
    expect(s.email).toBe("aaronvasquez@avdetailing.com");
    expect(s.aggregateRating).toBeUndefined();
  });
});
