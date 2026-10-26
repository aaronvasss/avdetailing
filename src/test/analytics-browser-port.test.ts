import { afterEach, describe, expect, it, vi } from "vitest";
import { browserAnalyticsPort } from "@/lib/analytics-runtime";

afterEach(() => {
  document.getElementById("av-ga4-tag")?.remove();
  Reflect.deleteProperty(window, "avAnalyticsLayer");
  vi.restoreAllMocks();
});

describe("Google tag browser adapter (no external script executes)", () => {
  it("queues on its dedicated layer and fetches exactly the supplied tag without a document referrer", () => {
    const port = browserAnalyticsPort();
    const ready = vi.fn(); const failed = vi.fn();
    port.disable(true);
    port.command("consent", "default", { analytics_storage: "denied" });
    expect(document.getElementById("av-ga4-tag")).toBeNull();
    const cancel = port.load(ready, failed);
    const script = document.getElementById("av-ga4-tag");
    expect(script).toBeInstanceOf(HTMLScriptElement);
    if (!(script instanceof HTMLScriptElement)) throw new Error("Missing script");
    expect(script.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-YM2RWYQVNS&l=avAnalyticsLayer");
    expect(script.referrerPolicy).toBe("no-referrer");
    expect(Reflect.get(window, "ga-disable-G-YM2RWYQVNS")).toBe(true);
    // Synthetic DOM load only. jsdom never downloads or executes Google here.
    script.dispatchEvent(new Event("load"));
    expect(ready).toHaveBeenCalledTimes(1); expect(failed).not.toHaveBeenCalled();
    const layer = Reflect.get(window, "avAnalyticsLayer") as IArguments[];
    expect(Array.from(layer[0] || [])).toEqual(["consent", "default", { analytics_storage: "denied" }]);
    expect(Array.from(layer[1] || [])[0]).toBe("js");
    cancel(); expect(document.getElementById("av-ga4-tag")).toBeNull();
    script.dispatchEvent(new Event("load")); expect(ready).toHaveBeenCalledTimes(1);
  });
});