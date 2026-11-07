import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminGoogleRatingSettings } from "@/components/admin/AdminGoogleRatingSettings";
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), value: "", error: null as unknown }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({
  select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: mocks.value }, error: mocks.error }) }) }),
  upsert: mocks.upsert,
}) } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
function mount() { return render(<QueryClientProvider client={new QueryClient()}><AdminGoogleRatingSettings /></QueryClientProvider>); }
beforeEach(() => { mocks.value = ""; mocks.error = null; mocks.upsert.mockReset().mockResolvedValue({ error: null }); });
describe("admin Google metric controls (mocked writes only)", () => {
  it("saves the verified pair atomically in one setting", async () => {
    mount();
    const rating = screen.getByLabelText("Google rating");
    await waitFor(() => expect(rating).not.toBeDisabled());
    fireEvent.change(rating, { target: { value: "4.8" } });
    fireEvent.change(screen.getByLabelText("Total Google reviews"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Google rating" }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ key: "google_review_summary", value: '{"rating":4.8,"count":123}' }), { onConflict: "key" }));
  });
  it("clearing both fields hides the badge without inventing defaults", async () => {
    mount(); await waitFor(() => expect(screen.getByLabelText("Google rating")).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Save Google rating" }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ value: "" }), { onConflict: "key" }));
  });
  it("does not overwrite a failed read", async () => {
    mocks.error = new Error("unavailable"); mount();
    await screen.findByText("Could not load saved values. Reload before editing.");
    expect(screen.getByRole("button", { name: "Save Google rating" })).toBeDisabled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});