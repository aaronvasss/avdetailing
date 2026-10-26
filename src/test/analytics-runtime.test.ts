import { describe, expect, it, vi } from "vitest";
import { AnalyticsRuntime, observeAnalyticsNavigation, type AnalyticsPort } from "@/lib/analytics-runtime";
import { ANALYTICS_ORIGIN, ANALYTICS_RELEASE, GA4_MEASUREMENT_ID, ANALYTICS_PUBLIC_PAGES,
  ANALYTICS_PREFERENCE_KEY, publicAnalyticsPage, readAnalyticsPreference, safeAnalyticsReferrer } from "@/lib/analytics-policy";

const OPEN = { releaseAuthorized: true, streamSettingsVerified: true };
function setup(origin = ANALYTICS_ORIGIN, gates = OPEN) {
  let ready: () => void = () => {};
  const commands = vi.fn();
  const disable = vi.fn();
  const cancel = vi.fn();
  const load = vi.fn((onReady: () => void) => { ready = onReady; return cancel; });
  const port: AnalyticsPort = { origin: () => origin, pathname: () => "/",
    referrer: () => "https://avdetailing.net/car-detailing-baton-rouge?email=secret#token",
    command: commands, disable, load };
  const runtime = new AnalyticsRuntime(port, gates);
  const events = () => commands.mock.calls.filter(args => args[0] === "event");
  return { runtime, commands, disable, load, cancel, events, ready: () => ready() };
}

