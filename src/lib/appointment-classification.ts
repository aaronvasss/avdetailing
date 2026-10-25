import { centralCalendarDate } from '../../supabase/functions/_shared/appointment-calendar';
type Appointment = {scheduled_date:string;status:string};
/** Preserve existing calendar-day/status rules; same-day appointments remain upcoming. */
export function classifyAppointment(booking: Appointment,now = new Date()): 'past'|'upcoming' {
  return booking.status==='cancelled'||booking.status==='completed'||booking.scheduled_date<centralCalendarDate(now)
    ? 'past':'upcoming';
}