import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoogleRatingBadge } from "@/components/reviews/GoogleRatingBadge";
import { GoogleReviews } from "@/components/reviews/GoogleReviews";
const state = vi.hoisted(() => ({ data: null as unknown }));
vi.mock("@/lib/live-google-reviews", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/live-google-reviews")>(), useLiveGoogleReviews: () => state }));
describe("one shared live review source", () => {
  it("hides badges and reviews when the feed is empty", () => {
    state.data = null;
    const { container } = render(<><GoogleRatingBadge /><GoogleReviews /></>);
    expect(container.children.length).toBe(0);
  });
  it("renders actual source totals and five unmodified reviews", () => {
    state.data = { rating: 4.7, total_review_count: 142, google_maps_uri: "https://www.google.com/maps?cid=7061043489708478604", fetched_at: new Date(Date.now()-1000).toISOString(), expires_at: new Date(Date.now()+3600000).toISOString(), reviews: Array.from({length:5}, (_,i) => ({reviewer:{displayName:`Mock ${i}`},starRating:"FOUR",comment:`Original fixture text ${i}`,createTime:"2026-10-20T00:00:00Z",updateTime:"2026-10-20T00:00:00Z"})) };
    render(<><GoogleRatingBadge /><GoogleReviews /></>);
    expect(screen.getByText("4.7 · 142 Google reviews")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5);
    for(let i=0;i<5;i++) expect(screen.getByText(`Original fixture text ${i}`)).toBeInTheDocument();
  });
});