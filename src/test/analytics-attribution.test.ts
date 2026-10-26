import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_ORIGIN, ANALYTICS_RELEASE, safeAnalyticsReferrer } from "@/lib/analytics-policy";
import { AnalyticsRuntime, type AnalyticsPort } from "@/lib/analytics-runtime";

const AIRCRAFT = "/aircraft-detailing-baton-rouge";
const OPEN = { releaseAuthorized: true, streamSettingsVerified: true };
function fixture(referrer = "", initialPath = AIRCRAFT, gates = OPEN, origin = ANALYTICS_ORIGIN) {
  const command = vi.fn();
  const disable = vi.fn();
  const readReferrer = vi.fn(() => referrer);
  let ready = () => {};
  const load = vi.fn((callback: () => void) => { ready = callback; return vi.fn(); });
  const port: AnalyticsPort = { origin: () => origin, pathname: () => initialPath,
    referrer: readReferrer, command, disable, load };
  const runtime = new AnalyticsRuntime(port, gates);
  runtime.navigate(initialPath);
  const hits = () => command.mock.calls.filter(call => call[0] === "event" && call[1] === "page_view");
  const referrers = () => hits().map(call => call[2].page_referrer);
  const accept = () => { runtime.setPreference("accepted"); ready(); };
  return { runtime, command, disable, load, readReferrer, hits, referrers, accept, ready: () => ready() };
}

describe("sanitized SEO referrer policy", () => {
  it.each([
    ["https://www.google.com/search/person@example.com?q=email%40example.com&token=secret#contact", "https://www.google.com"],
    ["https://www.bing.com/search/email@example.com?q=secret&contact=person@example.com#token", "https://www.bing.com"],
    ["https://duckduckgo.com/?q=person@example.com#secret", "https://duckduckgo.com"],
    ["https://search.yahoo.com/search?p=person@example.com", "https://search.yahoo.com"],
    ["https://www.google.co.uk/search?q=secret", "https://www.google.co.uk"],
    ["https://avdetailing.net/book?service=aircraft&email=person@example.com#token", "https://avdetailing.net/book"],
  ])("reduces %s to safe context", (input, expected) => {
    expect(safeAnalyticsReferrer(input)).toBe(expected);
  });
  it.each([
    "https://person@example.com:secret@www.google.com/search?q=private",
    "https://person:secret@avdetailing.net/contact",
    "https://www.google.com.evil.test/search", "https://evilgoogle.com/",
    "https://google.com@evil.test/", "https://bing.com.evil.test/",
    "https://www.duckduckgo.com.evil.test/", "https://search.yahoo.com.evil.test/",
    "https://googłe.com/", "https://www.google.com:444/search", "http://google.com/search",
    "https://example.org/?utm_source=google", "https://www.google.de/search",
    "https://avdetailing.net/account?token=secret", "https://avdetailing.net/unknown?email=secret",
    "https://avdetailing.net/auth", "https://avdetailing.net/booking/manage#token",
    "https://avdetailing.net/contact/", "", "not a URL", "javascript:alert(1)",
  ])("omits credentials, lookalikes, unknown or private input %s", input => {
    expect(safeAnalyticsReferrer(input)).toBe("");
  });
});

