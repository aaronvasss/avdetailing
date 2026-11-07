import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  bookingStage, contactFields, contactTags, nextStage, stageRank, ghlClient, syncEvent, GhlError, normalizePhone,
  type SyncContext, type Links,
} from "../../supabase/functions/_shared/ghl-sync";

const booking = (o: any = {}) => ({ id: "b1", status: "confirmed", payment_status: "unpaid", scheduled_date: "2026-11-20", scheduled_time: "09:30:00", total_price: 150, manage_token: "a".repeat(64), service_slug: "ceramic-coating", service_name: "Ceramic Coating", vehicle_type: "SUV", vehicle_year: 2022, vehicle_make: "Ford", vehicle_model: "Explorer", service_city: "Baton Rouge", ...o });
const ctx = (o: Partial<SyncContext> = {}): SyncContext => ({ kind: "booking_created", person: { email: "Jo@Example.com", phone: "(225) 555-0100", name: "Jo Smith" }, booking: booking(), history: [booking()], membershipActive: false, membershipEver: false, today: "2026-11-07", ...o });

function memLinks(): Links & { m: Map<string, any> } {
  const m = new Map<string, any>();
  return { m, get: async k => m.get(k) ?? null, set: async (k, id, r) => { m.set(k, { ghl_id: id, stage_rank: r ?? null }); }, remove: async k => { m.delete(k); } };
}
const stages = ["New Lead", "Quoted", "Booked", "Paid", "Completed", "Review Requested", "Maintenance Member", "Lost/Cancelled"].map((name, i) => ({ id: `s${i}`, name }));
function mockGhl(opts: { dupEmail?: string; fail?: Response[] } = {}) {
  const calls: { method: string; path: string; body: any }[] = [];
  const fail = [...(opts.fail ?? [])];
  const f = vi.fn(async (url: string, init: any) => {
    const path = url.replace("https://services.leadconnectorhq.com", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method, path, body });
    if (fail.length && init.method !== "GET") return fail.shift()!;
    const ok = (j: any) => new Response(JSON.stringify(j), { status: 200 });
    if (path.startsWith("/locations/")) return ok({ customFields: [{ id: "f1", fieldKey: "contact.av_next_appointment" }, { id: "f2", fieldKey: "contact.av_manage_link" }, { id: "f3", name: "av_lifetime_spend" }] });
    if (path.startsWith("/opportunities/pipelines")) return ok({ pipelines: [{ id: "p1", name: "AV Detailing", stages }] });
    if (path.startsWith("/contacts/search/duplicate")) return ok(path.includes("email=") && opts.dupEmail ? { contact: { id: opts.dupEmail } } : {});
    if (path === "/contacts/" ) return ok({ contact: { id: "new-contact" } });
    if (path === "/opportunities/") return ok({ opportunity: { id: "opp-1" } });
    return ok({});
  });
  return { calls, api: ghlClient("tok", "loc", f as any) };
}

describe("GHL field mapping", () => {
  it("formats the next appointment in Central Time and uses the secure manage link", () => {
    const f = contactFields(ctx());
    expect(f.av_next_appointment).toBe("Fri, Nov 20, 2026 9:30 AM CT");
    expect(f.av_manage_link).toMatch(/^https:\/\/avdetailing\.net\/booking\/manage\?booking=b1&action=manage&token=/);
    expect(f.av_vehicle).toBe("2022 Ford Explorer");
  });
  it("totals lifetime spend and visits from completed bookings only", () => {
    const f = contactFields(ctx({ history: [booking({ id: "c1", status: "completed", total_price: 100.1, scheduled_date: "2026-01-02" }), booking({ id: "c2", status: "completed", total_price: 50.2, scheduled_date: "2026-03-04" }), booking({ id: "x", status: "cancelled", total_price: 999 })] }));
    expect(f.av_lifetime_spend).toBe(150.3);
    expect(f.av_completed_visits).toBe(2);
    expect(f.av_last_service_date).toBe("2026-03-04");
  });
  it("leaves UTM fields empty in Phase 1", () => {
    const f = contactFields(ctx());
    expect([f.av_utm_source, f.av_utm_medium, f.av_utm_campaign]).toEqual([null, null, null]);
  });
  it("never includes card data, notes or staff fields", () => {
    expect(Object.keys(contactFields(ctx())).some(k => /card|note|stripe|worker|pay_rate|gate/i.test(k))).toBe(false);
  });
  it("tags service type, customer and member", () => {
    expect(contactTags(ctx({ membershipActive: true }))).toEqual(expect.arrayContaining(["customer", "ceramic-client", "member"]));
    expect(contactTags(ctx({ booking: null, history: [], inquiry: true, kind: "inquiry" }))).toEqual(["lead"]);
    expect(contactTags(ctx({ booking: booking({ service_slug: "boat-detail", service_name: "Boat" }), history: [] }))).toContain("boat");
  });
  it("normalizes US phones to E.164", () => expect(normalizePhone("(225) 521-6264")).toBe("+12255216264"));
});

