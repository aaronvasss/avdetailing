import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { isChatAllowed, CHAT_ROUTES } from "@/lib/chat-routes";
import { GhlChatWidget } from "@/components/GhlChatWidget";

const PRIVATE = ["/book", "/booking/manage", "/booking/cancel", "/booking/success", "/booking/canceled", "/cancel/abc", "/rate/abc",
  "/contact", "/memberships", "/auth", "/reset-password", "/unauthorized", "/.lovable/oauth/consent", "/account", "/admin",
  "/worker", "/worker/login", "/worker/ops/1", "/manage-booking", "/reschedule", "/quote", "/terms", "/services/car-detailing",
  "/rv-interior-detailing-baton-rouge", "/does-not-exist"];

describe("chat route allowlist", () => {
  it("keeps current public marketing pages, including / and /get-started", () => {
    for (const p of ["/", "/get-started", "/car-detailing-baton-rouge", "/boat-ceramic-coating-baton-rouge", "/rv-roof-cleaning-baton-rouge",
      "/aircraft-cleaning-baton-rouge", "/car-detailing-gonzales-la", "/services", "/reviews", "/gallery/"]) expect(isChatAllowed(p)).toBe(true);
  });
  it("excludes private, utility, unavailable and unknown routes", () => {
    for (const p of PRIVATE) expect(isChatAllowed(p), p).toBe(false);
    expect([...CHAT_ROUTES].some((p) => /book|auth|account|admin|worker|cancel|rate|contact|membership/.test(p))).toBe(false);
  });
  it("blocks credential-like query or hash even on allowed pages", () => {
    expect(isChatAllowed("/", "?token=x")).toBe(false);
    expect(isChatAllowed("/", "", "#access_token=x&type=recovery")).toBe(false);
    expect(isChatAllowed("/get-started", "?code=1")).toBe(false);
    expect(isChatAllowed("/", "?utm_source=google")).toBe(true);
  });
});

let nav: (p: string) => void = () => {};
function Nav() { nav = useNavigate(); return null; }
const loader = () => document.querySelectorAll("#ghl-chat-widget-loader").length;

describe("GhlChatWidget loading (fake loader, no network)", () => {
  afterEach(() => { cleanup(); document.body.innerHTML = ""; vi.useRealTimers(); });
  const mount = (entry: string) => render(<MemoryRouter initialEntries={[entry]}><Nav /><GhlChatWidget /></MemoryRouter>);

  it("direct load on a private or unknown route never injects", () => {
    vi.useFakeTimers();
    for (const p of ["/unauthorized", "/booking/manage?token=x", "/nope"]) {
      const r = mount(p); act(() => { vi.advanceTimersByTime(60000); }); expect(loader()).toBe(0); r.unmount();
    }
  });
  it("public page injects exactly once after idle delay", () => {
    vi.useFakeTimers(); mount("/car-detailing-baton-rouge");
    expect(loader()).toBe(0);
    act(() => { vi.advanceTimersByTime(30000); });
    expect(loader()).toBe(1);
  });
  it("navigating public→private before delay cancels injection; private→public schedules it", () => {
    vi.useFakeTimers(); mount("/");
    act(() => { nav("/account"); });
    act(() => { vi.advanceTimersByTime(60000); });
    expect(loader()).toBe(0);
    act(() => { nav("/reviews"); });
    act(() => { vi.advanceTimersByTime(30000); });
    expect(loader()).toBe(1);
    act(() => { nav("/admin"); });
    expect(loader()).toBe(0); // loader tag removed; executed bundle cannot be unloaded (documented)
  });
});
