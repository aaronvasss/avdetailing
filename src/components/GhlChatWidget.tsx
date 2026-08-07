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

const WIDGET_DOM_SELECTOR = [
  "chat-widget",
  "lc-chat-widget",
  "[id^='lc_chat']",
  "[id^='lc_']",
  "[id^='leadconnector']",
  ".lc_text-widget",
  "ion-loading",
  "ion-backdrop",
  "ion-app",
  "iframe[src*='leadconnectorhq']",
  "iframe[src*='msgsndr']",
].join(", ");

const HIDE_STYLE_ID = "ghl-chat-widget-hide";

function removeWidget() {
  // Remove the loader script
  document.getElementById(WIDGET_SCRIPT_ID)?.remove();
  // Remove the chat-widget loader scripts (esm + nomodule) added by loader.js
  document
    .querySelectorAll(
      'script[src*="leadconnectorhq.com/chat-widget"], script[src*="beta.leadconnectorhq.com"]'
    )
    .forEach((el) => el.remove());
  // Remove any widget DOM the loader injected (custom elements, lc-* prefixes,
  // and the Ionic loading/backdrop overlays the widget shell can leave behind)
  document.querySelectorAll(WIDGET_DOM_SELECTOR).forEach((el) => el.remove());
}

/** Belt-and-braces: hide widget DOM instantly so nothing can flash on screen. */
function addHideStyle() {
  if (document.getElementById(HIDE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIDE_STYLE_ID;
  style.textContent = `${WIDGET_DOM_SELECTOR} { display: none !important; }`;
  document.head.appendChild(style);
}

function removeHideStyle() {
  document.getElementById(HIDE_STYLE_ID)?.remove();
}

/**
 * The widget script keeps running after its <script> tag is removed, so a
 * one-shot cleanup can be undone. Watch the body and re-remove anything the
 * already-loaded bundle re-creates while we're on an excluded route.
 */
function watchAndRemoveWidget(): () => void {
  addHideStyle();
  removeWidget();

  let frame: number | undefined;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      removeWidget();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    if (frame) window.cancelAnimationFrame(frame);
    removeHideStyle();
  };
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
      return watchAndRemoveWidget();
    }

    if (document.getElementById(WIDGET_SCRIPT_ID)) return;
    return whenIdleOrInteraction(injectWidget);
  }, [pathname]);

  return null;
}