describe("GHL pipeline stages", () => {
  it("derives stage from booking state", () => {
    expect(bookingStage(booking(), ctx())).toBe("Booked");
    expect(bookingStage(booking({ payment_status: "paid" }), ctx())).toBe("Paid");
    expect(bookingStage(booking({ status: "completed" }), ctx())).toBe("Completed");
    expect(bookingStage(booking({ status: "completed", has_rating: true }), ctx())).toBe("Review Requested");
    expect(bookingStage(booking({ status: "completed", membership_id: "m" }), ctx({ membershipActive: true }))).toBe("Maintenance Member");
    expect(bookingStage(booking({ status: "cancelled" }), ctx())).toBe("Lost/Cancelled");
    expect(bookingStage(booking({ payment_status: "paid" }), ctx({ fullRefund: true }))).toBe("Lost/Cancelled");
  });
  it("only moves forward, except to Lost/Cancelled", () => {
    expect(nextStage(stageRank("Paid"), "Booked")).toBeNull();
    expect(nextStage(stageRank("Booked"), "Paid")).toBe("Paid");
    expect(nextStage(stageRank("Completed"), "Lost/Cancelled")).toBe("Lost/Cancelled");
    expect(nextStage(stageRank("Lost/Cancelled"), "Paid")).toBeNull();
  });
});

describe("GHL sync with mocked API", () => {
  it("reuses a contact found by email and creates one opportunity per booking", async () => {
    const { api, calls } = mockGhl({ dupEmail: "existing" });
    const links = memLinks();
    const r1 = await syncEvent(api, ctx(), links);
    const r2 = await syncEvent(api, ctx({ kind: "paid", booking: booking({ payment_status: "paid" }) }), links);
    expect(r1.contactId).toBe("existing");
    expect(calls.filter(c => c.method === "POST" && c.path === "/contacts/")).toHaveLength(0);
    expect(calls.filter(c => c.method === "POST" && c.path === "/opportunities/")).toHaveLength(1);
    const put = calls.find(c => c.method === "PUT" && c.path === "/opportunities/opp-1");
    expect(put?.body).toMatchObject({ pipelineStageId: "s3", monetaryValue: 150, status: "open" });
    expect(r2.opportunityId).toBe("opp-1");
  });
  it("falls back to phone, then creates a new contact", async () => {
    const { api, calls } = mockGhl();
    const r = await syncEvent(api, ctx(), memLinks());
    expect(calls.some(c => c.path.includes("phone=%2B12255550100"))).toBe(true);
    expect(r.contactId).toBe("new-contact");
  });
  it("turns an inquiry lead into the first booking's opportunity", async () => {
    const { api, calls } = mockGhl();
    const links = memLinks();
    await syncEvent(api, ctx({ kind: "inquiry", inquiry: true, booking: null, history: [] }), links);
    await syncEvent(api, ctx(), links);
    expect(calls.filter(c => c.method === "POST" && c.path === "/opportunities/")).toHaveLength(1);
    expect(links.m.get("opportunity:booking:b1")?.ghl_id).toBe("opp-1");
  });
  it("membership events update the contact without an opportunity", async () => {
    const { api, calls } = mockGhl();
    const r = await syncEvent(api, ctx({ kind: "membership_started", booking: null, membershipActive: true }), memLinks());
    expect(r.opportunityId).toBeNull();
    expect(calls.some(c => c.path.startsWith("/opportunities/") && c.method !== "GET")).toBe(false);
  });
  it("classifies rate limits as retryable with Retry-After and validation errors as final", async () => {
    const { api } = mockGhl({ fail: [new Response("slow down", { status: 429, headers: { "Retry-After": "30" } })] });
    const e = await syncEvent(api, ctx(), memLinks()).catch(x => x);
    expect(e).toBeInstanceOf(GhlError); expect(e.retryable).toBe(true); expect(e.retryAfter).toBe(30);
    const bad = await mockGhl({ fail: [new Response("bad", { status: 422 })] }).api;
    const e2 = await syncEvent(bad, ctx(), memLinks()).catch(x => x);
    expect(e2.retryable).toBe(false);
  });
  it("fails clearly when the GHL pipeline is missing", async () => {
    const f = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("pipelines") ? { pipelines: [] } : { customFields: [] }), { status: 200 }));
    const e = await syncEvent(ghlClient("t", "l", f as any), ctx(), memLinks()).catch(x => x);
    expect(e.message).toMatch(/Pipeline "AV Detailing" not found/);
  });
});

describe("customer messaging switch", () => {
  const read = (f: string) => readFileSync(`supabase/functions/${f}/index.ts`, "utf8");
  it.each(["send-reminder-sms", "send-review-request", "send-booking-sms", "send-sms"])("%s checks the GHL messaging switch", f => expect(read(f)).toContain("ghlOwnsCustomerMessaging"));
  it("only skips the customer text in send-booking-sms, not the owner alert", () => {
    const s = read("send-booking-sms");
    expect(s.indexOf("ghlOwnsCustomerMessaging(supabase)")).toBeLessThan(s.indexOf("Business notification SMS"));
  });
  it("send-sms only skips worker customer job updates, not admin messages", () => expect(read("send-sms")).toContain('body.type === "customer_job_update" && await ghlOwnsCustomerMessaging'));
  it("confirmation emails are not covered", () => expect(read("process-booking-notifications")).not.toContain("ghlOwnsCustomerMessaging"));
  it("switch defaults off and sync defaults disabled", () => {
    const sql = readFileSync("supabase/ghl/ghl_sync_outbox.sql", "utf8");
    expect(sql).toMatch(/enabled boolean NOT NULL DEFAULT false/);
    expect(sql).toMatch(/customer_messaging_via_ghl boolean NOT NULL DEFAULT false/);
  });
});
