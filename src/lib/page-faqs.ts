import { CAR_PAGE_DISPLAY_FROM, CERAMIC_BOOKING_PRICES, CERAMIC_TIER_LABELS, FALLBACK_PACKAGES } from "./pricing-fallback";
import { AVIATION_COVERAGE_TEXT } from "./aviation-policy";

export interface PageFaq { question: string; answer: string }
interface PriceSource { packageFrom(service: "car" | "paint" | "boat" | "rv", name: string): number | null; label(value: number | null): string }
const money = (n: number | null) => n == null ? "Custom quote" : `$${Math.round(n).toLocaleString("en-US")}`;
const fallback: PriceSource = {
  packageFrom: (service, name) => FALLBACK_PACKAGES.find(p => p.service === service && p.name === name)?.price ?? null,
  label: money,
};
const timing: PageFaq = { question: "How long will the appointment take?", answer: "Timing is confirmed when booking after the vehicle, condition and requested work are reviewed. Ask us to confirm the appointment length before making plans around it." };
const areas: PageFaq = { question: "What areas do you serve?", answer: "AV Detailing provides mobile service in Baton Rouge and surrounding communities, including Denham Springs, Prairieville, Gonzales, Walker, Zachary and Central. Share your service address when booking." };
const prepare: PageFaq = { question: "What should I prepare before my detail?", answer: "Tell us where the vehicle will be parked, include any access instructions and note the areas you want addressed. Confirm the work location and appointment timing when booking." };
const book: PageFaq = { question: "How do I book mobile detailing?", answer: "Choose your service, vehicle and package on the booking page, add any separate extras and select an available appointment. You can also call (225) 521-6264 to discuss the work." };

export const CORE_FAQ_PATHS = ["/car-detailing-baton-rouge", "/ceramic-coating-baton-rouge", "/paint-correction-baton-rouge", "/boat-detailing-baton-rouge", "/rv-detailing-baton-rouge", "/aircraft-detailing-baton-rouge"] as const;

