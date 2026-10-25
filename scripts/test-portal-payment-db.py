"""Isolated PostgreSQL tests. Never uses managed PG environment or customer data.
Run after local initdb/pg_ctl on explicit loopback port 55439.
"""
import json, subprocess, uuid, concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CMD=['psql','-h','127.0.0.1','-p','55439','-U','lovable','-d','postgres','-X','-v','ON_ERROR_STOP=1','-At']
def sql(s, fail=False):
 import os
 r=subprocess.run(CMD+['-c',s],capture_output=True,text=True,env={**os.environ,'PGSSLMODE':'disable'})
 if fail:
  assert r.returncode != 0, f'Unexpected success: {s}'
  return r.stderr
 assert r.returncode==0,r.stderr
 return r.stdout.strip()
def uid():return str(uuid.uuid4())
# Refuse non-disposable database before DDL/fixtures.
assert sql("SELECT current_user||':'||coalesce(inet_server_port()::text,'')")=='lovable:55439'
# Rebuild only this explicitly isolated fixture schema, allowing repeatable tests.
sql("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
sql("""CREATE TABLE bookings(id uuid PRIMARY KEY,user_id uuid,total_price numeric,deposit_amount numeric,payment_status text,status text,guest_email text);
CREATE TABLE card_authorizations(id uuid PRIMARY KEY,user_id uuid,booking_id uuid,amount_cents integer,revoked_at timestamptz);
CREATE TABLE payment_records(id uuid PRIMARY KEY,booking_id uuid,user_id uuid,amount_cents integer,payment_type text,status text,currency text,stripe_payment_intent_id text,metadata jsonb,stripe_checkout_session_id text);
CREATE TABLE quotes(id uuid PRIMARY KEY,booking_id uuid,status text,stripe_payment_intent_id text,deposit_amount numeric);
CREATE TABLE portal_charge_requests(id uuid PRIMARY KEY,booking_id uuid UNIQUE,user_id uuid,authorization_id uuid,amount_cents integer,service_amount_cents integer,status text DEFAULT 'reserved',requested_by uuid);
CREATE TABLE booking_audit_log(booking_id uuid,booking_user_id uuid,changed_by uuid,action text,field text,old_value text,new_value text);
""")
# Install actual prior reservation + audit trigger, then replace only calculation/guard.
old=(ROOT/'drizzle/migrations/0006_wallet_identity_and_audit_guards.sql').read_text()
sql(old[old.index('CREATE OR REPLACE FUNCTION public.log_portal_charge_changes'):])
sql((ROOT/'scripts/pending-migrations/portal_payable_balance.sql').read_text())
sql("CREATE TRIGGER portal_charge_reservation_guard BEFORE INSERT ON portal_charge_requests FOR EACH ROW EXECUTE FUNCTION guard_portal_charge_reservation();")
# Keep actual pending-ledger guards and authorization lock installed.
source=(ROOT/'drizzle/migrations/0007_atomic_portal_settlement.sql').read_text()
sql(source.split('CREATE OR REPLACE FUNCTION public.settle_portal_charge')[0])
source=(ROOT/'drizzle/migrations/0005_atomic_portal_charge_guards.sql').read_text()
a=source.index('CREATE OR REPLACE FUNCTION public.guard_portal_authorization_change')
b=source.index('CREATE OR REPLACE FUNCTION public.guard_reserved_booking_price')
sql(source[a:b])

def booking(total=145.18,status='unpaid',deposit=0):
 b,u,a=uid(),uid(),uid()
 sql(f"INSERT INTO bookings VALUES('{b}','{u}',{total},{deposit},'{status}','confirmed',NULL)")
 return b,u,a
def balance(b):return json.loads(sql(f"SELECT portal_booking_balance('{b}')"))
def record(b,u,cents,kind='balance',status='succeeded',intent=None,service=None,currency='usd'):
 rid=uid(); service=cents if service is None else service
 meta=json.dumps({'service_amount_cents':service}) if service!='missing' else '{}'
 sql(f"INSERT INTO payment_records(id,booking_id,user_id,amount_cents,payment_type,status,currency,stripe_payment_intent_id,metadata) VALUES('{rid}','{b}','{u}',{cents},'{kind}','{status}','{currency}',{repr(intent) if intent else 'NULL'},'{meta}')")
 return rid
def approval(b,u,a,cents):sql(f"INSERT INTO card_authorizations VALUES('{a}','{u}','{b}',{cents},NULL)")
def reserve(b,u,a,cents,rid=None):
 return f"INSERT INTO portal_charge_requests(id,booking_id,user_id,authorization_id,amount_cents,service_amount_cents) VALUES('{rid or uid()}','{b}','{u}','{a}',{cents},{cents})"
checks=0
def passed(name):
 global checks
 checks+=1;print('PASS',name)
b,u,a=booking();assert balance(b)['amountCents']==14518;approval(b,u,a,14518);sql(reserve(b,u,a,14518));passed('$145.18 accepted, zero extra fee')
assert 'Charge already started' in sql(f"UPDATE card_authorizations SET amount_cents=15026 WHERE id='{a}'",True);passed('reserved approval cannot change')
assert 'Resolve reserved' in sql(f"INSERT INTO payment_records(id,booking_id,user_id,amount_cents,payment_type,status,currency,stripe_payment_intent_id,metadata) VALUES('{uid()}','{b}','{u}',100,'balance','paid','usd',NULL,'{{}}')",True);passed('pending charge locks ledger')
assert 'Resolve reserved' in sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','accepted','pi_late',100)",True);passed('pending charge locks quote credits')
sql(reserve(b,u,a,14518),True);passed('duplicate reservation rejected')
assert sql(f"SELECT count(*) FROM booking_audit_log WHERE booking_id='{b}'")=='1';passed('one winning reservation audited')
b,u,a=booking();approval(b,u,a,15026);assert 'Balance changed' in sql(reserve(b,u,a,15026),True);passed('stale $150.26 approval rejected')
b,u,a=booking(500,'deposit_paid',999);record(b,u,10000,'deposit',intent='pi_deposit');assert balance(b)['amountCents']==40000 and balance(b)['depositCents']==10000;approval(b,u,a,40000);sql(reserve(b,u,a,40000));passed('verified $100 deposit ignores stale $999 field, owes $400')
b,u,a=booking(500,'unpaid',100);record(b,u,10000,'deposit','pending');record(b,u,10000,'deposit','failed');assert balance(b)['amountCents']==50000;passed('unpaid/failed deposit owes $500')
b,u,a=booking(500,'deposit_paid',100);assert balance(b)['review'];approval(b,u,a,40000);assert 'needs review' in sql(reserve(b,u,a,40000),True);passed('status-only deposit blocks guessed charge')
b,u,a=booking(500,'partial',900);record(b,u,10000,'deposit',intent='pi_dep');record(b,u,15000,intent='pi_partial');assert balance(b)['amountCents']==25000;approval(b,u,a,25000);sql(reserve(b,u,a,25000));passed('$100 deposit + $150 partial owes $250')
b,u,a=booking(500);record(b,u,10000,'deposit',intent='pi_once');record(b,u,10000,'deposit',intent='pi_once');sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','deposit_paid','pi_once',100)");assert balance(b)['amountCents']==40000;passed('duplicate ledger + quote counted once')
record(b,u,11000,'deposit',intent='pi_once');assert balance(b)['review'];passed('conflicting duplicate requires review')
b,u,a=booking(500);sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','deposit_paid','pi_unverified',100)");assert balance(b)['review'];passed('quote-only legacy deposit requires review')
b,u,a=booking(500);record(b,u,10000,service='missing');assert balance(b)['review'];passed('historical credit without service amount requires review')
b,u,a=booking(500);record(b,u,10000,status='partially_refunded');assert balance(b)['review'];passed('ambiguous refunds require review')
b,u,a=booking(500);record(b,uid(),10000);assert balance(b)['review'];passed('payment owner mismatch requires review')
b,u,a=booking();approval(b,u,a,14518);sql(f"UPDATE card_authorizations SET revoked_at=now() WHERE id='{a}'");sql(reserve(b,u,a,14518),True);passed('revoked approval rejected')
b,u,a=booking();approval(b,u,a,14518);sql(reserve(b,uid(),a,14518),True);passed('booking ownership preserved')
b,u,a=booking(500,'paid');assert balance(b)['amountCents']==0;approval(b,u,a,50000);sql(reserve(b,u,a,50000),True);passed('paid booking has zero due and cannot charge')
b,u,a=booking();approval(b,u,a,14518)
def attempt(_):
 try:sql(reserve(b,u,a,14518));return True
 except AssertionError:return False
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(attempt,range(2)))
assert sorted(results)==[False,True];assert sql(f"SELECT count(*) FROM portal_charge_requests WHERE booking_id='{b}'")=='1';passed('simultaneous requests create exactly one reservation')
assert sql("SELECT has_function_privilege('authenticated','public.portal_booking_balance(uuid)','EXECUTE')")=='f';passed('balance RPC inaccessible to direct authenticated callers')
b,u,a=booking();approval(b,u,a,14518);record(b,u,1000);assert 'Balance changed' in sql(reserve(b,u,a,14518),True);passed('new payment invalidates earlier amount approval')
b,u,a=booking(145.18);record(b,u,14518);assert balance(b)['amountCents']==0;approval(b,u,a,14518);sql(reserve(b,u,a,14518),True);passed('fully credited ledger blocks another charge')
b,u,a=booking(500);record(b,u,10000,currency='eur');assert balance(b)['review'];passed('currency mismatch requires review')
b,u,a=booking(500);record(b,u,10000,'deposit',intent='pi_mismatch');sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','deposit_paid','pi_mismatch',90)");assert balance(b)['review'];passed('quote amount disagreement requires review')
b,u,a=booking(500);sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','deposit_paid',NULL,100)");assert balance(b)['review'];passed('paid quote missing intent requires review')
b,u,a=booking(500);sql(f"INSERT INTO quotes VALUES('{uid()}','{b}','expired','pi_stale',100)");assert balance(b)['review'];passed('stale quote status does not hide payment evidence')
b,u,a=booking(500,'deposit_paid',100);record(b,u,2000);assert balance(b)['review'];passed('unrelated partial cannot verify a deposit')
b,u,a=booking(500);rid=record(b,u,10000);sql(f"UPDATE payment_records SET stripe_checkout_session_id='cs_only' WHERE id='{rid}'");assert balance(b)['review'];passed('session-only credit cannot be double counted')
print(f'{checks} isolated PostgreSQL integration checks passed')
