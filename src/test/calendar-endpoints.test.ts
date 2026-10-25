import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { appointmentCalendarRange,formatCalendarUTC,calendarLines } from '../../supabase/functions/_shared/appointment-calendar';

function endpoint(name:string,booking:object) {
  let handler: ((request:Request)=>Promise<Response>)|undefined;
  const query:any={select:()=>query,eq:()=>query,in:()=>query,order:async()=>({data:[booking],error:null}),single:async()=>({data:booking,error:null})};
  const profile={...query,single:async()=>({data:{calendar_token:'mock-token',full_name:'Mock'},error:null})};
  const source=readFileSync(new URL(`../../supabase/functions/${name}/index.ts`,import.meta.url),'utf8')
    .replace(/^import .*;\r?\n/gm,'');
  runInNewContext(ts.transpile(source,{target:ts.ScriptTarget.ES2022}),{
    Deno:{env:{get:()=> 'mock'},serve:(fn:typeof handler)=>{handler=fn;}},
    serve:(fn:typeof handler)=>{handler=fn;},
    createClient:()=>({from:(table:string)=>table==='profiles'?profile:query}),
    appointmentCalendarRange,formatICSDate:formatCalendarUTC,calendarLines,
    timingSafeEqual:(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]),
    Response,URL,TextEncoder,Uint8Array,console,
  });
  if(!handler)throw new Error('Missing calendar handler');
  return handler;
}
describe('download and subscription handlers with fictional records',()=>{
  it.each(['download-ics','calendar-feed'])('%s emits correct Central-time start/end UTC',async(name)=>{
    const booking={id:'11111111-1111-4111-8111-111111111111',scheduled_date:'2026-12-31',scheduled_time:'23:30:15',duration_minutes:135,status:'confirmed',services:{name:'Car Detailing'}};
    const handler=endpoint(name,booking);
    const response=await handler(new Request(`https://example.test/?id=${booking.id}&user_id=mock&token=mock-token-12345678`));
    // Feed token is separately protected, so use its matching fixture capability.
    const valid=name==='calendar-feed'?await handler(new Request('https://example.test/?user_id=mock&token=mock-token')):response;
    expect(valid.status).toBe(200);
    expect(valid.headers.get('Content-Type')).toContain('text/calendar');
    const text=await valid.text();
    expect(text).toContain('DTSTART:20270101T053015Z\r\n');
    expect(text).toContain('DTEND:20270101T074515Z\r\n');
    expect(text).toMatch(/DTSTAMP:\d{8}T\d{6}Z\r\n/);
    expect(text.endsWith('\r\n')).toBe(true);
  });
  it.each(['download-ics','calendar-feed'])('%s preserves missing verification denial',async(name)=>{
    const response=await endpoint(name,{}) (new Request('https://example.test/?id=11111111-1111-4111-8111-111111111111&user_id=mock'));
    expect([400,401]).toContain(response.status);
  });
});