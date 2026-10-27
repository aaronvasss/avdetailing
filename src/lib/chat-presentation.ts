/** Observed in the vendor's open chat-widget shadow root (not an iframe).
 * No documented embed size/teaser option or CSS parts exist for this version.
 * Only the closed prompt and launcher are styled; the conversation is untouched.
 */
export const CHAT_PRESENTATION_CSS = `
.lc_text-widget--prompt { display: none !important; }
.lc_text-widget:not(.lc_text-widget--active) > #lc_text-widget--btn {
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  right: max(16px, env(safe-area-inset-right)) !important;
  bottom: calc(20px + env(safe-area-inset-bottom)) !important;
}
@media (max-width: 1023px) {
  .lc_text-widget:not(.lc_text-widget--active) > #lc_text-widget--btn {
    bottom: calc(80px + env(safe-area-inset-bottom)) !important;
  }
}
`;

const STYLE_ID = "av-chat-compact-presentation";

export function watchChatPresentation(): () => void {
  const roots = new Map<ShadowRoot, MutationObserver>();
  const apply = (root: ShadowRoot) => {
    if (root.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CHAT_PRESENTATION_CSS;
    root.appendChild(style);
  };
  const discover = () => {
    document.querySelectorAll("chat-widget").forEach((host) => {
      const root = host.shadowRoot;
      if (!root) return; // Never attempt cross-origin iframe or closed-root access.
      apply(root);
      if (roots.has(root)) return;
      const observer = new MutationObserver(() => apply(root));
      observer.observe(root, { childList: true, subtree: true });
      roots.set(root, observer);
    });
    for (const [root, observer] of roots) {
      if (root.host.isConnected) continue;
      observer.disconnect();
      roots.delete(root);
    }
  };
  const observer = new MutationObserver(discover);
  observer.observe(document.body, { childList: true, subtree: true });
  // A custom element may attach its root after insertion, without a body mutation.
  const timer = window.setInterval(discover, 500);
  discover();
  return () => {
    observer.disconnect();
    window.clearInterval(timer);
    for (const [root, innerObserver] of roots) {
      innerObserver.disconnect();
      root.getElementById(STYLE_ID)?.remove();
    }
    roots.clear();
  };
}