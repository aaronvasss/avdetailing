import { describe, expect, it } from "vitest";
import { localBusinessSchema } from "@/components/seo/schema";
import { PUBLIC_OPENING_HOURS_SPECIFICATION } from "@/lib/public-business-facts";

describe("owner-confirmed daily public hours", () => {
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
    it(`${day} is open 06:00–20:00`, () => {
      const hours = localBusinessSchema().openingHoursSpecification.find(h => h.dayOfWeek === `https://schema.org/${day}`);
      expect(hours?.opens).toBe("06:00");
      expect(hours?.closes).toBe("20:00");
    });
  }
  it("contains exactly all seven days", () => expect(PUBLIC_OPENING_HOURS_SPECIFICATION).toHaveLength(7));
});