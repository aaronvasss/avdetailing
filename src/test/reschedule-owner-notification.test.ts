import { describe, it, expect, vi } from "vitest";
import { createRescheduleHandler } from "../../supabase/functions/reschedule-booking/handler";
import { notifyRescheduleOwner, centralAppointmentLabel, type RescheduleNotice } from "../../supabase/functions/reschedule-booking/owner-notification";

const ID = "00000000-0000-4000-8000-000000000201";
const input = { bookingId: ID, expectedDate: "2026-10-28", expectedTime: "09:00:00", newDate: "2026-10-30", newTime: "11:00:00" };
function setup(options: { failSave?: boolean; blocked?: boolean; failDelivery?: boolean; guest?: string | null } = {}) {
  const state = { id: ID, user_id: "customer", scheduled_date: "2026-10-28", scheduled_time: "09:00:00", status: "confirmed", updated_at: "rev0", guest_name: options.guest === undefined ? "Mock Customer" : options.guest, services: { name: "Car Detailing" }, duration_minutes: 135 };
  const events: string[] = []; const messages: { url: string; init?: RequestInit }[] = []; const records: any[] = []; const failures: any[] = [];
  let saves = 0;
  const db = {
    rpc: async () => ({ data: 2, error: null }),
    from(table: string) {
      let patch: any; const filters: [string, any][] = [];
      const chain: any = {
        select: () => chain, eq: (key: string, value: any) => { filters.push([key, value]); return chain; },
        neq: () => chain, in: () => chain, limit: () => chain,
        update: (value: any) => { patch = value; return chain; },
        maybeSingle: async () => table === "profiles" ? ({ data: { full_name: "Profile Customer" }, error: null }) : ({ data: { ...state }, error: null }),
        then(resolve: any) {
          if (patch) {
            if (options.failSave) return Promise.resolve({ data: null, error: new Error("mock save failure") }).then(resolve);
            if (!filters.every(([key, value]) => (state as any)[key] === value)) return Promise.resolve({ data: [], error: null }).then(resolve);
            Object.assign(state, patch, { updated_at: `rev${++saves}` }); events.push("saved");
            return Promise.resolve({ data: [{ id: ID, updated_at: state.updated_at }], error: null }).then(resolve);
          }
          return Promise.resolve({ data: table === "blocked_dates" && options.blocked ? [{ id: "blocked" }] : [], error: null }).then(resolve);
        },
      }; return chain;
    },
  };
  const env = () => "mock-key-never-used";
  const interceptedFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(events).toContain("saved"); events.push("delivery"); messages.push({ url: String(url), init });
    return new Response("{}", { status: options.failDelivery ? 503 : 200 });
  }) as unknown as typeof fetch;
  const notify = vi.fn((notice: RescheduleNotice) => notifyRescheduleOwner(notice, {
    env, fetch: interceptedFetch,
    record: async (...args) => { records.push(args); }, failure: async (f) => { failures.push(f); },
  }));
  const handler = createRescheduleHandler({ db, authenticate: async () => "customer", parse: (b) => b as typeof input,
    notify, logFailure: async (...args) => { failures.push(args); }, now: () => new Date("2026-10-25T21:36:00Z"), cors: {} });
  const request = (body = input) => handler(new Request("http://localhost/reschedule", { method: "POST", headers: { Authorization: "Bearer mock" }, body: JSON.stringify(body) }));
  return { state, events, messages, records, failures, notify, request, get saves() { return saves; } };
}

