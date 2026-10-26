export const BOOKING_SERVICES = ["car", "rv", "boat", "paint", "ceramic"] as const;
export type BookingService = typeof BOOKING_SERVICES[number];
export type LeadService = BookingService | "aircraft" | "other";
export type MeasurementEvent =
  | { name: "booking_submitted"; params: { service_type: BookingService; payment_method: "online" | "in_person"; submission_state: "pending" | "received" } }
  | { name: "generate_lead"; params: { service_type: LeadService; quote_category: "aircraft_quote" | "coating_quote" | "service_inquiry"; submission_state: "received" } }
  | { name: "contact_click"; params: { method: "call" | "text" } };

const member = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && values.includes(value as T);

/** Rebuild from allowlisted values: extra response/form properties cannot escape. */
export function safeMeasurementEvent(event: MeasurementEvent): MeasurementEvent | null {
  if (event.name === "booking_submitted" && member(BOOKING_SERVICES, event.params.service_type) &&
    member(["online", "in_person"], event.params.payment_method) && member(["pending", "received"], event.params.submission_state)) {
    return { name: event.name, params: { service_type: event.params.service_type,
      payment_method: event.params.payment_method, submission_state: event.params.submission_state } };
  }
  if (event.name === "generate_lead" && member([...BOOKING_SERVICES, "aircraft", "other"], event.params.service_type) &&
    member(["aircraft_quote", "coating_quote", "service_inquiry"], event.params.quote_category) && event.params.submission_state === "received") {
    return { name: event.name, params: { service_type: event.params.service_type,
      quote_category: event.params.quote_category, submission_state: "received" } };
  }
  if (event.name === "contact_click" && member(["call", "text"], event.params.method))
    return { name: event.name, params: { method: event.params.method } };
  return null;
}

export function savedBookingEvent(response: unknown, error: unknown, service: string, payment: string): MeasurementEvent | null {
  if (error || !response || typeof response !== "object" || !("booking" in response)) return null;
  const booking = response.booking;
  if (!booking || typeof booking !== "object" || !("id" in booking) || typeof booking.id !== "string" || !booking.id.trim()) return null;
  if (!member(BOOKING_SERVICES, service) || !member(["online", "in_person"], payment)) return null;
  return { name: "booking_submitted", params: { service_type: service, payment_method: payment,
    submission_state: payment === "online" ? "pending" : "received" } };
}

export function acceptedQuoteEvent(response: unknown, error: unknown, service: string): MeasurementEvent | null {
  if (error || !response || typeof response !== "object" || !("success" in response) || response.success !== true) return null;
  const service_type: LeadService = member([...BOOKING_SERVICES, "aircraft", "other"], service) ? service : "other";
  return { name: "generate_lead", params: { service_type, submission_state: "received",
    quote_category: service_type === "aircraft" ? "aircraft_quote" : service_type === "ceramic" ? "coating_quote" : "service_inquiry" } };
}

/** Exact fixed options only: never parse free-text service/message content. */
export function inquiryService(option?: string): LeadService {
  const options: Record<string, LeadService> = { "Car Detailing": "car", "RV Detailing": "rv", "Boat Detailing": "boat",
    "Ceramic Coating": "ceramic", "Paint Correction": "paint", "Aircraft Detailing": "aircraft" };
  return option && Object.prototype.hasOwnProperty.call(options, option) ? options[option] : "other";
}

/** Deliberately accepts only the public business number, never arbitrary contacts. */
export function contactMethod(href: string | null): "call" | "text" | null {
  if (!href) return null;
  if (/^tel:(?:\+1)?2255216264$/.test(href)) return "call";
  if (/^sms:(?:\+1)?2255216264$/.test(href)) return "text";
  return null;
}