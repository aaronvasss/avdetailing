import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const EXCLUDED_PREFIXES = ["/account", "/admin", "/worker", "/book", "/booking", "/thank-you", "/cancel", "/rate", "/auth"];
const SCRIPT_ID = "ghl-chat-widget";
const LOAD_DELAY_MS = 2000;

export function GhlChatWidget() {
  const { pathname } = useLocation();
  const show = !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      if (!document.getElementById(SCRIPT_ID)) {
        timerRef.current = setTimeout(() => {
          const script = document.createElement("script");
          script.id = SCRIPT_ID;
          script.src = "https://widgets.leadconnectorhq.com/loader.js";
          script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
          script.setAttribute("data-widget-id", "69b754de666024db355f0faf");
          document.body.appendChild(script);
        }, LOAD_DELAY_MS);
      }
      document.body.classList.remove("ghl-widget-hidden");
    } else {
      document.body.classList.add("ghl-widget-hidden");
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
