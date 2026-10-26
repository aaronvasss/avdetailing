import {
  ANALYTICS_ORIGIN, ANALYTICS_RELEASE, GA4_MEASUREMENT_ID,
  publicAnalyticsPage, safeAnalyticsReferrer,
  type AnalyticsPreference,
} from "./analytics-policy";
import { safeMeasurementEvent, type MeasurementEvent } from "./analytics-events";

type Command = (command: string, ...args: unknown[]) => void;
export interface AnalyticsPort {
  origin: () => string;
  pathname: () => string;
  referrer: () => string;
  disable: (disabled: boolean) => void;
  command: Command;
  load: (ready: () => void, failed: () => void) => () => void;
}
type Gates = { releaseAuthorized: boolean; streamSettingsVerified: boolean };
const DENIED = { analytics_storage: "denied", ad_storage: "denied",
  ad_user_data: "denied", ad_personalization: "denied" };

/** The sole page_view owner. Ports make every test network-free. */
export class AnalyticsRuntime {
  private preference: AnalyticsPreference = "unset";
  private path = "";
  private previousPublic = "";
  private sentPath: string | null = null;
  private loaded = false;
  private pending = false;
  private generation = 0;
  private cancelLoad?: () => void;
  private handled = new WeakSet<object>();

  constructor(private port: AnalyticsPort, private gates: Gates = ANALYTICS_RELEASE) {
    this.port.disable(true);
  }

  private eligible() {
    return this.gates.releaseAuthorized && this.gates.streamSettingsVerified &&
      this.port.origin() === ANALYTICS_ORIGIN && this.preference === "accepted" &&
      Boolean(publicAnalyticsPage(this.path));
  }

  setPreference(preference: AnalyticsPreference) {
    this.preference = preference;
    if (preference !== "accepted") {
      // ga-disable is Google's documented hard collection switch. Do not send
      // a denied-consent update: basic mode must not start cookieless pings.
      this.port.disable(true);
      this.generation++;
      this.cancelLoad?.();
      this.cancelLoad = undefined;
      this.pending = false;
      this.sentPath = null;
    }
    this.sync();
  }

  navigate(pathname: string) {
    if (pathname !== this.path) {
      // Disable synchronously BEFORE history changes (including private routes).
      this.port.disable(true);
      this.previousPublic = publicAnalyticsPage(this.path)?.page_location || "";
      this.path = pathname;
      this.sentPath = null;
    }
    this.sync();
  }

  private sync() {
    if (!this.eligible()) {
      this.port.disable(true);
      // A script still downloading must never configure on a private page.
      if (this.pending) {
        this.generation++;
        this.cancelLoad?.();
        this.cancelLoad = undefined;
        this.pending = false;
      }
      return;
    }
    if (!this.loaded && !this.pending) {
      this.pending = true;
      const generation = ++this.generation;
      // Local queue only; no script/network until eligibility and opt-in.
      this.port.command("consent", "default", DENIED);
      this.cancelLoad = this.port.load(() => {
        if (generation !== this.generation || !this.eligible()) return;
        this.pending = false;
        this.loaded = true;
        this.configure();
      }, () => {
        if (generation !== this.generation) return;
        this.pending = false;
        this.port.disable(true);
        this.cancelLoad?.();
        this.cancelLoad = undefined;
      });
    } else if (this.loaded) this.configure();
  }

  private configure() {
    const page = publicAnalyticsPage(this.path);
    if (!page || !this.eligible() || this.sentPath === this.path) return;
    // Overrides also cover GA's session/engagement metadata. All Enhanced
    // Measurement options must be OFF in the verified stream (not a JS flag).
    const referrer = this.previousPublic || safeAnalyticsReferrer(this.port.referrer());
    this.port.command("config", GA4_MEASUREMENT_ID, {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...page, page_referrer: referrer,
    });
    this.port.command("consent", "update", { ...DENIED, analytics_storage: "granted" });
    this.port.disable(false);
    this.port.command("event", "page_view", { ...page, page_referrer: referrer });
    this.sentPath = this.path;
  }

  /** Drop (never queue/replay) unconsented, private, pre-load or disabled activity. */
  track(event: MeasurementEvent | null, occurrence: object) {
    if (!event || this.handled.has(occurrence)) return;
    this.handled.add(occurrence);
    if (!this.eligible() || !this.loaded) return;
    const safe = safeMeasurementEvent(event);
    const page = publicAnalyticsPage(this.path);
    if (!safe || !page) return;
    try {
      this.port.command("event", safe.name, { ...safe.params, ...page,
        page_referrer: this.previousPublic || safeAnalyticsReferrer(this.port.referrer()) });
    } catch { /* Measurement must never break the customer's action. */ }
  }

  dispose() {
    this.port.disable(true);
    this.generation++;
    this.cancelLoad?.();
    this.pending = false;
  }
}

type AnalyticsWindow = Window & {
  avAnalyticsLayer?: IArguments[];
  [key: `ga-disable-${string}`]: boolean;
};

/** One dedicated Google tag/data layer; never invoke unrelated site integrations. */
export function browserAnalyticsPort(): AnalyticsPort {
  const w = window as unknown as AnalyticsWindow;
  const command: Command = function (command, ...args) {
    void command; void args;
    w.avAnalyticsLayer = w.avAnalyticsLayer || [];
    w.avAnalyticsLayer.push(arguments);
  };
  return {
    origin: () => window.location.origin,
    pathname: () => window.location.pathname,
    referrer: () => document.referrer,
    disable: disabled => { w[`ga-disable-${GA4_MEASUREMENT_ID}`] = disabled; },
    command,
    load: (ready, failed) => {
      const script = document.createElement("script");
      script.id = "av-ga4-tag";
      script.async = true;
      // The browser must not transmit its raw document URL with the script fetch.
      script.referrerPolicy = "no-referrer";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}&l=avAnalyticsLayer`;
      script.onload = () => { command("js", new Date()); ready(); };
      script.onerror = failed;
      document.head.appendChild(script);
      return () => {
        script.onload = null; script.onerror = null;
        script.remove();
        // Discard unprocessed commands if consent/navigation interrupted load.
        if (!w.avAnalyticsLayer?.some(item => item[0] === "config")) w.avAnalyticsLayer = [];
      };
    },
  };
}

/** History hooks close the private-route gate before Google can observe history. */
export function observeAnalyticsNavigation(runtime: AnalyticsRuntime): () => void {
  const push = history.pushState;
  const replace = history.replaceState;
  const before = (url?: string | URL | null) => {
    if (url == null) return;
    try { runtime.navigate(new URL(String(url), window.location.href).pathname); }
    catch { runtime.navigate(""); }
  };
  history.pushState = function (data, unused, url) {
    before(url); return push.call(this, data, unused, url);
  };
  history.replaceState = function (data, unused, url) {
    before(url); return replace.call(this, data, unused, url);
  };
  const pop = () => runtime.navigate(window.location.pathname);
  window.addEventListener("popstate", pop, true);
  return () => {
    history.pushState = push; history.replaceState = replace;
    window.removeEventListener("popstate", pop, true);
  };
}