import { describe, expect, it, vi } from "vitest";
import { AnalyticsRuntime, type AnalyticsPort } from "@/lib/analytics-runtime";
import { ANALYTICS_ORIGIN, ANALYTICS_RELEASE } from "@/lib/analytics-policy";
import { acceptedQuoteEvent, BOOKING_SERVICES, contactMethod, inquiryService, savedBookingEvent, type MeasurementEvent } from "@/lib/analytics-events";

function setup(origin = ANALYTICS_ORIGIN, gates = { releaseAuthorized: true, streamSettingsVerified: true }) {
  let ready = () => {};
  const command = vi.fn();
  const port: AnalyticsPort = { origin: () => origin, pathname: () => "/book", referrer: () => "https://avdetailing.net/car-detailing-baton-rouge?token=secret",
    disable: vi.fn(), command, load: callback => { ready = callback; return () => {}; } };
  const runtime = new AnalyticsRuntime(port, gates);
  runtime.navigate("/book"); runtime.setPreference("accepted"); ready();
  const events = () => command.mock.calls.filter(args => args[0] === "event" && args[1] !== "page_view");
  return { runtime, command, events };
}

describe("privacy-safe lead measurement", () => {
  it.each(BOOKING_SERVICES.flatMap(service => ["online", "in_person"].map(payment => [service, payment])))
  ("measures saved %s / %s once without asserting payment", (service, payment) => {
    const h = setup(); const occurrence = {};
    const event = savedBookingEvent({ booking: { id: "secret-id", total_price: 500, email: "secret@example.com" } }, null, service, payment);
    h.runtime.track(event, occurrence); h.runtime.track(event, occurrence); h.runtime.navigate("/book");
    expect(h.events()).toHaveLength(1);
    expect(h.events()[0]).toEqual(["event", "booking_submitted", {
      service_type: service, payment_method: payment, submission_state: payment === "online" ? "pending" : "received",
      page_path: "/book", page_location: "https://avdetailing.net/book", page_title: "Book a Detailing Service — AV Detailing",
      page_referrer: "https://avdetailing.net/car-detailing-baton-rouge" }]);
    expect(JSON.stringify(h.command.mock.calls)).not.toMatch(/secret|purchase|revenue|currency|value|booking_id|session_id/);
  });
  it.each(["aircraft", "ceramic", "car", "rv", "boat", "paint", "other"])("measures accepted %s inquiry once (not inbox delivery)", service => {
    const h = setup(); const occurrence = {};
    const event = acceptedQuoteEvent({ success: true, message: "private", id: "secret" }, null, service);
    h.runtime.track(event, occurrence); h.runtime.track(event, occurrence);
    expect(h.events()).toHaveLength(1);
    expect(h.events()[0]?.[1]).toBe("generate_lead");
    expect(h.events()[0]?.[2]).toMatchObject({ service_type: service, submission_state: "received",
      quote_category: service === "aircraft" ? "aircraft_quote" : service === "ceramic" ? "coating_quote" : "service_inquiry" });
  });
  it.each([null, {}, { booking: {} }, { booking: { id: "" } }])("missing saved record %j emits no conversion", response => {
    const h = setup(); h.runtime.track(savedBookingEvent(response, null, "car", "online"), {}); expect(h.events()).toHaveLength(0);
  });
  it("validation/API failures and unsupported values never convert", () => {
    const h = setup();
    for (const event of [savedBookingEvent({ booking: { id: "saved" } }, new Error("failure"), "car", "online"),
      savedBookingEvent({ booking: { id: "saved" } }, null, "customer-name", "cash-secret"),
      acceptedQuoteEvent({ success: true }, new Error("failure"), "aircraft"), acceptedQuoteEvent({ success: false }, null, "aircraft"),
      acceptedQuoteEvent({}, null, "aircraft"), acceptedQuoteEvent(null, null, "aircraft")]) h.runtime.track(event, {});
    expect(h.events()).toHaveLength(0);
  });
  it.each(["http://localhost:8080", "http://localhost:4173", "https://avdetailing.lovable.app", "https://id-preview--5268592b-be3a-4302-8986-c547b2ca2e04.lovable.app"])
  ("never sends events from %s", origin => {
    const h = setup(origin); h.runtime.track(acceptedQuoteEvent({ success: true }, null, "aircraft"), {});
    expect(h.command).not.toHaveBeenCalled();
  });
  it("closed source gates suppress every event even with consent", () => {
    const h = setup(ANALYTICS_ORIGIN, ANALYTICS_RELEASE);
    h.runtime.track(savedBookingEvent({ booking: { id: "saved" } }, null, "car", "online"), {});
    expect(h.command).not.toHaveBeenCalled();
  });
  it.each(["/account", "/admin", "/worker", "/auth", "/reset-password", "/booking/manage", "/booking/success", "/cancel/private", "/unknown"])
  ("drops and never replays activity on %s", path => {
    const h = setup(); const occurrence = {}; const event = acceptedQuoteEvent({ success: true }, null, "aircraft");
    h.runtime.navigate(path); h.runtime.track(event, occurrence); h.runtime.navigate("/book"); h.runtime.track(event, occurrence);
    expect(h.events()).toHaveLength(0);
  });
  it("decline/revoke drops instead of queueing or replaying", () => {
    const h = setup(); const occurrence = {}; const event = acceptedQuoteEvent({ success: true }, null, "aircraft");
    h.runtime.setPreference("declined"); h.runtime.track(event, occurrence); h.runtime.setPreference("accepted"); h.runtime.track(event, occurrence);
    expect(h.events()).toHaveLength(0);
  });
  it("rebuilds the event payload from enums and excludes injected fields", () => {
    const h = setup(); h.runtime.track({ name: "contact_click", params: { method: "call", email: "secret" } } as MeasurementEvent, {});
    expect(h.events()[0]?.[2]).toEqual({ method: "call", page_path: "/book", page_location: "https://avdetailing.net/book",
      page_title: "Book a Detailing Service — AV Detailing", page_referrer: "https://avdetailing.net/car-detailing-baton-rouge" });
    h.runtime.track({ name: "purchase", params: {} } as unknown as MeasurementEvent, {});
    expect(h.events()).toHaveLength(1);
  });
  it("call/text clicks stay separate from conversions, with no phone transmitted", () => {
    const h = setup();
    for (const href of ["tel:2255216264", "sms:2255216264"]) {
      const method = contactMethod(href); if (method) h.runtime.track({ name: "contact_click", params: { method } }, {});
    }
    expect(h.events().map(e => e[1])).toEqual(["contact_click", "contact_click"]);
    expect(h.events().map(e => (e[2] as { method: string }).method)).toEqual(["call", "text"]);
    expect(contactMethod("tel:2252284796")).toBeNull(); expect(contactMethod("sms:2255216264?body=private")).toBeNull();
    expect(JSON.stringify(h.events())).not.toContain("2255216264");
  });
  it("maps only fixed service options, never free text", () => {
    expect(inquiryService("Aircraft Detailing")).toBe("aircraft"); expect(inquiryService("Ceramic Coating")).toBe("ceramic");
    expect(inquiryService("private email ceramic request")).toBe("other");
  });
  it("analytics exceptions cannot reject booking actions", () => {
    const h = setup(); h.command.mockImplementation(() => { throw new Error("analytics offline"); });
    expect(() => h.runtime.track(acceptedQuoteEvent({ success: true }, null, "aircraft"), {})).not.toThrow();
  });
});