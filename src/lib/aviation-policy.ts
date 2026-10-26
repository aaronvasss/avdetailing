// Owner-confirmed public policy only; does not change payment enforcement.
export const aviationPolicy = {
  depositRequired: false,
  responseDeadlineHours: null,
  coverage: {
    batonRouge: { available: true, establishedAirportAccess: true },
    lafayette: { available: true, establishedAirportAccess: false },
    newOrleans: { available: true, airportsThroughoutArea: true, establishedAirportAccess: false },
    lakeCharles: { inquiryOnly: true },
  },
  coordinateAccessAndWorkspacePerJob: true,
} as const;

export const AVIATION_QUOTE_TEXT = aviationPolicy.depositRequired
  ? "Contact us to discuss aircraft booking requirements."
  : "Aircraft bookings do not require a deposit. Share your aircraft make/model, airport and hangar or FBO location, requested services, condition, preferred dates, and contact details. Photos are optional. We confirm access and workspace arrangements before finalizing your quote.";

export const AVIATION_COVERAGE_TEXT =
  "We serve Baton Rouge, Lafayette, and airports throughout the New Orleans area. We have established access arrangements at Baton Rouge Metropolitan Airport. Access and workspace arrangements are coordinated for each job with the airport, FBO or hangar; coverage does not imply standing permission at every airport. Lake Charles is inquiry-only — contact us to discuss your location.";
// Opens the existing aircraft quote form; carries no price or deposit values.
export const AIRCRAFT_QUOTE_HREF = "/book?service=aircraft";
