import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AnalyticsConsentProvider, AnalyticsSettingsControl } from "@/components/analytics/AnalyticsConsent";
import { ANALYTICS_PREFERENCE_KEY } from "@/lib/analytics-policy";

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const view = (path = "/") => render(<MemoryRouter initialEntries={[path]}><AnalyticsConsentProvider>
  <AnalyticsSettingsControl /><a href="/book">Book now</a>
</AnalyticsConsentProvider></MemoryRouter>);

describe("optional analytics controls", () => {
  it.each(["/account", "/booking/manage?token=private", "/unknown"])("does not prompt or load on initial excluded path %s", async path => {
    const append = vi.spyOn(document.head, "appendChild");
    view(path);
    fireEvent.click(screen.getByRole("button", { name: "Analytics settings" }));
    expect(await screen.findByText("Current preference: Not chosen")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Optional analytics" })).toBeNull();
    expect(append.mock.calls.some(([node]) => node instanceof HTMLScriptElement && node.src.includes("googletagmanager"))).toBe(false);
  });
  it("lets customers decline, revisit settings, accept and revoke without Google requests or blocking booking", async () => {
    const append = vi.spyOn(document.head, "appendChild");
    view();
    await screen.findByRole("region", { name: "Optional analytics" });
    expect(screen.getByRole("link", { name: "Book now" })).toHaveAttribute("href", "/book");
    fireEvent.click(screen.getByRole("button", { name: "Decline analytics" }));
    expect(localStorage.getItem(ANALYTICS_PREFERENCE_KEY)).toBe("declined");
    expect(screen.queryByRole("region", { name: "Optional analytics" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Analytics settings" }));
    expect(await screen.findByText("Current preference: Declined")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Accept analytics" }));
    expect(localStorage.getItem(ANALYTICS_PREFERENCE_KEY)).toBe("accepted");
    fireEvent.click(screen.getByRole("button", { name: "Analytics settings" }));
    expect(await screen.findByText("Current preference: Accepted")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Decline analytics" }));
    await waitFor(() => expect(localStorage.getItem(ANALYTICS_PREFERENCE_KEY)).toBe("declined"));
    expect(append.mock.calls.some(([node]) => node instanceof HTMLScriptElement && node.src.includes("googletagmanager"))).toBe(false);
  });
  it("honors stored decline and changes from another tab", async () => {
    localStorage.setItem(ANALYTICS_PREFERENCE_KEY, "declined"); view();
    expect(screen.queryByRole("region", { name: "Optional analytics" })).toBeNull();
    localStorage.setItem(ANALYTICS_PREFERENCE_KEY, "accepted");
    fireEvent(window, new StorageEvent("storage", { key: ANALYTICS_PREFERENCE_KEY }));
    fireEvent.click(screen.getByRole("button", { name: "Analytics settings" }));
    expect(await screen.findByText("Current preference: Accepted")).toBeVisible();
  });
});