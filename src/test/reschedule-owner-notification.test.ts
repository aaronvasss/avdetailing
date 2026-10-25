import { describe, it, expect } from "vitest";
import { createRescheduleHandler } from "../../supabase/functions/reschedule-booking/handler";
import { ownerChangeFixture } from "./owner-change-fixture";
const input = { bookingId: "00000000-0000-4000-8000-000000000201", expectedDate: "2026-10-28", expectedTime: "09:00:00", newDate: "2026-10-30", newTime: "11:00:00" };
function setup(options: Parameters<typeof ownerChangeFixture>[0] = {}) {
 const s = ownerChangeFixture(options), handler = createRescheduleHandler(s.dependencies);
 return { ...s, request: (body = input) => handler(new Request("http://localhost/reschedule", { method: "POST", headers: { Authorization: "Bearer mock" }, body: JSON.stringify(options?.emailLink ? { ...body, manageToken: s.state.manage_token } : body) })) };
}
describe("reschedule transactional owner outbox", () => {
 it.each([false, true])("queues the saved change for authenticated or verified guest access (%s)", async emailLink => {
  const s = setup({ emailLink }); expect((await s.request()).status).toBe(200);
  expect(s.queued).toHaveLength(1); const q = s.queued[0];
  expect(q._email_recipients).toEqual(["aaronvasquez100@gmail.com"]); expect(q._sms_recipients).toEqual(["+12255216264"]);
  expect(q._content.text).toContain("October 28, 2026 at 9:00 AM Central Time");
  expect(q._content.text).toContain("October 30, 2026 at 11:00 AM Central Time");
  expect(q._content.text).toContain("Appointment is pending confirmation.");
  expect(q._content.text).toContain(`https://avdetailing.net/admin?booking=${input.bookingId}`);
 });
 it("queues only one event on double-click or lost-response retry", async () => {
  const s = setup(); const results = await Promise.all([s.request(), s.request()]);
  expect(results.map(r => r.status).sort()).toEqual([200,409]); expect(s.queued).toHaveLength(1);
  expect(await (await s.request()).json()).toMatchObject({ unchanged: true }); expect(s.queued).toHaveLength(1);
 });
 it.each([{ failSave: true, status: 500 }, { blocked: true, status: 409 }])("preserves appointment when save/availability fails: %j", async o => {
  const s = setup(o); expect((await s.request()).status).toBe(o.status); expect(s.state.scheduled_date).toBe("2026-10-28"); expect(s.queued).toHaveLength(0);
 });
 it("cannot overwrite stale booking", async () => { const s = setup(); s.state.scheduled_time = "10:00:00"; expect((await s.request()).status).toBe(409); expect(s.queued).toHaveLength(0); });
 it("captures profile fallback in immutable queued content", async () => { const s = setup({ guest: null }); await s.request(); expect(s.queued[0]._content.text).toContain("Profile Customer"); });
});
