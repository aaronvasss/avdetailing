import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PUBLIC_PREFIXES = [
  "/",
  "/services",
  "/about",
  "/memberships",
  "/gallery",
  "/reviews",
  "/contact",
  "/service-areas",
  "/book",
  "/booking",
  "/privacy-policy",
  "/terms-and-conditions",
  "/auth",
  "/rate",
  "/cancel",
];

const EXCLUDED_PREFIXES = ["/account", "/admin", "/worker"];

function isPublicPage(pathname: string): boolean {
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

const SCRIPT_ID = "ghl-chat-widget";

export function GhlChatWidget() {
  const { pathname } = useLocation();
  const show = isPublicPage(pathname);

  useEffect(() => {
    if (show) {
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://widgets.leadconnectorhq.com/loader.js";
        script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
        script.setAttribute("data-widget-id", "69b754de666024db355f0faf");
        document.body.appendChild(script);
      }
      // Show the widget iframe if it was hidden
      const widget = document.querySelector('[id^="chat-widget"]') as HTMLElement;
      if (widget) widget.style.display = "";
    } else {
      // Hide the widget on excluded pages
      const widget = document.querySelector('[id^="chat-widget"]') as HTMLElement;
      if (widget) widget.style.display = "none";
    }
  }, [show]);

  return null;
}