/** One fact source for the visible accordion, JSON-LD and postbuild fallback. */
export function corePageFaqs(path: string, pricing: PriceSource = fallback): PageFaq[] {
  switch (path) {
    case "/car-detailing-baton-rouge": return [
      { question: "How much does car detailing cost in Baton Rouge?", answer: `Basic full interior and exterior detailing starts at ${money(CAR_PAGE_DISPLAY_FROM.basic)}. Silver starts at ${pricing.label(pricing.packageFrom("car", "Silver Package"))} and Gold at ${pricing.label(pricing.packageFrom("car", "Gold Package"))}. Your vehicle and selected add-ons determine the booking total.` },
      { question: "Are odor elimination and pet hair removal included?", answer: "Odor Elimination and Pet Hair Removal are separate booking add-ons, alongside Clay Bar Treatment, Engine Bay Cleaning and Headlight Restoration. Do not assume these extras are included in Basic, Silver or Gold." }, timing, areas, prepare, book,
    ];
    case "/ceramic-coating-baton-rouge": return [
      { question: "How much does ceramic coating cost in Baton Rouge?", answer: `System X car ceramic coating options start at ${(["3-year", "5-year", "10-year"] as const).map(t => `${money(CERAMIC_BOOKING_PRICES.car[t])} for the ${CERAMIC_TIER_LABELS[t].replace(" Protection", "")} option`).join(", ")}. SUV and truck prices differ; choose your vehicle to see its price when booking.` },
      { question: "Is paint correction included with ceramic coating?", answer: "Paint correction is assessed and quoted separately. Discuss the paint condition and any preparation needed before choosing your coating option." }, timing, areas, prepare, book,
    ];
    case "/paint-correction-baton-rouge": return [
      { question: "How much does paint correction cost in Baton Rouge?", answer: `Starting prices are ${pricing.label(pricing.packageFrom("paint", "1-Step Polish"))}+ for 1-Step Polish, ${pricing.label(pricing.packageFrom("paint", "2-Step Correction"))}+ for 2-Step Correction and ${pricing.label(pricing.packageFrom("paint", "3-Step Restoration"))}+ for 3-Step Restoration. The work is quoted after a paint assessment; ceramic coating is a separate service.` },
      { question: "Which paint correction option should I choose?", answer: "Describe the swirls, haze or scratches you want addressed. We assess the paint condition and defect depth before recommending a correction scope; not every defect can be removed." }, timing, areas, prepare, book,
    ];
    case "/boat-detailing-baton-rouge": return [
      { question: "How much does boat detailing cost in Baton Rouge?", answer: `Boat Wash & Wax starts at ${pricing.label(pricing.packageFrom("boat", "Boat Wash & Wax"))}, Boat Full Detail at ${pricing.label(pricing.packageFrom("boat", "Boat Full Detail"))} and Boat Premium Detail at ${pricing.label(pricing.packageFrom("boat", "Boat Premium Detail"))}. Work outside these packages is quoted after reviewing your boat.` },
      { question: "Can you clean a hull while the boat is in the water?", answer: "No. Hull cleaning is performed only with the boat out of the water on a trailer or lift. We do not offer in-water or afloat hull cleaning; share the boat location and access arrangements." },
      { question: "Is boat ceramic coating the same as Premium Detail sealant?", answer: "No. Standalone System X boat ceramic coating is a separate, quote-based service from the ceramic sealant included in Boat Premium Detail." }, timing, areas,
      { question: "How do I book boat detailing?", answer: "Select boat detailing on the booking page or call (225) 521-6264. Share the boat type, condition, requested work, location and trailer or lift access so scope and timing can be confirmed." },
    ];
    case "/rv-detailing-baton-rouge": return [
      { question: "How much does RV detailing cost in Baton Rouge?", answer: `RV Exterior Wash starts at ${pricing.label(pricing.packageFrom("rv", "RV Exterior Wash"))}. Share the RV size, exterior condition, location and requested work so other exterior services can be assessed and quoted.` },
      { question: "Do you offer RV interior detailing?", answer: "No. RV and motorhome detailing is exterior-only; RV interior and upholstery cleaning are not offered." },
      { question: "Do you offer RV roof cleaning?", answer: "Yes. RV roof cleaning is offered. Roof material, condition and access are assessed first; confirm the scope rather than assuming it is included in an exterior wash." }, timing, areas,
      { question: "How do I book RV detailing?", answer: "Select RV detailing on the booking page or call (225) 521-6264. Include the RV size, exterior condition, location, access instructions and requested work." },
    ];
    case "/aircraft-detailing-baton-rouge": return [
      { question: "How much does aircraft detailing cost in Baton Rouge?", answer: "Aircraft detailing is quoted individually after reviewing the aircraft make/model, condition, requested services and location. Automotive package prices do not apply to aircraft." },
      { question: "Do aircraft bookings require a deposit?", answer: "Aircraft bookings do not require a deposit. Scope, access arrangements and the quote are confirmed for each aircraft." },
      { question: "What aircraft detailing services can I request?", answer: "Private-aircraft services include shampooing, deep interior cleaning, polishing and aviation ceramic coating. Exact scope is agreed after reviewing the aircraft and requested work." },
      { question: "Which aircraft service areas do you cover?", answer: AVIATION_COVERAGE_TEXT },
      { question: "How long does aircraft detailing take?", answer: "Timing is confirmed after reviewing the aircraft, requested work and airport or FBO access arrangements. Include preferred dates and availability with your inquiry." },
      { question: "How do I request an aircraft quote?", answer: "Use Request an Aircraft Quote or call (225) 521-6264. Include aircraft make/model, airport and hangar/FBO location, requested services, condition, preferred dates and contact details. Photos are optional; an aircraft registration number is not required initially." },
    ];
    default: return [];
  }
}

export function cityPageFaqs(city: string, neighborhoods: string): PageFaq[] {
  return [
    { question: `Do you come to ${city}?`, answer: `Yes. AV Detailing provides mobile car detailing at homes and offices in ${city}. Share the service address and access instructions when booking.` },
    { question: `Which ${city} neighborhoods and areas do you serve?`, answer: neighborhoods },
    { question: `How do I book car detailing in ${city}?`, answer: `Book online, choose your car, SUV or truck and a Basic, Silver or Gold package, then select any separate add-ons and an available time. You can also call (225) 521-6264.` },
    { question: `What should I prepare for mobile detailing in ${city}?`, answer: "Tell us where the vehicle will be parked and include any access instructions or areas you want addressed. Confirm appointment timing when booking; appointments have a 30-minute arrival window." },
  ];
}

export function pageFaqSchema(faqs: PageFaq[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
}
export const escapeFaqHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function pageFaqHtml(faqs: PageFaq[]): string {
  return faqs.length ? `<section data-page-faqs><h2>Frequently Asked Questions</h2>${faqs.map(f => `<details><summary>${escapeFaqHtml(f.question)}</summary><p>${escapeFaqHtml(f.answer)}</p></details>`).join("")}</section>` : "";
}