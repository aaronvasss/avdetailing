import { format, parse, addMinutes, isBefore, isAfter, areIntervalsOverlapping } from "date-fns";

// ============= SCHEDULING CONSTANTS =============

// Working hours: 6:00 AM – 8:00 PM
export const WORKING_HOURS = {
  START_HOUR: 6,
  START_MINUTE: 0,
  END_HOUR: 20,
  END_MINUTE: 0,
};

// Buffer time after each appointment (in minutes)
export const BUFFER_MINUTES = 15;

// Time slot interval (in minutes)
export const SLOT_INTERVAL = 30;



// ============= SERVICE DURATION MAP =============
// Maps package slugs to their exact durations in minutes

export const PACKAGE_DURATIONS: Record<string, number> = {
  // Car Detailing Packages
  "exterior-only": 45,
  "basic": 105,        // 1 hour 45 minutes
  "silver": 140,       // 2 hours 20 minutes
  "gold": 180,         // 3 hours 00 minutes
  
  // Paint Correction
  "polish-1": 300,     // 5 hours (1-Step Polish)
  "polish-2": 420,     // 7 hours (2-Step Correction)
  "polish-3": 780,     // 13 hours (3-Step Restoration)
  
  // Ceramic Coating
  "ceramic-lite": 300, // 5 hours
  "ceramic-pro": 480,  // 8 hours (1 day estimate)
  "ceramic-elite": 720,// 12 hours (multi-day)
  
  // Boat Detailing
  "boat-basic": 150,   // 2.5 hours
  "boat-full": 300,    // 5 hours
  
  // RV Detailing
  "rv-basic": 210,     // 3.5 hours
  "rv-full": 420,      // 7 hours
  
  // Aircraft Detailing
  "aircraft-basic": 210, // 3.5 hours
  "aircraft-full": 390,  // 6.5 hours
};

// Default duration if package not found (2 hours 15 minutes)
export const DEFAULT_DURATION = 135;

// ============= UTILITY FUNCTIONS =============

/**
 * Gets the duration for a package including buffer time
 */
export function getPackageDuration(packageSlug: string): number {
  return PACKAGE_DURATIONS[packageSlug] || DEFAULT_DURATION;
}

/**
 * Gets the total blocked time (service duration + buffer)
 */
export function getTotalBlockedTime(packageSlug: string): number {
  return getPackageDuration(packageSlug) + BUFFER_MINUTES;
}

/**
 * Converts time string to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  // Handle "HH:mm:ss" or "HH:mm" format
  const match24 = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    return parseInt(match24[1]) * 60 + parseInt(match24[2]);
  }
  
  // Handle "h:mm AM/PM" format
  const match12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1]);
    const minutes = parseInt(match12[2]);
    const period = match12[3].toUpperCase();
    
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }
  
  return 0;
}

/**
 * Converts minutes from midnight to time string
 */
export function minutesToTime(minutes: number, format12h = true): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (format12h) {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  }
  
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Gets the start of working hours in minutes from midnight
 */
export function getWorkingStartMinutes(): number {
  return WORKING_HOURS.START_HOUR * 60 + WORKING_HOURS.START_MINUTE;
}

/**
 * Gets the end of working hours in minutes from midnight
 */
export function getWorkingEndMinutes(): number {
  return WORKING_HOURS.END_HOUR * 60 + WORKING_HOURS.END_MINUTE;
}

/**
 * Checks if a time slot is valid for a given service duration
 * Ensures the service + buffer ends before working hours end
 */
export function isSlotValid(slotMinutes: number, serviceDuration: number): boolean {
  const workStart = getWorkingStartMinutes();
  const workEnd = getWorkingEndMinutes();
  const totalBlocked = serviceDuration + BUFFER_MINUTES;
  
  // Slot must start at or after working hours start
  if (slotMinutes < workStart) return false;
  
  // Service + buffer must end at or before working hours end
  // (We don't need buffer if it's the last appointment, but for safety we include it)
  // Actually, the service itself must end before 7:30 PM
  if (slotMinutes + serviceDuration > workEnd) return false;
  
  return true;
}

/**
 * Generates all possible time slots for a given date and service
 */
export function generateTimeSlots(
  serviceDuration: number,
  existingBookings: Array<{
    scheduled_time: string;
    duration_minutes: number | null;
  }> = []
): string[] {
  const slots: string[] = [];
  const workStart = getWorkingStartMinutes();
  const workEnd = getWorkingEndMinutes();
  
  // Generate slots at SLOT_INTERVAL intervals
  for (let minutes = workStart; minutes <= workEnd; minutes += SLOT_INTERVAL) {
    // Check if slot is valid (service ends before closing)
    if (!isSlotValid(minutes, serviceDuration)) continue;
    
    // Check if slot overlaps with existing bookings
    let isAvailable = true;
    
    for (const booking of existingBookings) {
      const bookingStart = timeToMinutes(booking.scheduled_time);
      const bookingDuration = booking.duration_minutes || DEFAULT_DURATION;
      const bookingEnd = bookingStart + bookingDuration + BUFFER_MINUTES;
      
      const slotEnd = minutes + serviceDuration + BUFFER_MINUTES;
      
      // Check for overlap: new slot overlaps if it starts before existing ends
      // AND ends after existing starts
      if (minutes < bookingEnd && slotEnd > bookingStart) {
        isAvailable = false;
        break;
      }
    }
    
    if (isAvailable) {
      slots.push(minutesToTime(minutes, true));
    }
  }
  
  return slots;
}

/**
 * Validates if a booking can be made at the specified time
 */
export function validateBookingTime(
  scheduledTime: string,
  serviceDuration: number,
  existingBookings: Array<{
    scheduled_time: string;
    duration_minutes: number | null;
    id?: string;
  }> = [],
  excludeBookingId?: string
): { valid: boolean; error?: string } {
  const slotMinutes = timeToMinutes(scheduledTime);
  const workStart = getWorkingStartMinutes();
  const workEnd = getWorkingEndMinutes();
  
  // Check working hours
  if (slotMinutes < workStart) {
    return {
      valid: false,
      error: `Appointments cannot start before ${minutesToTime(workStart)}`,
    };
  }
  
  // Check if service ends before closing
  if (slotMinutes + serviceDuration > workEnd) {
    return {
      valid: false,
      error: `This service would end after ${minutesToTime(workEnd)}. Please choose an earlier time.`,
    };
  }
  
  // Check for overlaps with existing bookings
  for (const booking of existingBookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;
    
    const bookingStart = timeToMinutes(booking.scheduled_time);
    const bookingDuration = booking.duration_minutes || DEFAULT_DURATION;
    const bookingEnd = bookingStart + bookingDuration + BUFFER_MINUTES;
    
    const slotEnd = slotMinutes + serviceDuration + BUFFER_MINUTES;
    
    if (slotMinutes < bookingEnd && slotEnd > bookingStart) {
      return {
        valid: false,
        error: "This time conflicts with an existing appointment. Please choose a different time.",
      };
    }
  }
  
  return { valid: true };
}

/**
 * Formats duration for display
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Gets display-friendly working hours
 */
export function getWorkingHoursDisplay(): string {
  return `${minutesToTime(getWorkingStartMinutes())} - ${minutesToTime(getWorkingEndMinutes())}`;
}
