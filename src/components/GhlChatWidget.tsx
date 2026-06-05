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
  // Remove any widget DOM the loader injected
  document
    .querySelectorAll(
      "[id^='lc_chat'], [id^='leadconnector'], .lc_text-widget, lc-chat-widget"
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

export function GhlChatWidget() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (isExcludedPath(pathname)) {
      removeWidget();
    } else {
      injectWidget();
    }
  }, [pathname]);

  return null;
}
