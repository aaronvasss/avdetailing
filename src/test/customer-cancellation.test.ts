import { beforeAll, describe, expect, it, vi } from "vitest";
import { createCancellationHandler } from "../../supabase/functions/cancel-customer-booking/handler";
import { notifyCancellationOwner, type CancellationNotice } from "../../supabase/functions/cancel-customer-booking/owner-notification";
import { cancellationConsequences, cancellationProblem } from "../../supabase/functions/_shared/cancellation-rules";

beforeAll(() => { Object.defineProperty(AbortSignal, "timeout", { configurable: true, value: () => new AbortController().signal }); });
const input = { bookingId: "00000000-0000-4000-8000-000000000201", expectedDate: "2026-10-28", expectedTime: "09:00:00" };
function setup(options: { failSave?: boolean; failDelivery?: boolean; userId?: string | null } = {}) {
  const state = { id: input.bookingId, user_id: "customer", scheduled_date: "2026-10-28", scheduled_time: "09:00:00", status: "confirmed", updated_at: "rev0",
    guest_name: "Mock Customer", services: { name: "Car Detailing" }, vehicle_year: 2022, vehicle_make: "Toyota", vehicle_model: "Camry", vehicle_type: "car",
    deposit_amount: 100, total_price: 145.18, payment_status: "deposit_paid", customer_notes: "Keep this original note" };
  const events: string[] = [], messages: { url: string; init?: RequestInit }[] = [], logs: any[] = [], failures: any[] = [], writes: any[] = [];
  let saves = 0;
  const db = { from(table: string) {
    let patch: any; const filters: [string, any][] = [];
    const chain: any = { select: () => chain, eq: (key: string, value: any) => { filters.push([key, value]); return chain; },
      update: (value: any) => { patch = value; writes.push(value); return chain; },
      maybeSingle: async () => ({ data: table === "profiles" ? { full_name: "Profile Customer" } : { ...state }, error: null }),
      then(resolve: any) {
        if (options.failSave) return Promise.resolve({ data: null, error: new Error("Mock failure") }).then(resolve);
        if (!filters.every(([key, value]) => (state as any)[key] === value)) return Promise.resolve({ data: [], error: null }).then(resolve);
        Object.assign(state, patch, { updated_at: `rev${++saves}` }); events.push("saved");
        return Promise.resolve({ data: [{ id: state.id, updated_at: state.updated_at }], error: null }).then(resolve);
      } }; return chain;
  } };
  const intercepted = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(events[0]).toBe("saved"); events.push("sent"); messages.push({ url: String(url), init });
    return new Response("{}", { status: options.failDelivery ? 503 : 200 });
  }) as unknown as typeof fetch;
  const notify = vi.fn((n: CancellationNotice) => notifyCancellationOwner(n, { env: () => "mock-unused", fetch: intercepted,
    record: async (...args) => { logs.push(args); }, failure: async (f) => { failures.push(f); } }));
  const handler = createCancellationHandler({ db, authenticate: async () => options.userId === undefined ? "customer" : options.userId,
    parse: body => body as typeof input, notify, logFailure: async (...args) => { failures.push(args); },
    now: () => new Date("2026-10-25T21:43:00Z"), cors: {} });
  const request = (body: any = input) => handler(new Request("http://localhost/cancel", { method: "POST", headers: { Authorization: "Bearer mock" }, body: JSON.stringify(body) }));
  return { state, messages, logs, failures, writes, notify, request, get saves() { return saves; } };
}
describe("customer cancellation with intercepted owner notifications", () => {
  it("saves before both alerts and includes Central Time, service, vehicle and protected admin link", async () => {
    const s = setup(); expect((await s.request()).status).toBe(200); expect(s.saves).toBe(1);
    expect(s.state.status).toBe("cancelled"); expect(s.messages).toHaveLength(2);
    const email = JSON.parse(String(s.messages[0].init?.body));
    expect(email.to).toEqual(["aaronvasquez100@gmail.com"]);
    expect(email.text).toContain("October 28, 2026 at 9:00 AM Central Time");
    expect(email.text).toContain("Car Detailing"); expect(email.text).toContain("2022 Toyota Camry");
    expect(email.text).toContain(`https://avdetailing.net/admin?booking=${input.bookingId}`);
    expect(new URLSearchParams(String(s.messages[1].init?.body)).get("To")).toBe("+12255216264");
  });
  it("double requests have only one successful writer and one alert per channel", async () => {
    const s = setup(); const responses = await Promise.all([s.request(), s.request()]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]); expect(s.saves).toBe(1); expect(s.messages).toHaveLength(2);
  });
  it("retry after lost response has no second write or alert", async () => {
    const s = setup(); await s.request(); expect(await (await s.request()).json()).toMatchObject({ ok: true, unchanged: true });
    expect(s.saves).toBe(1); expect(s.messages).toHaveLength(2);
  });
  it.each(["completed", "in_progress", "no_show"])("rejects restricted %s status without any write or alert", async status => {
    const s = setup(); s.state.status = status; expect((await s.request()).status).toBe(409); expect(s.writes).toHaveLength(0); expect(s.messages).toHaveLength(0);
  });
  it("rejects a different customer's appointment", async () => {
    const s = setup({ userId: "different-customer" }); expect((await s.request()).status).toBe(404); expect(s.writes).toHaveLength(0); expect(s.messages).toHaveLength(0);
  });
  it("rejects signed-out requests", async () => {
    const s = setup({ userId: null }); expect((await s.request()).status).toBe(401); expect(s.writes).toHaveLength(0);
  });
  it("rejects stale appointment date/time", async () => {
    const s = setup(); s.state.scheduled_time = "10:00:00"; expect((await s.request()).status).toBe(409); expect(s.writes).toHaveLength(0);
  });
  it("rejects past dates, but preserves same-day eligibility and late-warning-only policy", async () => {
    const s = setup(); s.state.scheduled_date = "2026-10-24";
    expect((await s.request({ ...input, expectedDate: "2026-10-24" })).status).toBe(409); expect(s.writes).toHaveLength(0);
    expect(cancellationProblem({ ...s.state, status: "confirmed", scheduled_date: "2026-10-25" }, "2026-10-25")).toBeNull();
  });
  it("failed save leaves the appointment and payment data unchanged and sends nothing", async () => {
    const s = setup({ failSave: true }); const before = { ...s.state };
    expect((await s.request()).status).toBe(500); expect(s.state).toEqual(before); expect(s.messages).toHaveLength(0);
  });
  it("failed providers retain cancellation, log failures and do not resend on retry", async () => {
    const s = setup({ failDelivery: true }); expect((await s.request()).status).toBe(200); expect(s.state.status).toBe("cancelled");
    expect(s.logs.map(l => l[2])).toEqual(["failed", "failed"]); expect(s.failures).toHaveLength(2);
    await s.request(); expect(s.messages).toHaveLength(2);
  });
  it("unexpected notification failure cannot undo cancellation", async () => {
    const s = setup(); s.notify.mockRejectedValueOnce(new Error("mock exception")); expect((await s.request()).status).toBe(200);
    expect(s.state.status).toBe("cancelled"); expect(s.failures).toHaveLength(1);
  });
  it("reason is optional, appends to notes, and no financial fields are written", async () => {
    const s = setup(); await s.request({ ...input, reason: "  Travel changed  " });
    expect(s.state.customer_notes).toBe("Keep this original note\nCancellation reason: Travel changed");
    expect(Object.keys(s.writes[0]).sort()).toEqual(["customer_notes", "status"]);
    expect(s.state).toMatchObject({ deposit_amount: 100, total_price: 145.18, payment_status: "deposit_paid" });
  });
  it("deposit warning starts strictly below 24 hours and does not promise automatic refunds", () => {
    const s = setup(); expect(cancellationConsequences(s.state, 23.99)).toContain("$100.00 may be forfeited");
    expect(cancellationConsequences(s.state, 24)).not.toContain("forfeited");
    expect(cancellationConsequences({ ...s.state, deposit_amount: 0 }, 1)).not.toContain("$0.00");
    expect(cancellationConsequences(s.state, 1)).toContain("does not automatically issue a refund");
  });
});