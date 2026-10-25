import { describe, expect, it, vi } from "vitest";
import { appointmentLinks, appointmentLinkValid } from "../../supabase/functions/_shared/appointment-links";
import { createManageHandler } from "../../supabase/functions/manage-booking/handler";
import { createCancellationHandler } from "../../supabase/functions/cancel-customer-booking/handler";
import { createRescheduleHandler } from "../../supabase/functions/reschedule-booking/handler";
import { redactUrl } from "@/lib/redact-url";

const id = "00000000-0000-4000-8000-000000000022", token = "a".repeat(64), now = () => new Date("2026-10-25T22:39:00Z");
const booking = { id, user_id: null, manage_token: token, scheduled_date: "2026-10-28", scheduled_time: "09:00:00", status: "confirmed", updated_at: "rev0", services: { name: "Car Detailing" } };
function dbFor(state = { ...booking }) {
  const writes = vi.fn();
  const db = { from: () => { const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { ...state }, error: null }), update: writes }; return chain; } };
  return { db, writes };
}
describe("appointment email capabilities", () => {
  it("redacts appointment secrets from error URLs", () => {
    const value = redactUrl(appointmentLinks(booking).cancel);
    expect(value).not.toContain(token); expect(new URL(value).searchParams.get("booking")).toBe(id);
  });
  it.each(["manage", "cancel", "reschedule"] as const)("generates production %s destination bound to appointment and secret", action => {
    const urls = appointmentLinks(booking); const url = new URL(urls[action]);
    expect(url.origin).toBe("https://avdetailing.net"); expect(url.pathname).toBe("/booking/manage");
    expect(url.searchParams.get("booking")).toBe(id); expect(url.searchParams.get("token")).toBe(token); expect(url.searchParams.get("action")).toBe(action);
  });
  it("supports current compound random tokens and older 64-hex tokens", () => {
    const compound = "12345678-1234-4234-8234-123456789abc" + "b".repeat(32);
    expect(appointmentLinkValid({ ...booking, manage_token: compound }, compound, now())).toBe(true);
    expect(appointmentLinkValid(booking, token, now())).toBe(true);
  });
  it("rejects IDs, absent, mismatched, revoked and expired capabilities", () => {
    for (const value of [id, undefined, "b".repeat(64)]) expect(appointmentLinkValid(booking, value, now())).toBe(false);
    expect(appointmentLinkValid({ ...booking, manage_token: null }, token, now())).toBe(false);
    expect(appointmentLinkValid(booking, token, new Date("2026-11-28T18:00:00Z"))).toBe(false);
  });
  it("opening signed-out email links reads only, excludes secret and owner, including cancelled appointments", async () => {
    const s = dbFor({ ...booking, status: "cancelled" }); const authenticate = vi.fn();
    const handler = createManageHandler({ db: s.db, cors: {}, now, authenticate });
    const response = await handler(new Request("https://test", { method: "POST", body: JSON.stringify({ token, bookingId: id, action: "get" }) }));
    expect(response.status).toBe(200); const result = await response.json(); expect(result.booking.status).toBe("cancelled");
    expect(result.booking.manage_token).toBeUndefined(); expect(result.booking.user_id).toBeUndefined(); expect(s.writes).not.toHaveBeenCalled(); expect(authenticate).not.toHaveBeenCalled();
  });
  it("booking ID alone cannot disclose guest appointment", async () => {
    const s = dbFor(); const handler = createManageHandler({ db: s.db, cors: {}, now, authenticate: async () => null });
    expect((await handler(new Request("https://test", { method: "POST", body: JSON.stringify({ bookingId: id, action: "get" }) }))).status).toBe(401);
    expect(s.writes).not.toHaveBeenCalled();
  });
  it("legacy mutation requests cannot change appointments or send messages", async () => {
    const s = dbFor(); const handler = createManageHandler({ db: s.db, cors: {}, now, authenticate: async () => null });
    for (const action of ["cancel", "reschedule"]) expect((await handler(new Request("https://test", { method: "POST", body: JSON.stringify({ token, action }) }))).status).toBe(409);
    expect(s.writes).not.toHaveBeenCalled();
  });
  it.each([createCancellationHandler, createRescheduleHandler])("guest mutations require exact appointment verification and preserve restricted appointments", async factory => {
    const s = dbFor({ ...booking, status: "completed" }); const notify = vi.fn(); const verifyLink = vi.fn(async (bookingId, capability) => bookingId === id && capability === token);
    const handler = factory({ db: s.db, cors: {}, now, authenticate: async () => null, verifyLink, parse: body => body as any });
    const body = { bookingId: id, manageToken: token, expectedDate: "2026-10-28", expectedTime: "09:00", newDate: "2026-10-29", newTime: "09:00" };
    // Reschedule reads scheduling dependencies only after ownership; use cancellation for restricted status and both for denial.
    const denied = await handler(new Request("https://test", { method: "POST", body: JSON.stringify({ ...body, manageToken: "wrong" }) }));
    expect(denied.status).toBe(401); expect(s.writes).not.toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled(); expect(verifyLink).toHaveBeenCalledWith(id, "wrong");
  });
});