import { CERAMIC_BOOKING_PRICES, CERAMIC_TIER_LABELS, type CeramicTier } from "./pricing-fallback";
import { escapeFaqHtml, pageFaqHtml, type PageFaq } from "./page-faqs";

export const CERAMIC_COST = {
  path: "/ceramic-coating-cost-baton-rouge",
  title: "Ceramic Coating Cost in Baton Rouge | AV Detailing",
  description: "Compare 3-, 6- and 10-Year ceramic coating prices for sedans, coupes, SUVs and trucks in Baton Rouge. Paint correction is assessed and quoted separately.",
  h1: "How Much Does Ceramic Coating Cost in Baton Rouge?",
  intro: "Compare AV Detailing’s System X car ceramic coating options by vehicle size and tier. These prices come from the coating options used in booking. Paint condition and any separately quoted paint correction should be discussed before choosing an option.",
};
export const CERAMIC_COST_ROWS = (["3-year", "5-year", "10-year"] as CeramicTier[]).map(key => ({
  key, label: CERAMIC_TIER_LABELS[key].replace(" Protection", ""),
  car: CERAMIC_BOOKING_PRICES.car[key], suvTruck: CERAMIC_BOOKING_PRICES["suv-truck"][key],
}));
export const CERAMIC_COST_GUIDANCE = [
  { title: "Vehicle size", text: "Sedans and coupes use one price group; SUVs and trucks use another. Choose the correct vehicle when booking so the selected tier shows the applicable price." },
  { title: "Paint condition", text: "Tell us about swirls, scratches, previous coatings or recent paintwork. Paint is assessed before coating; any preparation and correction scope is agreed with you." },
  { title: "Separate paint correction", text: "Paint correction is assessed and quoted separately from ceramic coating. A coating option does not mean every paint defect will be corrected or removed." },
  { title: "Tier names", text: "The three options are named 3-Year, 6-Year and 10-Year. Compare the tier and vehicle price; these names are not a warranty or a promise of a specific result. Ask us to confirm the scope and care instructions." },
  { title: "Appointment planning", text: "Timing is confirmed when booking after reviewing vehicle condition and the agreed preparation work. Share the work location, access instructions and any problem areas before the appointment." },
];
export const CERAMIC_COST_FAQS: PageFaq[] = [
  { question: "What are the ceramic coating prices in Baton Rouge?", answer: CERAMIC_COST_ROWS.map(r => `${r.label}: $${r.car.toLocaleString("en-US")} for sedans/coupes and $${r.suvTruck.toLocaleString("en-US")} for SUVs/trucks.`).join(" ") },
  { question: "Does the coating price include paint correction?", answer: "Paint correction is assessed and quoted separately. Discuss paint condition and preparation before selecting your coating tier." },
  { question: "How do the 3-Year, 6-Year and 10-Year options differ?", answer: "They are the owner-confirmed tier names with separate prices by vehicle size. AV Detailing uses System X for car coatings; no specific product line or warranty is stated here. Confirm the agreed scope before booking." },
  { question: "How long does ceramic coating take?", answer: "Timing is confirmed when booking. Vehicle condition and separately agreed preparation work affect the appointment; ask us before making plans around it." },
  { question: "How do I book ceramic coating?", answer: "Use the booking page, choose Ceramic Coating, your vehicle type and tier. You can also call (225) 521-6264 to discuss paint condition and the work location first." },
];
export const CERAMIC_COST_LINKS = [
  { href: "/ceramic-coating-baton-rouge", text: "Ceramic coating options and preparation" },
  { href: "/paint-correction-baton-rouge", text: "Paint correction assessment and pricing" },
  { href: "/book", text: "Book ceramic coating" },
];
export function ceramicCostHtml() {
  const esc = escapeFaqHtml;
  return `<h1>${esc(CERAMIC_COST.h1)}</h1><p>${esc(CERAMIC_COST.intro)}</p><h2>Prices by vehicle and tier</h2><table><thead><tr><th>Option</th><th>Sedan / coupe</th><th>SUV / truck</th></tr></thead><tbody>${CERAMIC_COST_ROWS.map(r => `<tr><th>${r.label}</th><td>$${r.car.toLocaleString("en-US")}</td><td>$${r.suvTruck.toLocaleString("en-US")}</td></tr>`).join("")}</tbody></table><h2>What changes the scope and price?</h2>${CERAMIC_COST_GUIDANCE.map(g => `<h3>${esc(g.title)}</h3><p>${esc(g.text)}</p>`).join("")}<ul>${CERAMIC_COST_LINKS.map(l => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul>${pageFaqHtml(CERAMIC_COST_FAQS)}`;
}