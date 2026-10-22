export function normalizePhone(phone:string){const digits=phone.replace(/\D/g,'');return digits.length===10?`+1${digits}`:`+${digits}`;}
export function allowsReminder(preference:boolean|undefined, bookingConsent:boolean){return preference===undefined?bookingConsent:preference;}
export async function smsNotSuppressed(db:any,phone:string){
  const {data,error}=await db.from('sms_opt_outs').select('phone').eq('phone',normalizePhone(phone)).maybeSingle();
  return !error&&!data;
}
export async function reminderConsent(db:any,booking:any,channel:'email'|'sms'){
  let preference: boolean|undefined;
  if(booking.user_id){const {data,error}=await db.from('customer_notification_preferences').select('email_reminders,sms_reminders').eq('user_id',booking.user_id).maybeSingle();if(error)return false;preference=data?.[`${channel}_reminders`];}
  return allowsReminder(preference,booking[`reminder_${channel}_consent`]===true);
}