describe("network-free first-consented-hit attribution", () => {
  it.each(["https://www.google.com", "https://www.bing.com"])("preserves %s across public navigation before consent", source => {
    const h = fixture(`${source}/search/person@example.com?q=secret#token`);
    h.runtime.navigate("/car-detailing-baton-rouge");
    h.runtime.navigate("/book");
    expect(h.command).not.toHaveBeenCalled(); expect(h.load).not.toHaveBeenCalled();
    h.accept();
    h.runtime.navigate("/book"); h.runtime.setPreference("accepted");
    expect(h.referrers()).toEqual([source]);
    expect(h.hits()[0]?.[2].page_location).toBe(`${ANALYTICS_ORIGIN}/book`);
    h.runtime.track({ name: "contact_click", params: { method: "call" } }, {});
    expect(h.command).toHaveBeenLastCalledWith("event", "contact_click", expect.objectContaining({ page_referrer: source }));
    h.runtime.navigate("/contact"); h.runtime.navigate("/contact");
    h.runtime.navigate("/car-detailing-baton-rouge");
    expect(h.referrers()).toEqual([source, `${ANALYTICS_ORIGIN}/book`, `${ANALYTICS_ORIGIN}/contact`]);
    expect(h.readReferrer).toHaveBeenCalledTimes(1);
    expect(h.load).toHaveBeenCalledTimes(1);
    const payload = JSON.stringify(h.command.mock.calls);
    expect(payload).not.toMatch(/secret|person@example|#token|\/search|booking_submitted|generate_lead/);
  });
  it.each(["", "https://unknown.test/?utm_source=google"])("keeps omitted/direct arrival empty on the first hit (%s)", input => {
    const h = fixture(input); h.runtime.navigate("/book"); h.accept();
    expect(h.referrers()).toEqual([""]);
    h.runtime.navigate("/contact");
    expect(h.referrers()).toEqual(["", `${ANALYTICS_ORIGIN}/book`]);
  });
  it("retains an allowlisted same-origin arrival but strips all sensitive URL content", () => {
    const h = fixture(`${ANALYTICS_ORIGIN}/contact?email=secret#token`);
    h.runtime.navigate("/book"); h.accept();
    expect(h.referrers()).toEqual([`${ANALYTICS_ORIGIN}/contact`]);
  });
  it.each(["/account", "/unknown"])("drops entry attribution across pre-consent excluded route %s", path => {
    const h = fixture("https://www.google.com/search?q=secret");
    h.runtime.navigate(path); h.runtime.navigate("/book"); h.accept();
    expect(h.referrers()).toEqual([""]);
    expect(JSON.stringify(h.command.mock.calls)).not.toContain(path);
  });
  it("does not capture a search arrival on an initially private page", () => {
    const h = fixture("https://www.google.com/search?q=secret", "/account");
    h.runtime.navigate("/book"); h.accept();
    expect(h.readReferrer).not.toHaveBeenCalled(); expect(h.referrers()).toEqual([""]);
  });
  it("drops source on explicit decline and never replays revoked/private activity", () => {
    const h = fixture("https://www.google.com/search?q=secret");
    h.runtime.setPreference("declined"); h.runtime.navigate("/book"); h.accept();
    expect(h.referrers()).toEqual([""]);
    h.runtime.setPreference("declined");
    const before = h.command.mock.calls.length;
    const occurrence = {};
    h.runtime.navigate("/account");
    h.runtime.track({ name: "contact_click", params: { method: "text" } }, occurrence);
    h.runtime.navigate("/contact");
    expect(h.command).toHaveBeenCalledTimes(before); expect(h.disable).toHaveBeenLastCalledWith(true);
    h.runtime.setPreference("accepted");
    h.runtime.track({ name: "contact_click", params: { method: "text" } }, occurrence);
    expect(h.referrers()).toEqual(["", ""]);
    expect(h.command.mock.calls.filter(call => call[1] === "contact_click")).toHaveLength(0);
  });
  it("never restores search referrer after collected public → private → public transitions", () => {
    const h = fixture("https://www.google.com/search?q=secret"); h.accept();
    h.runtime.navigate("/account"); h.runtime.navigate("/contact");
    expect(h.referrers()).toEqual(["https://www.google.com", ""]);
  });
  it("drops source when private navigation interrupts the pending loader", () => {
    const h = fixture("https://www.bing.com/search?q=secret");
    h.runtime.setPreference("accepted"); h.runtime.navigate("/account"); h.ready();
    expect(h.hits()).toHaveLength(0);
    h.runtime.navigate("/book"); h.ready();
    expect(h.referrers()).toEqual([""]);
  });
  it("retains real release gates and canonical-host-only collection", () => {
    expect(ANALYTICS_RELEASE).toEqual({ releaseAuthorized: false, streamSettingsVerified: false });
    for (const h of [fixture("https://google.com/search", AIRCRAFT, ANALYTICS_RELEASE),
      fixture("https://google.com/search", AIRCRAFT, OPEN, "http://localhost:8080")]) {
      h.runtime.navigate("/book"); h.accept();
      expect(h.load).not.toHaveBeenCalled(); expect(h.command).not.toHaveBeenCalled();
    }
  });
});