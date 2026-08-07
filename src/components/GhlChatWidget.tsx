import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// A2P 10DLC compliance: the chat widget must NOT appear on any page that
// collects phone numbers or SMS opt-in consent (booking, contact, membership
// signup, auth, account, admin, worker portals, etc.).
const EXCLUDED_PREFIXES = [
  "/book",
  "/booking",
  "/cancel",
  "/rate",
  "/contact",
  "/memberships", // membership signup modal collects phone + SMS consent
  "/auth",
  "/account",
  "/admin",
  "/worker",
  "/reschedule",
];

const WIDGET_SCRIPT_ID = "ghl-chat-widget-loader";
const WIDGET_SRC = "https://beta.leadconnectorhq.com/loader.js";
const WIDGET_ID = "6a22e4bc60f718013c4292e3";
const RESOURCES_URL = "https://beta.leadconnectorhq.com/chat-widget/loader.js";

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function removeWidget() {
  // Remove the loader script
  document.getElementById(WIDGET_SCRIPT_ID)?.remove();
  // Remove the chat-widget loader scripts (esm + nomodule) added by loader.js
  document
    .querySelectorAll(
      'script[src*="leadconnectorhq.com/chat-widget"], script[src*="beta.leadconnectorhq.com"]'
    )
    .forEach((el) => el.remove());
  // Remove any widget DOM the loader injected (covers <chat-widget>, lc-* prefixes, and stray ion-loading overlays from the widget)
  document
    .querySelectorAll(
      "chat-widget, [id^='lc_chat'], [id^='leadconnector'], .lc_text-widget, lc-chat-widget, ion-loading, ion-app"
    )
    .forEach((el) => el.remove());
}


function injectWidget() {
  if (document.getElementById(WIDGET_SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = WIDGET_SCRIPT_ID;
  s.src = WIDGET_SRC;
  s.async = true;
  s.setAttribute("data-resources-url", RESOURCES_URL);
  s.setAttribute("data-widget-id", WIDGET_ID);
  document.body.appendChild(s);
}

/**
 * Runs `cb` once the page is idle after load, or immediately on the first user
 * interaction — whichever happens first. Keeps the third-party chat bundle off
 * the critical path without changing behaviour.
 */
function whenIdleOrInteraction(cb: () => void): () => void {
  let done = false;
  let timer: number | undefined;
  const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    cb();
  };

  const cleanup = () => {
    if (timer) window.clearTimeout(timer);
    events.forEach((e) => window.removeEventListener(e, run));
    window.removeEventListener("load", schedule);
  };

  const schedule = () => {
    timer = window.setTimeout(run, 1500);
  };

  events.forEach((e) => window.addEventListener(e, run, { passive: true, once: true }));

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule);

  return cleanup;
}

export function GhlChatWidget() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (isExcludedPath(pathname)) {
      removeWidget();
      return;
    }
    if (document.getElementById(WIDGET_SCRIPT_ID)) return;
    return whenIdleOrInteraction(injectWidget);
  }, [pathname]);

  return null;
}
