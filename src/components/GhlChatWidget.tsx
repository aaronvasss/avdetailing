import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const EXCLUDED_PREFIXES = ["/account", "/admin", "/worker"];

function isPublicPage(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

const SCRIPT_ID = "ghl-chat-widget";
const STYLE_ID = "ghl-chat-widget-styles";
const LOAD_DELAY_MS = 2000;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* GHL Chat Widget - minimize auto-popup */
    [data-widget-id="69b754de666024db355f0faf"] .chat-widget-launcher {
      bottom: 20px !important;
      right: 20px !important;
    }

    /* Hide the auto-open preview/banner popup, show only the icon button */
    .chat-widget-container iframe[src*="leadconnectorhq"],
    [id^="chat-widget"] {
      max-width: 80px !important;
      max-height: 80px !important;
      bottom: 20px !important;
      right: 20px !important;
      top: auto !important;
      left: auto !important;
    }

    /* When chat is actively open, allow full size */
    .chat-widget-container.chat-widget-open iframe,
    [id^="chat-widget"].open,
    [id^="chat-widget"][style*="height: 600"],
    [id^="chat-widget"][style*="height: 500"],
    [id^="chat-widget"][style*="height:600"],
    [id^="chat-widget"][style*="height:500"] {
      max-width: 400px !important;
      max-height: 650px !important;
    }
  `;
  document.head.appendChild(style);
}

function hideAllWidgetElements() {
  document.querySelectorAll('[id^="chat-widget"], .chat-widget-container, [data-widget-id]').forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });
}

function showAllWidgetElements() {
  document.querySelectorAll('[id^="chat-widget"], .chat-widget-container, [data-widget-id]').forEach((el) => {
    (el as HTMLElement).style.display = "";
  });
}

export function GhlChatWidget() {
  const { pathname } = useLocation();
  const show = isPublicPage(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      injectStyles();

      if (!document.getElementById(SCRIPT_ID)) {
        // Delay loading so it doesn't distract from the booking flow
        timerRef.current = setTimeout(() => {
          const script = document.createElement("script");
          script.id = SCRIPT_ID;
          script.src = "https://widgets.leadconnectorhq.com/loader.js";
          script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
          script.setAttribute("data-widget-id", "69b754de666024db355f0faf");
          document.body.appendChild(script);
        }, LOAD_DELAY_MS);
      } else {
        showAllWidgetElements();
      }
    } else {
      hideAllWidgetElements();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [show]);

  return null;
}
