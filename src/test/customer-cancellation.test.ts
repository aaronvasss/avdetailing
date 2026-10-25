import { describe, expect, it } from "vitest";
import { createCancellationHandler } from "../../supabase/functions/cancel-customer-booking/handler";
import { cancellationConsequences, cancellationProblem } from "../../supabase/functions/_shared/cancellation-rules";
import { ownerChangeFixture } from "./owner-change-fixture";
const input = { bookingId: "00000000-0000-4000-8000-000000000201", expectedDate: "2026-10-28", expectedTime: "09:00:00" };
function setup(options: Parameters<typeof ownerChangeFixture>[0] = {}) {
 const s = ownerChangeFixture(options), handler = createCancellationHandler(s.dependencies);
 return { ...s, request: (body: any = input) => handler(new Request("http://localhost/cancel", { method: "POST", headers: { Authorization: "Bearer mock" }, body: JSON.stringify(options?.emailLink ? { ...body, manageToken: s.state.manage_token } : body) })) };
}
describe("cancellation transactional owner outbox", () => {
 it.each([false,true])("queues cancellation for authenticated or verified guest access (%s)", async emailLink => {
  const s=setup({emailLink}); expect((await s.request()).status).toBe(200); expect(s.state.status).toBe("cancelled"); expect(s.queued).toHaveLength(1);
  const q=s.queued[0]; expect(q._email_recipients).toEqual(["aaronvasquez100@gmail.com"]); expect(q._sms_recipients).toEqual(["+12255216264"]);
  expect(q._content.text).toContain("October 28, 2026 at 9:00 AM Central Time"); expect(q._content.text).toContain("2022 Toyota Camry");
  expect(q._content.text).toContain(`https://avdetailing.net/admin?booking=${input.bookingId}`);
 });
 it("double requests and retries enqueue only once",async()=> { const s=setup(); expect((await Promise.all([s.request(),s.request()])).map(r=>r.status).sort()).toEqual([200,409]); expect(s.queued).toHaveLength(1); expect(await (await s.request()).json()).toMatchObject({unchanged:true}); expect(s.queued).toHaveLength(1); });
 it.each(["completed","in_progress","no_show"])("restricts %s",async status=> {const s=setup();s.state.status=status;expect((await s.request()).status).toBe(409);expect(s.queued).toHaveLength(0);});
 it.each([{userId:"other",status:404},{userId:null,status:401}])("rejects non-owner/signed-out: %j",async o=>{const s=setup(o);expect((await s.request()).status).toBe(o.status);expect(s.queued).toHaveLength(0);});
 it("preserves failed saves and financial fields",async()=>{const s=setup({failSave:true});const before={...s.state};expect((await s.request()).status).toBe(500);expect(s.state).toEqual(before);expect(s.queued).toHaveLength(0);});
 it("retains optional reasons and does not write payment fields",async()=>{const s=setup();await s.request({...input,reason:"  Travel changed  "});expect(s.state.customer_notes).toBe("Keep this original note\nCancellation reason: Travel changed");expect(s.state).toMatchObject({deposit_amount:100,total_price:145.18,payment_status:"deposit_paid"});});
 it("rejects stale/past dates but preserves same-day policy",async()=>{const s=setup();s.state.scheduled_time="10:00:00";expect((await s.request()).status).toBe(409);expect(cancellationProblem({...s.state,status:"confirmed",scheduled_date:"2026-10-24"},"2026-10-25")).toBeTruthy();expect(cancellationProblem({...s.state,status:"confirmed",scheduled_date:"2026-10-25"},"2026-10-25")).toBeNull();});
  it("deposit warning starts strictly below 24 hours and does not promise automatic refunds", () => {
    const s = setup(); expect(cancellationConsequences(s.state, 23.99)).toContain("$100.00 may be forfeited");
    expect(cancellationConsequences(s.state, 24)).not.toContain("forfeited");
    expect(cancellationConsequences({ ...s.state, deposit_amount: 0 }, 1)).not.toContain("$0.00");
    expect(cancellationConsequences(s.state, 1)).toContain("does not automatically issue a refund");
  });
});