import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InquiryForm } from "@/components/forms/InquiryForm";

const mocks = vi.hoisted(() => ({ measure: vi.fn(), email: vi.fn(), insert: vi.fn() }));
vi.mock("@/components/analytics/AnalyticsConsent", () => ({ useLeadMeasurement: () => mocks.measure }));
vi.mock("@/lib/email", () => ({ sendContactEmail: mocks.email }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert: mocks.insert }) } }));
vi.mock("@/lib/security", () => ({ checkRateLimit: () => ({ allowed: true }), clearRateLimit: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.insert.mockResolvedValue({ error: null }); mocks.email.mockResolvedValue({ success: true }); });
function view() {
  render(<InquiryForm source="mock-form" serviceContext="Aircraft Detailing" />);
  for (const [name, value] of [["First Name", "Mock"], ["Last Name", "Customer"], ["Email", "mock@example.com"], ["Phone", "2255550123"],
    ["How can we help? (about Aircraft Detailing)", "Synthetic assessment request"]]) fireEvent.change(screen.getByLabelText(name), { target: { value } });
  const form = screen.getByRole("button", { name: "Send Message" }).closest("form");
  if (!form) throw new Error("Missing form");
  return form;
}
describe("actual inquiry outcome hook (fully mocked)", () => {
  it("uses explicit API success, a fixed service enum and no form contents", async () => {
    fireEvent.submit(view());
    await waitFor(() => expect(mocks.measure).toHaveBeenCalledTimes(1));
    expect(mocks.measure.mock.calls[0]?.[0]).toEqual({ name: "generate_lead", params: {
      service_type: "aircraft", quote_category: "aircraft_quote", submission_state: "received" } });
    expect(JSON.stringify(mocks.measure.mock.calls)).not.toMatch(/mock@example|225555|Synthetic|Customer/);
  });
  it("validation failure never reaches the API or measurement", () => {
    const form = view(); fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } }); fireEvent.submit(form);
    expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.measure).not.toHaveBeenCalled();
  });
  it("API error never measures success", async () => {
    mocks.email.mockRejectedValue(new Error("Mock API failure")); fireEvent.submit(view());
    await waitFor(() => expect(screen.getByRole("button", { name: "Send Message" })).not.toBeDisabled());
    expect(mocks.measure).not.toHaveBeenCalled();
  });
  it("insert failure never reaches the email API or conversion hook", async () => {
    mocks.insert.mockResolvedValue({ error: new Error("Mock insert failure") }); fireEvent.submit(view());
    await waitFor(() => expect(screen.getByRole("button", { name: "Send Message" })).not.toBeDisabled());
    expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.measure).not.toHaveBeenCalled();
  });
  it("a resolved false-success response does not create a conversion", async () => {
    mocks.email.mockResolvedValue({ success: false }); fireEvent.submit(view());
    await waitFor(() => expect(mocks.measure).toHaveBeenCalledWith(null, expect.any(Object)));
  });
  it("double success handling shares one local occurrence without changing API behavior", async () => {
    let resolve: (value: { success: boolean }) => void = () => {};
    const response = new Promise<{ success: boolean }>(r => { resolve = r; }); mocks.email.mockReturnValue(response);
    const form = view(); fireEvent.submit(form); fireEvent.submit(form);
    await waitFor(() => expect(mocks.email).toHaveBeenCalledTimes(2)); resolve({ success: true });
    await waitFor(() => expect(mocks.measure).toHaveBeenCalledTimes(2));
    expect(mocks.measure.mock.calls[0]?.[1]).toBe(mocks.measure.mock.calls[1]?.[1]);
    // Runtime WeakSet coverage verifies this occurrence sends exactly one event.
  });
});