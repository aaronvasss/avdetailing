import { format, addMinutes, parse } from "date-fns";

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  id?: string;
}

/**
 * Formats a date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates an ICS file content string
 */
export function generateICS(event: CalendarEvent): string {
  const uid = event.id || `${Date.now()}@avdetailing.com`;
  const now = formatICSDate(new Date());
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AV Detailing//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(event.endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description)}`,
    `LOCATION:${escapeICSText(event.location)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:AV Detailing appointment tomorrow",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:AV Detailing appointment in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Downloads an ICS file for a booking
 */
export function downloadICS(event: CalendarEvent): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `av-detailing-${format(event.startDate, "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates a calendar event from booking data
 */
export function createBookingCalendarEvent(booking: {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number | null;
  service_address?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_zip?: string | null;
  services?: { name: string } | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
}): CalendarEvent {
  // Parse the scheduled time (format: "HH:mm" or "h:mm AM/PM")
  let startDate: Date;
  const dateStr = booking.scheduled_date;
  const timeStr = booking.scheduled_time;
  
  try {
    // Try 24-hour format first
    startDate = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date());
    if (isNaN(startDate.getTime())) {
      // Try 12-hour format
      startDate = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd h:mm a", new Date());
    }
    if (isNaN(startDate.getTime())) {
      // Fallback: just use the date
      startDate = new Date(dateStr);
    }
  } catch {
    startDate = new Date(dateStr);
  }

  const duration = booking.duration_minutes || 120; // Default 2 hours
  const endDate = addMinutes(startDate, duration);

  const location = [
    booking.service_address,
    booking.service_city,
    booking.service_state,
    booking.service_zip,
  ]
    .filter(Boolean)
    .join(", ");

  const vehicle = [
    booking.vehicle_year,
    booking.vehicle_make,
    booking.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  const title = `AV Detailing - ${booking.services?.name || "Detailing Service"}`;
  const description = [
    `Service: ${booking.services?.name || "Detailing Service"}`,
    vehicle ? `Vehicle: ${vehicle}` : null,
    `Location: ${location || "TBD"}`,
    "",
    "Questions? Call (225) 555-1234",
    "https://avdetailing.lovable.app",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    id: booking.id,
    title,
    description,
    location,
    startDate,
    endDate,
  };
}

/**
 * Generates a Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
