import { describe,it,expect } from 'vitest';
import { appointmentInstant,appointmentCalendarRange,centralCalendarDate,calendarLines } from '../../supabase/functions/_shared/appointment-calendar';
import { createBookingCalendarEvent,generateICS,generateGoogleCalendarUrl } from '@/lib/calendar';
import { classifyAppointment } from '@/lib/appointment-classification';

const cases=[
  ['2026-10-28','09:00','2026-10-28T14:00:00.000Z'],
  ['2026-10-28','09:00:15','2026-10-28T14:00:15.000Z'],
  ['2026-12-31','23:30:00','2027-01-01T05:30:00.000Z'],
  ['2027-01-01','00:15','2027-01-01T06:15:00.000Z'],
  ['2026-03-08','06:00','2026-03-08T11:00:00.000Z'],
  ['2026-11-01','06:00:00','2026-11-01T12:00:00.000Z'],
  ['2026-11-01','01:30','2026-11-01T06:30:00.000Z'],
];
describe('Chicago calendar contract',()=>{
  it.each(cases)('%s %s retains its instant %s',(date,time,iso)=>{
    const booking={id:'mock',scheduled_date:date,scheduled_time:time,duration_minutes:135};
    const event=createBookingCalendarEvent(booking);
    expect(event.startDate.toISOString()).toBe(iso);
    expect(event.endDate.getTime()-event.startDate.getTime()).toBe(135*60000);
    const compact=(value:Date)=>value.toISOString().replace(/[-:]/g,'').replace('.000Z','Z');
    expect(generateICS(event)).toContain('DTSTART:'+compact(event.startDate)+'\r\n');
    expect(generateICS(event)).toContain('DTEND:'+compact(event.endDate)+'\r\n');
    const url=new URL(generateGoogleCalendarUrl(event));
    expect(url.searchParams.get('dates')).toBe(compact(event.startDate)+'/'+compact(event.endDate));
    expect(url.searchParams.get('ctz')).toBe('America/Chicago');
    expect(booking.scheduled_time).toBe(time);
  });
  it.each([
    ['2027-01-01T05:59:59Z','2026-12-31'],['2027-01-01T06:00:00Z','2027-01-01'],
    ['2026-11-01T04:59:59Z','2026-10-31'],['2026-11-01T05:00:00Z','2026-11-01'],
    ['2026-03-01T05:59:59Z','2026-02-28'],['2026-03-01T06:00:00Z','2026-03-01'],
  ])('Central calendar day at %s is %s',(instant,day)=>{
    const now=new Date(instant);
    expect(centralCalendarDate(now)).toBe(day);
    expect(classifyAppointment({scheduled_date:day,status:'confirmed'},now)).toBe('upcoming');
    expect(classifyAppointment({scheduled_date:day,status:'completed'},now)).toBe('past');
    expect(classifyAppointment({scheduled_date:'2025-12-31',status:'pending'},now)).toBe('past');
  });
  it('keeps same-day elapsed bookings upcoming and terminal status in history',()=>{
    const now=new Date('2026-10-29T04:00:00Z');
    expect(classifyAppointment({scheduled_date:'2026-10-28',status:'in_progress'},now)).toBe('upcoming');
    expect(classifyAppointment({scheduled_date:'2026-10-30',status:'cancelled'},now)).toBe('past');
  });
  it('rejects nonexistent spring-forward time rather than guessing',()=>expect(()=>appointmentInstant('2026-03-08','02:30')).toThrow());
  it('preserves elapsed duration across spring-forward',()=>{
    const range=appointmentCalendarRange('2026-03-08','01:30',120);
    expect(range.startDate.toISOString()).toBe('2026-03-08T07:30:00.000Z');
    expect(range.endDate.toISOString()).toBe('2026-03-08T09:30:00.000Z');
  });
  it('folds UTF-8 lines at 75 octets and terminates with CRLF',()=>{
    const value=calendarLines(['DESCRIPTION:'+ 'é'.repeat(100)]);
    expect(value.endsWith('\r\n')).toBe(true);
    for(const line of value.trimEnd().split('\r\n'))expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(value.replace(/\r\n /g,'').trimEnd()).toBe('DESCRIPTION:'+'é'.repeat(100));
  });
});