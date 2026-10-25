/** Shared browser/function calendar contract. Stored wall times always mean Chicago. */
export const APPOINTMENT_TIMEZONE = 'America/Chicago';

export function centralCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:APPOINTMENT_TIMEZONE,
    year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Repeated fall-back wall times select the earlier occurrence. Gaps are rejected, not silently shifted. */
export function appointmentInstant(date: string, time: string): Date {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?$/i.exec(time.trim());
  if (!day || !clock) throw new Error('Invalid appointment date or time');
  let hour = Number(clock[1]);
  const minute = Number(clock[2]), second = Number(clock[3] ?? 0);
  if (clock[4]) {
    if (hour < 1 || hour > 12) throw new Error('Invalid appointment time');
    hour = hour % 12 + (clock[4].toLowerCase() === 'pm' ? 12 : 0);
  }
  if (hour > 23 || minute > 59 || second > 59) throw new Error('Invalid appointment time');
  const wall = Date.UTC(Number(day[1]),Number(day[2])-1,Number(day[3]),hour,minute,second);
  if (new Date(wall).toISOString().slice(0,10) !== date) throw new Error('Invalid appointment date');
  const formatter = new Intl.DateTimeFormat('en-US', {timeZone:APPOINTMENT_TIMEZONE,hourCycle:'h23',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const wallAt = (instant: number) => {
    const p = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part=>[part.type,part.value]));
    return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
  };
  const candidates = [-86400000,0,86400000].map(delta => {
    const probe = wall + delta;
    return wall - (wallAt(probe) - probe);
  }).filter(candidate => wallAt(candidate) === wall);
  if (!candidates.length) throw new Error('Appointment time does not exist in Central Time');
  return new Date(Math.min(...candidates));
}

export function appointmentCalendarRange(date: string,time: string,duration: number) {
  if (!Number.isFinite(duration) || duration < 0) throw new Error('Invalid appointment duration');
  const startDate = appointmentInstant(date,time);
  return {startDate,endDate:new Date(startDate.getTime()+duration*60000)};
}

export function formatCalendarUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
}

/** RFC 5545 content lines: CRLF, 75-octet folding and final CRLF. */
export function calendarLines(lines: string[]): string {
  const encoder = new TextEncoder();
  return lines.map(line => {
    const folded: string[] = []; let current = ''; let bytes = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes+size>75) {folded.push(current);current=' ';bytes=1;}
      current+=character;bytes+=size;
    }
    folded.push(current);return folded.join('\r\n');
  }).join('\r\n')+'\r\n';
}