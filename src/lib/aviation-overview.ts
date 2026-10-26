import { AVIATION_COVERAGE_TEXT, AVIATION_QUOTE_TEXT } from "./aviation-policy";

// Shared by the visible overview and its initial-HTML fallback.
export const AVIATION_OVERVIEW = {
  path: "/aircraft-detailing-baton-rouge",
  title: "Aircraft & Private Jet Detailing Baton Rouge | AV Detailing",
  description: "Detailing for private aircraft and jets in Baton Rouge, Lafayette and New Orleans. Interior cleaning, polishing and ceramic coating. Request a quote.",
  h1: "Aircraft & Private Jet Detailing in Baton Rouge",
  intro: "AV Detailing provides mobile detailing for private aircraft, including private jets. Our services include shampooing, deep interior cleaning, polishing and aviation ceramic coating. We review your aircraft, its condition and the work you want before agreeing the service scope.",
  quoteHref: "/book",
  coverageText: AVIATION_COVERAGE_TEXT,
  quoteText: AVIATION_QUOTE_TEXT,
  services: [
    { title: "Shampooing & deep interior cleaning", description: "Discuss shampooing and deep cleaning for your private-aircraft cabin. Share the areas needing attention and the aircraft's condition so we can agree what is included before quoting.", href: "/aircraft-interior-detailing-baton-rouge", link: "Aircraft interior cleaning", icon: "interior" },
    { title: "Aircraft polishing", description: "Request polishing based on your aircraft's condition and the areas you want addressed. Polishing and coating are separate services; the work included is assessed for your aircraft.", href: "/aircraft-paint-protection-baton-rouge", link: "Aircraft polishing and coating", icon: "polishing" },
    { title: "Aviation ceramic coating", description: "Discuss ceramic coating for your aircraft alongside any requested polishing. We assess the proposed scope before finalizing your quote rather than applying an automotive package to aircraft work.", href: "/aircraft-paint-protection-baton-rouge", link: "Aviation ceramic coating", icon: "coating" },
  ],
  coverage: [
    { code: "BTR", title: "Baton Rouge", detail: "Established access arrangements at Baton Rouge Metropolitan Airport, subject to applicable airport and FBO arrangements. Confirm your airport and hangar or FBO location when requesting work." },
    { code: "LFT", title: "Lafayette", detail: "Aircraft detailing is available in the Lafayette area. Airport, hangar and workspace access is coordinated for each job; coverage does not mean standing airport permission." },
    { code: "NOLA", title: "New Orleans", detail: "Coverage includes airports throughout the New Orleans area. Access and workspace arrangements with the airport, FBO or hangar are coordinated for each job." },
    { code: "INQUIRY", title: "Lake Charles", detail: "Lake Charles is inquiry-only. Contact us with your location and requested work to discuss whether arrangements can be made." },
  ],
  questions: [
    { question: "What should I include in an aircraft quote request?", answer: "Share the aircraft make/model, airport and hangar or FBO location, requested services, current condition, preferred dates and contact details. Photos are optional. You do not need to provide an aircraft registration number initially." },
    { question: "Can you work at my airport or hangar?", answer: "We have established access arrangements only at Baton Rouge Metropolitan Airport. For every job, we confirm access and workspace arrangements with the airport, FBO or hangar before finalizing the quote. Lafayette and New Orleans coverage does not imply standing permission at those airports; Lake Charles is inquiry-only." },
    { question: "How is the service scope decided?", answer: "We review your aircraft, condition and requested work to agree the inclusions and exclusions. Shampooing, deep interior cleaning, polishing and aviation ceramic coating can be discussed in your request; the exact scope is confirmed for your aircraft." },
    { question: "How do I arrange a date for the work?", answer: "Use the aircraft quote flow and share your preferred dates and availability. We coordinate the requested work, location, access and workspace before confirming arrangements. Sending a quote request does not reserve an appointment." },
    { question: "Do aircraft bookings require a deposit?", answer: "Aircraft bookings do not require a deposit. The quote request lets us review your aircraft and requested services before confirming the scope and arrangements." },
  ],
} as const;

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function aviationOverviewHtml(): string {
  const page = AVIATION_OVERVIEW;
  return [
    `<h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.intro)}</p>`,
    `<h2>Aircraft detailing services</h2>`,
    ...page.services.map(service => `<h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p><a href="${service.href}">${escapeHtml(service.link)}</a>`),
    `<h2>Baton Rouge, Lafayette &amp; New Orleans coverage</h2><p>${escapeHtml(page.coverageText)}</p>`,
    ...page.coverage.map(area => `<h3>${area.title}</h3><p>${escapeHtml(area.detail)}</p>`),
    `<h2>Aircraft quote &amp; scheduling questions</h2>`,
    ...page.questions.map(item => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`),
    `<h2>Request an aircraft quote</h2><p>${escapeHtml(page.quoteText)}</p><a href="${page.quoteHref}">Request Aircraft Quote</a>`,
    `<a href="/aircraft-cleaning-baton-rouge">Aircraft cleaning information</a>`,
  ].join("");
}