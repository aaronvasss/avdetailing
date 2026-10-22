import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { normalizePhone, reminderConsent, smsNotSuppressed } from "../_shared/reminder-permissions.ts";

const schema=z.object({sendAll:z.boolean().optional(),bookingId:z.string().uuid().optional(),reminderType:z.enum(['24h','2h','custom']).optional(),dryRun:z.boolean().optional()});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const chicagoParts=(date:Date)=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
function appointmentInstant(date:string,time:string){
  const nominal=Date.parse(`${date}T${time.slice(0,5)}:00Z`);
  const p=chicagoParts(new Date(nominal));
  const represented=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return nominal+(nominal-represented);
}
const encode=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  try{
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
    const db=createClient(Deno.env.get('SUPABASE_URL')??'',serviceKey);
    const token=(req.headers.get('Authorization')??'').replace(/^Bearer /,'');
    const schedulerToken=req.headers.get('X-Reminder-Scheduler');
    let scheduled=false;
    if(schedulerToken){const {data,error}=await db.from('portal_scheduler_credentials').select('token').eq('id',true).single();scheduled=!error&&!!data&&data.token===schedulerToken;}
    if(!token&&!scheduled)return json({error:'Unauthorized'},401);
    if(token!==serviceKey&&!scheduled){
      const {data,error}=await db.auth.getUser(token);if(error||!data.user)return json({error:'Unauthorized'},401);
      const {data:roles,error:roleError}=await db.from('user_roles').select('role').eq('user_id',data.user.id).in('role',['admin','staff']);
      if(roleError||!roles?.length)return json({error:'Staff access required'},403);
    }
    const parsed=schema.safeParse(await req.json());if(!parsed.success)return json({error:'Invalid reminder request'},400);
    const body=parsed.data;if(!body.sendAll&&!body.bookingId)return json({error:'Select an appointment'},400);
    const now=new Date();const p=chicagoParts(now);const today=`${p.year}-${p.month}-${p.day}`;
    const tomorrow=new Date(`${today}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
    let query=db.from('bookings').select('*').eq('status','confirmed');
    query=body.bookingId?query.eq('id',body.bookingId):query.in('scheduled_date',[today,tomorrow.toISOString().slice(0,10)]);
    const {data:bookings,error}=await query;if(error)throw error;
    if(body.bookingId&&!bookings?.length&&!body.dryRun)return json({success:false,remindersSent:0,reason:'Only confirmed appointments can receive reminders.'});
    const {data:settings}=await db.from('business_settings').select('key,value').in('key',['sms_sender_phone','public_business_phone']);
    const values=Object.fromEntries((settings??[]).map(r=>[r.key,r.value]));
    const results=[];
    for(const booking of bookings??[]){
      const hours=(appointmentInstant(booking.scheduled_date,booking.scheduled_time)-now.getTime())/3600000;
      const kind=body.bookingId?(body.reminderType??'24h'):hours>20&&hours<=28?'24h':hours>1.5&&hours<=3?'2h':null;
      if(!kind||hours<=0){if(body.bookingId)results.push({bookingId:booking.id,success:false,reason:'This appointment time has already passed.'});continue;}
      const {data:profile}=booking.user_id?await db.from('profiles').select('full_name,email,phone').eq('user_id',booking.user_id).maybeSingle():{data:null};
      // Guest contact fields take priority; never fall back to the admin's contact for guest bookings.
      const guest=!!booking.guest_email||!!booking.guest_phone;
      const email=booking.guest_email||(guest?null:profile?.email);
      const phone=booking.guest_phone||(guest?null:profile?.phone);
      const name=booking.guest_name||profile?.full_name||'there';
      const [h,m]=booking.scheduled_time.split(':').map(Number);const time=`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
      const date=new Date(`${booking.scheduled_date}T12:00:00Z`).toLocaleDateString('en-US',{month:'long',day:'numeric',timeZone:'America/Chicago'});
      const message=`AV Detailing 🚗\nHi ${name.split(' ')[0]}! Your appointment is ${date} at ${time} (30-minute arrival window).\n${[booking.service_address,booking.service_city].filter(Boolean).join(', ')}\nRemove valuables and secure hazards before service.\nQuestions? Call ${values.public_business_phone||'(225) 521-6264'}. Reply STOP to opt out.`;
      for(const channel of ['email','sms'] as const){
        const destination=channel==='email'?email:phone;
        const consent=await reminderConsent(db,booking,channel);
        const permitted=!!destination&&consent&&(channel!=='sms'||await smsNotSuppressed(db,phone));
        if(body.dryRun){results.push({bookingId:booking.id,channel,eligible:permitted,reminderType:kind});continue;}
        if(!permitted){results.push({bookingId:booking.id,channel,success:false,reason:!destination?`No ${channel==='sms'?'phone number':'email'} on file.`:!consent?`Customer has not agreed to ${channel==='sms'?'text':'email'} reminders.`:'Customer replied STOP to texts.'});continue;}
        if(channel==='email'){
          const {data:suppressed,error:suppressionError}=await db.from('suppressed_emails').select('id').eq('email',String(email).toLowerCase()).limit(1);
          if(suppressionError||suppressed?.length){results.push({bookingId:booking.id,channel,success:false,reason:'Email address is unsubscribed.'});continue;}
        }
        const {data:claim,error:claimError}=await db.from('portal_reminder_deliveries').insert({booking_id:booking.id,scheduled_date:booking.scheduled_date,scheduled_time:booking.scheduled_time,channel,reminder_type:kind}).select('id').single();
        if(claimError||!claim){results.push({bookingId:booking.id,channel,success:false,reason:`This ${kind} ${channel==='sms'?'text':'email'} reminder was already sent.`});continue;}
        let success=false;
        try{
          if(channel==='sms'){
            const sid=Deno.env.get('TWILIO_ACCOUNT_SID')??'';const token=Deno.env.get('TWILIO_AUTH_TOKEN')??'';
            if(!sid||!token)throw new Error('SMS sender unavailable');
            const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${btoa(`${sid}:${token}`)}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:normalizePhone(phone),From:values.sms_sender_phone||'+12252284796',Body:message})});success=response.ok;
          }else{
            const key=Deno.env.get('RESEND_API_KEY');if(!key)throw new Error('Email sender unavailable');
            const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`appointment-reminder-${claim.id}`},body:JSON.stringify({from:'AV Detailing <noreply@avdetailing.net>',to:[email],subject:`AV Detailing 🚗 Appointment Reminder — ${date}`,html:`<table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px"><tr><td><h1>AV Detailing 🚗</h1><p>${encode(message).replace(/\n/g,'<br>')}</p><p><a href="https://avdetailing.net/account">My Appointments</a> · <a href="tel:+12255216264">Call</a> · <a href="sms:+12255216264">Text</a></p><p><a href="https://avdetailing.net/account?tab=settings">Reminder preferences</a></p></td></tr></table></td></tr></table>`})});success=response.ok;
          }
        }catch{success=false;}
        await db.from('portal_reminder_deliveries').update({status:success?'sent':'failed'}).eq('id',claim.id);
        results.push({bookingId:booking.id,channel,success,...(success?{}:{reason:`The ${channel==='sms'?'text':'email'} could not be delivered.`})});
      }
    }
    const sent=results.filter(r=>(r as any).success).length;
    return json({success:true,remindersSent:sent,reason:sent?undefined:(results.find(r=>(r as any).reason) as any)?.reason,results});
  }catch{return json({error:'Unable to process reminders'},500);}
});
