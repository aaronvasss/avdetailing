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
    /* GHL Widget - force small size and hide popup */
    #chat-widget-container {
      width: 55px !important;
      height: 55px !important;
      bottom: 20px !important;
      right: 20px !important;
    }
    .chat-widget-bubble-wrapper {
      display: none !important;
    }
    .chat-widget-launcher {
      width: 55px !important;
      height: 55px !important;
      min-width: unset !important;
      min-height: unset !important;
      bottom: 20px !important;
      right: 20px !important;
      background-color: #E02020 !important;
    }
    /* When chat is actively open, allow full size */
    #chat-widget-container.chat-widget-open,
    #chat-widget-container:has(iframe[style*="height: 500"]),
    #chat-widget-container:has(iframe[style*="height: 600"]) {
      width: 400px !important;
      height: 650px !important;
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
