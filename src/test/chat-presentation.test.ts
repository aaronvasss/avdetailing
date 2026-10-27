import { afterEach, describe, expect, it, vi } from "vitest";
import { watchChatPresentation } from "@/lib/chat-presentation";

afterEach(() => { document.body.innerHTML = ""; vi.useRealTimers(); });

describe("chat presentation lifecycle (no vendor network)", () => {
  it("handles a late open root, vendor rerender and cleanup", async () => {
    vi.useFakeTimers();
    const stop = watchChatPresentation();
    const host = document.createElement("chat-widget");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<div class="lc_text-widget"><button id="lc_text-widget--btn" aria-label="Open chat"></button></div>';
    vi.advanceTimersByTime(500);
    expect(root.querySelectorAll("#av-chat-compact-presentation")).toHaveLength(1);
    root.querySelector("style")?.remove();
    await Promise.resolve();
    expect(root.querySelectorAll("#av-chat-compact-presentation")).toHaveLength(1);
    stop();
    expect(root.querySelector("style")).toBeNull();
    vi.advanceTimersByTime(2000);
    expect(root.querySelector("style")).toBeNull();
  });

  it("ignores unrelated shadows and inaccessible closed roots", () => {
    const other = document.createElement("div");
    document.body.append(other);
    const otherRoot = other.attachShadow({ mode: "open" });
    const host = document.createElement("chat-widget");
    document.body.append(host);
    const closed = host.attachShadow({ mode: "closed" });
    const stop = watchChatPresentation();
    expect(otherRoot.childElementCount).toBe(0);
    expect(closed.childElementCount).toBe(0);
    stop();
  });
});