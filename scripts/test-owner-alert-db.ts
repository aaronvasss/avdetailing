/** Only the disposable loopback database; providers below never perform network requests. */
import postgres from "postgres";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { processOwnerAlerts, type AlertDelivery } from "../supabase/functions/_shared/owner-alert-worker";

const sql = postgres({ host: "127.0.0.1", port: 55439, username: "lovable", database: "owner_alert_test", ssl: false, max: 4 });
let checks = 0;
function pass(name: string) { console.log("PASS", name); checks++; }
try {
  const [identity] = await sql`select current_user as usr, inet_server_port() as port, current_database() as db`;
  assert.equal(identity.usr, "lovable"); assert.equal(identity.port, 55439); assert.equal(identity.db, "owner_alert_test");
  await sql.unsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;
    CREATE TABLE public.bookings(id uuid PRIMARY KEY,user_id uuid,updated_at timestamptz DEFAULT now(),scheduled_date date,scheduled_time time,status text,manage_token text,customer_notes text,total_price numeric DEFAULT 145.18,payment_status text DEFAULT 'unpaid',deposit_amount numeric DEFAULT 0);
    CREATE TABLE public.booking_notification_log(booking_id uuid,notification_type text,recipient text,status text,error_message text);
    CREATE TABLE public.booking_audit_log(booking_id uuid,status text);
    CREATE FUNCTION public.test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.booking_audit_log VALUES(NEW.id,NEW.status); NEW.updated_at:=clock_timestamp(); RETURN NEW; END $$;
    CREATE TRIGGER audit BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.test_audit();
    CREATE TABLE public.portal_scheduler_credentials(id boolean,token text);`);
  await sql.unsafe(readFileSync("scripts/pending-migrations/owner_alert_outbox.sql", "utf8"));
  const calls: { channel: string; key?: string }[] = [];
  let emailStatus = 200, smsStatus = 200, crashFinish = false, throwSms = false;
  const db = { rpc: async (name: string, args: any = {}) => {
    try {
      if (name === "claim_owner_alert_deliveries") return { data: await sql`select * from public.claim_owner_alert_deliveries(${args._limit})`, error: null };
      if (name === "begin_owner_alert_send") { const [r] = await sql`select public.begin_owner_alert_send(${args._id},${args._lease_id}) as ok`; return { data: r.ok, error: null }; }
      if (name === "finish_owner_alert_send") {
        if (crashFinish) { crashFinish = false; return { error: new Error("simulated interruption") }; }
        const [r] = await sql`select public.finish_owner_alert_send(${args._id},${args._lease_id},${args._outcome},${args._provider_id},${args._error}) as ok`;
        return { data: r.ok, error: null };
      }
      if (name === "tick_owner_alert_dispatch") { await sql`select public.tick_owner_alert_dispatch()`; return { error: null }; }
      throw new Error("Unexpected RPC");
    } catch (error) { return { error }; }
  } };
  const deps = { db, env: () => "mock-only", failure: async () => {}, fetch: (async (url: any, init: any) => {
    const channel = String(url).includes("resend") ? "email" : "sms";
    calls.push({ channel, key: init.headers["Idempotency-Key"] });
    if (channel === "sms" && throwSms) throw new Error("mock lost response");
    return new Response(JSON.stringify({ id: "mock-email", sid: "mock-sms" }), { status: channel === "email" ? emailStatus : smsStatus });
  }) as typeof fetch };
  async function fixture() {
    const b = randomUUID(), user = randomUUID(), rev = "2026-10-25T23:35:00Z";
    await sql`insert into bookings(id,user_id,updated_at,scheduled_date,scheduled_time,status,manage_token) values(${b},${user},${rev},'2026-10-28','09:00','confirmed','mock-capability')`;
    return { b, user, rev };
  }
  async function commit(f: Awaited<ReturnType<typeof fixture>>, kind = "reschedule", user = f.user, token: string | null = null) {
    const [r] = await sql`select public.commit_owner_appointment_change(${f.b},${f.rev},'2026-10-28','09:00','confirmed',${user},${token},${kind},'2026-10-30','11:00','Optional reason',${sql.json({subject:"Unchanged subject",html:"<p>Unchanged content</p>",text:"Central Time appointment"})},ARRAY['owner@example.test'],ARRAY['+15555550100']) as result`;
    return r.result;
  }
  async function rows(b: string) { return sql`select d.* from owner_alert_deliveries d join owner_alert_events e on e.id=d.event_id where e.booking_id=${b} order by channel`; }
  async function expire(b: string) { await sql`update owner_alert_deliveries set lease_until=now()-interval '1 second',next_attempt_at=now()-interval '1 second' where event_id in(select id from owner_alert_events where booking_id=${b}) and status<>'sent'`; }
  async function drainOld() { await sql`update owner_alert_deliveries set status='failed',lease_id=null,lease_until=null where status not in('sent','failed','needs_review')`; }

  let f = await fixture(); assert.equal((await commit(f)).changed,true);
  assert.equal((await rows(f.b)).length,2); assert.equal((await sql`select * from bookings where id=${f.b}`)[0].scheduled_date.toISOString().slice(0,10),"2026-10-30");
  pass("appointment and two independent delivery rows commit together; no provider called"); assert.equal(calls.length,0);
  assert.equal((await commit(f)).changed,false); assert.equal((await rows(f.b)).length,2); pass("duplicate stable event cannot create extra deliveries");
  await processOwnerAlerts(deps); assert.deepEqual((await rows(f.b)).map(r=>r.status),["sent","sent"]); pass("interruption after commit recovers from durable queue");
  const priorCalls=calls.length; await processOwnerAlerts(deps); assert.equal(calls.length,priorCalls); pass("completed deliveries never process twice");

  f=await fixture(); const results=await Promise.all([commit(f),commit(f)]);assert.equal(results.filter(r=>r.changed).length,1); assert.equal((await rows(f.b)).length,2);pass("concurrent duplicate changes produce one event and one audit");
  assert.equal((await sql`select count(*)::int as n from booking_audit_log where booking_id=${f.b}`)[0].n,1);
  const claims=await Promise.all([sql`select * from claim_owner_alert_deliveries(10)`,sql`select * from claim_owner_alert_deliveries(10)`]);
  const ids=claims.flat().map(r=>r.id);assert.equal(new Set(ids).size,ids.length);pass("concurrent processors use disjoint leases");
  await expire(f.b); await processOwnerAlerts(deps);assert.deepEqual((await rows(f.b)).map(r=>r.status),["sent","sent"]);pass("claimed but not started work recovers on lease expiry");

  f=await fixture();await commit(f);emailStatus=503; await processOwnerAlerts(deps);
  assert.deepEqual((await rows(f.b)).map(r=>r.status),["retry","sent"]); const smsCount=calls.filter(c=>c.channel==='sms').length;
  await expire(f.b);emailStatus=200;await processOwnerAlerts(deps);assert.equal(calls.filter(c=>c.channel==='sms').length,smsCount);
  assert.deepEqual((await rows(f.b)).map(r=>r.status),["sent","sent"]);pass("email temporary failure retries without resending successful SMS");

  f=await fixture();await commit(f,"cancellation");smsStatus=429;await processOwnerAlerts(deps);assert.deepEqual((await rows(f.b)).map(r=>r.status),["sent","retry"]);
  const emailCount=calls.filter(c=>c.channel==='email').length;await expire(f.b);smsStatus=200;await processOwnerAlerts(deps);
  assert.equal(calls.filter(c=>c.channel==='email').length,emailCount);assert.equal((await sql`select status,total_price,payment_status,deposit_amount from bookings where id=${f.b}`)[0].status,"cancelled");pass("definite SMS rate-limit rejection retries independently; cancellation stays saved");

  f=await fixture();await commit(f);emailStatus=503;
  for(let i=0;i<5;i++){await expire(f.b);await processOwnerAlerts(deps);}
  assert.equal((await rows(f.b))[0].attempts,5);assert.equal((await rows(f.b))[0].status,"failed");emailStatus=200;pass("five-attempt retry bound terminates permanent temporary failures");

  f=await fixture();await commit(f); crashFinish=true;await processOwnerAlerts(deps);assert.equal((await rows(f.b))[0].status,"sending");
  const emailKeys=calls.filter(c=>c.channel==='email').map(c=>c.key);await expire(f.b);await processOwnerAlerts(deps);
  assert.equal(calls.filter(c=>c.channel==='email').at(-1)?.key,emailKeys.at(-1));pass("email accepted/result-write interruption recovers with identical idempotency key");

  f=await fixture();await commit(f);throwSms=true;await processOwnerAlerts(deps);throwSms=false;
  assert.deepEqual((await rows(f.b)).map(r=>r.status),["sent","needs_review"]);const n=calls.length;await expire(f.b);await processOwnerAlerts(deps);assert.equal(calls.length,n);pass("uncertain SMS outcome holds for review instead of risking duplicate delivery");

  f=await fixture();await commit(f);const claimed=await sql`select * from claim_owner_alert_deliveries(10)`; const sms=claimed.find(r=>r.channel==='sms');assert.ok(sms);
  await sql`select begin_owner_alert_send(${sms.id},${sms.lease_id})`;await expire(f.b);await processOwnerAlerts(deps);assert.equal((await rows(f.b))[1].status,"needs_review");pass("crash after SMS send intent becomes durable review status");
  const stale=await sql`select finish_owner_alert_send(${sms.id},${sms.lease_id},'sent','mock',null) as ok`;assert.equal(stale[0].ok,false);pass("stale lease cannot overwrite recovered status");

  f=await fixture();await commit(f);await sql`update owner_alert_events set created_at=now()-interval '7 hours' where booking_id=${f.b}`;await processOwnerAlerts(deps);assert.deepEqual((await rows(f.b)).map(r=>r.status),["failed","failed"]);pass("six-hour retry window prevents replay beyond email idempotency safety margin");

  f=await fixture(); assert.equal((await commit(f,"cancellation",randomUUID())).changed,false); assert.equal((await rows(f.b)).length,0);pass("owner mismatch produces no update/outbox");
  assert.equal((await commit(f,"cancellation",f.user,"revoked-capability")).changed,false);pass("revoked capability is rejected in locked transaction");
  // Outbox failure must roll back the entire transaction: no successful change exists without its alert.
  await sql.unsafe(`CREATE FUNCTION reject_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'mock queue failure'; END $$; CREATE TRIGGER reject_outbox BEFORE INSERT ON owner_alert_events FOR EACH ROW EXECUTE FUNCTION reject_outbox();`);
  await assert.rejects(commit(f));assert.equal((await sql`select status from bookings where id=${f.b}`)[0].status,"confirmed"); assert.equal((await sql`select count(*)::int as n from booking_audit_log where booking_id=${f.b}`)[0].n,0);
  await sql.unsafe('DROP TRIGGER reject_outbox ON owner_alert_events');pass("enqueue failure cannot commit an alert-less change or orphan audit");
  await commit(f,"cancellation");const [saved]=await sql`select total_price,payment_status,deposit_amount from bookings where id=${f.b}`;
  assert.equal(Number(saved.total_price),145.18);assert.equal(saved.payment_status,"unpaid");assert.equal(Number(saved.deposit_amount),0);pass("cancellation preserves payment fields and creates no financial actions");
  const [priv]=await sql`select has_table_privilege('authenticated','owner_alert_events','SELECT') as table_access,has_function_privilege('authenticated','claim_owner_alert_deliveries(integer)','EXECUTE') as function_access`;
  assert.equal(priv.table_access,false);assert.equal(priv.function_access,false);pass("outbox and dispatch RPCs inaccessible to customer roles");
  await drainOld();
  // Local scheduler stand-ins exercise the real arm/wake/drain SQL, not hosted cron/net.
  await sql.unsafe(`CREATE SCHEMA cron; CREATE SCHEMA net;
   CREATE TABLE cron.job(jobid bigserial,jobname text UNIQUE,schedule text,command text);
   CREATE TABLE public.test_http_calls(body jsonb);
   CREATE FUNCTION cron.schedule(n text,s text,c text) RETURNS bigint LANGUAGE plpgsql AS $$ DECLARE j bigint; BEGIN INSERT INTO cron.job(jobname,schedule,command) VALUES(n,s,c) RETURNING jobid INTO j; RETURN j; END $$;
   CREATE FUNCTION cron.unschedule(j bigint) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN DELETE FROM cron.job WHERE jobid=j; RETURN FOUND; END $$;
   CREATE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.test_http_calls VALUES(body); RETURN 1; END $$;
   INSERT INTO portal_scheduler_credentials VALUES(true,'mock-private-only');
   INSERT INTO owner_alert_dispatch_config VALUES(true,'https://example.test/mock-worker',true);`);
  f=await fixture();await commit(f);
  assert.equal((await sql`select count(*)::int as n from cron.job`)[0].n,1);pass("enqueue arms one bounded retry job and wakes processor");
  await processOwnerAlerts(deps);assert.equal((await sql`select count(*)::int as n from cron.job`)[0].n,0);pass("drained queue unschedules retry job");
  f=await fixture();await commit(f);emailStatus=503;await processOwnerAlerts(deps);
  const wakes=(await sql`select count(*)::int as n from test_http_calls`)[0].n;
  await sql`select tick_owner_alert_dispatch()`;assert.equal((await sql`select count(*)::int as n from test_http_calls`)[0].n,wakes);pass("future retry remains armed without repeatedly waking before deadline");
  await expire(f.b);emailStatus=200;await processOwnerAlerts(deps);
  await sql.unsafe(`CREATE OR REPLACE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'mock network extension unavailable'; END $$;`);
  f=await fixture();await commit(f);assert.equal((await rows(f.b)).length,2);assert.equal((await sql`select count(*)::int as n from cron.job`)[0].n,1);pass("wake network failure preserves appointment/outbox and armed recovery timer");
  await processOwnerAlerts(deps);
  console.log(`${checks} isolated PostgreSQL + mocked-provider checks passed`);
} finally { await sql.end(); }