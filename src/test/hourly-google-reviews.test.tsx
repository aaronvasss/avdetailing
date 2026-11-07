import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { REVIEW_REFRESH_MS, reviewRefreshDue } from "../../supabase/functions/google-reviews/model";
import { parseLiveGoogleReviews } from "@/lib/live-google-reviews";
import { AdminReviewRefresh } from "@/components/admin/AdminReviewRefresh";
const mock = vi.hoisted(() => ({ invoke: vi.fn(), data: null as unknown }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mock.invoke } } }));
vi.mock("@/lib/live-google-reviews", async original => ({ ...await original<typeof import("@/lib/live-google-reviews")>(), useLiveGoogleReviews: () => ({ data: mock.data }) }));
const snapshot = { rating: 5, total_review_count: 7, reviews: [{ reviewer: { displayName: "Fixture" }, starRating: "FIVE", createTime: "2026-11-06T00:00:00Z", updateTime: "2026-11-06T00:00:00Z" }], google_maps_uri: "https://www.google.com/maps?cid=7061043489708478604", fetched_at: "2026-11-07T00:00:00Z", expires_at: "2026-11-08T00:00:00Z" };
describe("hourly review freshness and retained display", () => {
  it("refreshes exactly after one hour", () => {
    expect(REVIEW_REFRESH_MS).toBe(3600000);
    expect(reviewRefreshDue(snapshot.fetched_at, Date.parse(snapshot.fetched_at) + 3599999)).toBe(false);
    expect(reviewRefreshDue(snapshot.fetched_at, Date.parse(snapshot.fetched_at) + 3600000)).toBe(true);
  });
  it("allows stale content during refresh but never beyond retention", () => {
    expect(parseLiveGoogleReviews(snapshot, Date.parse(snapshot.fetched_at) + 7200000)?.total_review_count).toBe(7);
    expect(parseLiveGoogleReviews(snapshot, Date.parse(snapshot.expires_at))).toBeNull();
  });
  it("forces admin refresh through the function and updates the shared query", async () => {
    const fresh = { ...snapshot, fetched_at: new Date(Date.now()-1000).toISOString(), expires_at: new Date(Date.now()+3600000).toISOString() };
    mock.data = fresh;
    mock.invoke.mockResolvedValue({ data: { cache: fresh }, error: null });
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><AdminReviewRefresh /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Refresh reviews now" }));
    await waitFor(() => expect(mock.invoke).toHaveBeenCalledWith("google-reviews", { body: { force: true } }));
    await waitFor(() => expect(client.getQueryData(["live-google-reviews"])).toEqual(fresh));
  });
});