describe("fail-closed GA4 collection", () => {
  it("uses the supplied Measurement ID with both activation gates closed", () => {
    expect(GA4_MEASUREMENT_ID).toBe("G-YM2RWYQVNS");
    expect(ANALYTICS_RELEASE).toEqual({ releaseAuthorized: false, streamSettingsVerified: false });
    const h = setup(ANALYTICS_ORIGIN, ANALYTICS_RELEASE);
    h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    expect(h.load).not.toHaveBeenCalled(); expect(h.commands).not.toHaveBeenCalled();
  });
  it.each([
    { releaseAuthorized: true, streamSettingsVerified: false },
    { releaseAuthorized: false, streamSettingsVerified: true },
  ])("requires BOTH release and stream verification: %j", gates => {
    const h = setup(ANALYTICS_ORIGIN, gates);
    h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    expect(h.load).not.toHaveBeenCalled(); expect(h.events()).toHaveLength(0);
  });
  it.each(["http://localhost:8080", "http://localhost:4173", "https://avdetailing.lovable.app",
    "https://id-preview--5268592b-be3a-4302-8986-c547b2ca2e04.lovable.app", "https://www.avdetailing.net", "http://avdetailing.net"])
  ("never loads on noncanonical preview/build origin %s even with consent", origin => {
    const h = setup(origin); h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    expect(h.load).not.toHaveBeenCalled(); expect(h.commands).not.toHaveBeenCalled();
  });
  it("has no script, commands or events before acceptance or after decline", () => {
    const h = setup(); h.runtime.navigate("/");
    expect(h.load).not.toHaveBeenCalled(); expect(h.commands).not.toHaveBeenCalled();
    h.runtime.setPreference("declined"); h.runtime.navigate("/contact");
    expect(h.load).not.toHaveBeenCalled(); expect(h.commands).not.toHaveBeenCalled();
  });
  it("loads once, uses denied ads controls and one manual pageview per public transition", () => {
    const h = setup(); h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    expect(h.load).toHaveBeenCalledTimes(1); expect(h.events()).toHaveLength(0);
    h.ready(); h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    expect(h.events()).toHaveLength(1);
    h.runtime.navigate("/car-detailing-baton-rouge");
    h.runtime.navigate("/boat-detailing-baton-rouge");
    expect(h.events()).toHaveLength(3); expect(h.load).toHaveBeenCalledTimes(1);
    expect(h.commands).toHaveBeenCalledWith("config", "G-YM2RWYQVNS", expect.objectContaining({
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    }));
    expect(h.commands).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
    const serialized = JSON.stringify(h.commands.mock.calls);
    expect(serialized).not.toContain("secret"); expect(serialized).not.toContain("#token");
  });
  it.each(["/account", "/admin", "/worker", "/auth", "/reset-password", "/booking/manage",
    "/booking/cancel", "/booking/success", "/cancel/private-id", "/rate/private-id", "/unknown", "/rv-interior-detailing-baton-rouge"])
  ("halts already-loaded tracking on excluded route %s", path => {
    const h = setup(); h.runtime.navigate("/"); h.runtime.setPreference("accepted"); h.ready();
    const before = h.commands.mock.calls.length;
    h.runtime.navigate(path);
    expect(h.disable).toHaveBeenLastCalledWith(true);
    expect(h.commands).toHaveBeenCalledTimes(before);
    expect(publicAnalyticsPage(path)).toBeNull();
    h.runtime.navigate("/contact");
    expect(h.events()).toHaveLength(2);
    expect(JSON.stringify(h.commands.mock.calls)).not.toContain(path === "/book" ? '"/book"' : `"${path}"`);
  });
  it("withdrawal sends no denied ping and stops events; reaccept does not reload the script", () => {
    const h = setup(); h.runtime.navigate("/"); h.runtime.setPreference("accepted"); h.ready();
    const before = h.commands.mock.calls.length;
    h.runtime.setPreference("declined"); h.runtime.navigate("/contact");
    expect(h.commands).toHaveBeenCalledTimes(before); expect(h.disable).toHaveBeenLastCalledWith(true);
    h.runtime.setPreference("accepted");
    expect(h.events()).toHaveLength(2); expect(h.load).toHaveBeenCalledTimes(1);
  });
  it.each(["decline", "private"])("guards a pending script completion after %s", mode => {
    const h = setup(); h.runtime.navigate("/"); h.runtime.setPreference("accepted");
    if (mode === "decline") h.runtime.setPreference("declined");
    else h.runtime.navigate("/booking/manage");
    h.ready();
    expect(h.cancel).toHaveBeenCalled(); expect(h.events()).toHaveLength(0);
    expect(h.disable).toHaveBeenLastCalledWith(true);
  });
  it("treats failed or unexpected stored consent as unset", () => {
    expect(readAnalyticsPreference({ getItem: () => "yes" })).toBe("unset");
    expect(readAnalyticsPreference({ getItem: () => { throw new Error("blocked"); } })).toBe("unset");
    expect(readAnalyticsPreference({ getItem: key => key === ANALYTICS_PREFERENCE_KEY ? "accepted" : null })).toBe("accepted");
  });
  it("only allows exact static public paths; referrers drop every query/hash or private/external URL", () => {
    expect(Object.keys(ANALYTICS_PUBLIC_PAGES)).toHaveLength(45);
    expect(publicAnalyticsPage("/contact?email=name@example.com")).toBeNull();
    expect(publicAnalyticsPage("/contact#secret")).toBeNull();
    expect(safeAnalyticsReferrer("https://avdetailing.net/contact?token=secret#name")).toBe("https://avdetailing.net/contact");
    expect(safeAnalyticsReferrer("https://avdetailing.net/account?token=secret")).toBe("");
    expect(safeAnalyticsReferrer("https://google.com/search?q=private")).toBe("");
  });
  it("intercepts private pushState before other history listeners and ignores query/hash-only duplicates", () => {
    const h = setup(); h.runtime.navigate("/"); h.runtime.setPreference("accepted"); h.ready();
    const stop = observeAnalyticsNavigation(h.runtime);
    try {
      history.pushState({}, "", "/?name=secret#token");
      expect(h.events()).toHaveLength(1);
      history.pushState({}, "", "/booking/manage?token=secret");
      expect(h.disable).toHaveBeenLastCalledWith(true); expect(h.events()).toHaveLength(1);
      history.replaceState({}, "", "/contact?email=secret#private");
      expect(h.events()).toHaveLength(2);
      expect(JSON.stringify(h.commands.mock.calls)).not.toContain("secret");
    } finally { stop(); history.replaceState({}, "", "/"); }
  });
});