describe("owner reschedule notification with intercepted providers", () => {
  it("notifies configured owner email and SMS only after save, with old/new Central times and pending admin link", async () => {
    const s = setup(); expect((await s.request()).status).toBe(200); expect(s.saves).toBe(1);
    expect(s.events[0]).toBe("saved"); expect(s.messages).toHaveLength(2);
    const email = JSON.parse(String(s.messages[0].init?.body));
    expect(email.to).toEqual(["aaronvasquez100@gmail.com"]);
    expect(email.text).toContain("Customer: Mock Customer"); expect(email.text).toContain("Service: Car Detailing");
    expect(email.text).toContain("October 28, 2026 at 9:00 AM Central Time");
    expect(email.text).toContain("October 30, 2026 at 11:00 AM Central Time");
    expect(email.text).toContain("Appointment is pending confirmation.");
    expect(email.text).toContain(`https://avdetailing.net/admin?booking=${ID}`);
    const sms = new URLSearchParams(String(s.messages[1].init?.body)); expect(sms.get("To")).toBe("+12255216264");
    expect(sms.get("Body")).toBe(email.text); expect(s.records.map(r => r[2])).toEqual(["sent", "sent"]);
  });
  it("concurrent double-clicks produce one save and one notification per channel", async () => {
    const s = setup(); const results = await Promise.all([s.request(), s.request()]);
    expect(results.map(r => r.status).sort()).toEqual([200, 409]); expect(s.saves).toBe(1); expect(s.messages).toHaveLength(2);
  });
  it("retry after lost success response makes no further writes or notifications", async () => {
    const s = setup(); await s.request(); const retry = await s.request();
    expect(await retry.json()).toMatchObject({ ok: true, unchanged: true }); expect(s.saves).toBe(1); expect(s.messages).toHaveLength(2);
  });
  it("failed save keeps original time and sends nothing", async () => {
    const s = setup({ failSave: true }); expect((await s.request()).status).toBe(500);
    expect(s.state.scheduled_date).toBe("2026-10-28"); expect(s.messages).toHaveLength(0);
  });
  it("unavailable date keeps original time and sends nothing", async () => {
    const s = setup({ blocked: true }); expect((await s.request()).status).toBe(409);
    expect(s.saves).toBe(0); expect(s.messages).toHaveLength(0);
  });
  it("provider failures keep the saved pending appointment and record both failures for follow-up", async () => {
    const s = setup({ failDelivery: true }); expect((await s.request()).status).toBe(200);
    expect(s.state).toMatchObject({ scheduled_date: "2026-10-30", scheduled_time: "11:00:00", status: "pending" });
    expect(s.records.map(r => r[2])).toEqual(["failed", "failed"]); expect(s.failures).toHaveLength(2);
    await s.request(); expect(s.messages).toHaveLength(2);
  });
  it("unexpected delivery exceptions cannot undo save or return a save-failure response", async () => {
    const s = setup(); s.notify.mockRejectedValueOnce(new Error("mock notification crash"));
    expect((await s.request()).status).toBe(200); expect(s.state.status).toBe("pending"); expect(s.failures).toHaveLength(1);
  });
  it("stale old appointment cannot overwrite a different change or send an alert", async () => {
    const s = setup(); s.state.scheduled_time = "10:00:00"; expect((await s.request()).status).toBe(409);
    expect(s.saves).toBe(0); expect(s.messages).toHaveLength(0);
  });
  it("profile name is fallback only when guest name is absent", async () => {
    const s = setup({ guest: null }); await s.request(); expect(s.notify.mock.calls[0][0].customerName).toBe("Profile Customer");
  });
  it("missing provider configuration is logged, not silently skipped", async () => {
    const failures: any[] = []; const intercepted = vi.fn();
    await notifyRescheduleOwner({ ...input, customerName: "Mock", serviceName: "Car", oldDate: input.expectedDate, oldTime: input.expectedTime, revision: "rev1" }, {
      env: () => undefined, fetch: intercepted as typeof fetch, record: async () => {}, failure: async f => { failures.push(f); },
    }); expect(intercepted).not.toHaveBeenCalled(); expect(failures).toHaveLength(2);
  });
  it("calendar dates remain correct across Central daylight-saving transitions", () => {
    expect(centralAppointmentLabel("2026-11-01", "09:00:00")).toBe("Sunday, November 1, 2026 at 9:00 AM Central Time");
    expect(centralAppointmentLabel("2026-03-08", "09:00:00")).toBe("Sunday, March 8, 2026 at 9:00 AM Central Time");
  });
});