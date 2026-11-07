import { type PageFaq, escapeFaqHtml } from "./page-faqs";
import { AVIATION_COVERAGE_TEXT, AIRCRAFT_QUOTE_HREF } from "./aviation-policy";

export interface ServiceExpectations { summary: string; preparation: string; faqs: PageFaq[]; links: { href: string; text: string }[] }
const q = (question: string, answer: string): PageFaq => ({ question, answer });
const timing = q("How long does this work take?", "Timing is confirmed when booking after the condition, requested work and access are reviewed. Ask us to confirm the appointment length before making plans.");
const carLink = { href: "/car-detailing-baton-rouge", text: "Car detailing packages and separate add-ons" };
const boatLink = { href: "/boat-detailing-baton-rouge", text: "Boat detailing packages and quotes" };
const rvLink = { href: "/rv-detailing-baton-rouge", text: "Exterior RV detailing overview" };
const aircraftLink = { href: "/aircraft-detailing-baton-rouge", text: "Aircraft detailing scope and coverage" };
const entries: Record<string, ServiceExpectations> = {};
function add(slug: string, summary: string, preparation: string, faqs: PageFaq[], links: ServiceExpectations["links"]) {
  entries[`/${slug}-baton-rouge`] = { summary, preparation, faqs: [...faqs, timing], links };
}
add("engine-bay-cleaning", "Engine Bay Cleaning is a separate add-on to a car-detailing package. We check the engine compartment before cleaning and dressing it, adjusting the approach to the vehicle rather than assuming every bay is the same.", "Note leaks, exposed wiring, aftermarket parts and recent repairs. Tell us your vehicle year, make, model and whether the engine will be cool when we arrive.", [
  q("Is engine bay cleaning included in my detail?", "It is a separate booking add-on, not an assumed inclusion in Basic, Silver or Gold."),
  q("How do I book engine bay cleaning?", "Choose a car-detailing package and select Engine Bay Cleaning in the add-ons step. That step shows its current price."),
  q("What engine-bay issues should I disclose?", "Mention oil leaks, aftermarket parts, exposed wiring or recent repairs so the bay can be checked before cleaning."),
], [carLink]);
add("headlight-restoration", "Headlight Restoration is selected as a separate car-detailing add-on. Lens condition is checked before starting; restoration addresses surface haze or yellowing, not cracks or moisture inside a housing.", "Describe haze, yellowing, cracks or internal moisture and share a photo if available. We confirm what is realistic for the lens condition before doing the work.", [
  q("How do I add headlight restoration?", "Choose your car-detailing package and select Headlight Restoration on the add-ons step, where its current price is displayed."),
  q("Can restoration fix a cracked headlight?", "No. Restoration cannot fix cracks, internal moisture or damage to the lens itself."),
  q("Is a specific improvement guaranteed?", "No. Improvement depends on the lens condition, which is assessed before work begins."),
], [carLink]);
add("odor-removal", "Odor Elimination is a separate booking add-on. Describe the odor before the visit so expectations can be based on its source and how long it has been present; shampooing is not automatically included with this add-on.", "Tell us the odor type, affected areas, how long it has been present and any spills, stains or moisture. Gold separately includes seat/upholstery shampooing and carpet deep cleaning.", [
  q("Is odor elimination part of Basic, Silver or Gold?", "Odor Elimination is a separate add-on. Select it during booking rather than assuming it is included in a package."),
  q("What information helps assess an odor?", "Describe the source if known, where the odor is strongest, its duration and any stains, spills or moisture."),
  q("Where can I see the price?", "The booking add-ons step shows the current Odor Elimination price for your selection."),
], [carLink, { href: "/interior-detailing-baton-rouge", text: "Interior package inclusions" }]);
add("pet-hair-removal", "Pet Hair Removal is a separate booking add-on. Heavy or embedded hair needs additional attention; describe where it collects and how heavy it is so the requested work can be reviewed.", "Share pet type, affected cabin areas and the amount of hair. Silver includes a deep vacuum; Gold adds shampooing, but neither means the separate Pet Hair Removal add-on is included.", [
  q("Is pet hair removal included with a deep vacuum?", "Pet Hair Removal is a separate add-on; do not assume that Silver’s deep vacuum or Gold’s shampooing includes it."),
  q("How do I request pet hair removal?", "Choose your car-detailing package, then select Pet Hair Removal on the add-ons step to see its current price."),
  q("What should I tell you about the hair?", "Mention pet type, where hair gathers and whether it is heavy or embedded in the seats or carpet."),
], [carLink, { href: "/interior-detailing-baton-rouge", text: "Compare interior detailing packages" }]);
add("exterior-detailing", "Exterior Only covers hand wash and dry, wheels and tires, tire shine and exterior windows. Full interior/exterior packages are separate choices; Gold adds a paint sealant. Clay bar treatment is a separate add-on.", "Include your vehicle details, work location and the dirt, rough paint or other areas you want reviewed. Swirls, haze and scratches should be discussed as a separate paint-correction assessment.", [
  q("What does Exterior Only include?", "Hand wash and dry, wheels and tires, tire shine and exterior windows."),
  q("Is clay bar included in Exterior Only?", "Clay Bar Treatment is selected as a separate booking add-on."),
  q("Does an exterior wash remove scratches?", "A wash is not a paint-correction service. Discuss swirls, haze or scratches separately so the paint can be assessed."),
], [carLink, { href: "/paint-correction-baton-rouge", text: "Paint correction assessment" }]);
add("interior-detailing", "Match cabin work to the package: Basic has a light vacuum and wipe-down, Silver adds deep vacuuming and console, door, dashboard and trim cleaning, and Gold adds seat/upholstery shampooing, leather care and carpet deep cleaning.", "Tell us seat material, stains, odors, pet hair or spills. Remove personal items where possible and arrange vehicle access; results depend on material and stain type.", [
  q("Which package includes seat shampooing?", "Gold includes seat and upholstery shampooing and carpet deep cleaning. Seat shampooing is not included in Basic or Silver."),
  q("Are odor elimination and pet hair removal included?", "Both are separate booking add-ons. Select them in the extras step rather than assuming package inclusion."),
  q("Will every stain come out?", "No universal result is promised. Results vary with material, stain type and condition; some stains may remain."),
], [carLink]);
add("hull-cleaning", "Hull cleaning starts with an assessment of material, staining and access. The boat must be out of the water on a trailer or lift; scope and price are confirmed before scheduling.", "Provide boat type, length, hull material, staining details and location. Confirm trailer or lift arrangements and how the hull can be reached; photos are optional.", [
  q("Do you clean hulls in the water?", "No. Hull cleaning is trailer or lift only, with the boat out of the water. We do not offer in-water cleaning."),
  q("Is hull cleaning a fixed-price package?", "The request is reviewed before the scope and price are confirmed; no standalone hull price is stated here."),
  q("What details should I send?", "Boat type, length, hull material, staining, location and trailer or lift access; include photos if available."),
], [boatLink]);
add("pontoon-cleaning", "Pontoon care distinguishes decks, vinyl seating, rails and aluminum logs. Boat Wash & Wax includes an exterior wash, wax and vinyl cleaning; aluminum-log cleaning and heavier staining are reviewed and quoted separately.", "Share deck, seating and log condition, boat length, location and site rules. For hull/log access, describe trailer or lift arrangements; no in-water hull cleaning is offered.", [
  q("Are aluminum logs included in a boat package?", "Aluminum-log cleaning and heavier staining are assessed and quoted after the condition is reviewed rather than assumed as package inclusions."),
  q("What does Boat Wash & Wax include?", "An exterior wash, wax and vinyl cleaning. Compare boat packages or request a quoted scope for additional pontoon work."),
  q("What should I send before pontoon cleaning?", "Photos of the deck, seating and logs, boat details, current condition, location and site rules."),
], [boatLink, { href: "/hull-cleaning-baton-rouge", text: "Trailer/lift hull-access requirements" }]);
add("gelcoat-restoration", "Gelcoat is assessed and a test area is used before a package or quoted restoration scope is recommended. Boat Full Detail includes oxidation removal; Premium Detail adds compound polish and ceramic sealant, not standalone ceramic coating.", "Share faded or chalky areas and previous polishing, wax or coating. Results depend on gelcoat condition and some fading may not fully recover; heavier restoration is quoted after review.", [
  q("How do you decide the gelcoat scope?", "We assess the finish and test an area before recommending Full Detail, Premium Detail or separately quoted restoration work."),
  q("Can every faded finish be restored fully?", "No. Improvement depends on the condition of the gelcoat and some fading may not fully recover."),
  q("Is Premium Detail the same as ceramic coating?", "No. Premium Detail includes compound polish and ceramic sealant; standalone System X boat ceramic coating is a separate quote-based service."),
], [boatLink, { href: "/boat-ceramic-coating-baton-rouge", text: "Separate System X boat coating" }]);
add("rv-roof-cleaning", "Roof cleaning is offered within AV Detailing’s exterior-only RV service. Roof material, condition and access are assessed before scope and price are confirmed; it is not an assumed exterior-wash inclusion.", "Send RV type, year, make/model, roof material if known, visible condition, parking location and washing rules. Include photos if available and confirm safe access arrangements before scheduling.", [
  q("Do you offer RV roof cleaning?", "Yes. Roof material, condition and access are reviewed before the scope and quote are confirmed."),
  q("Is roof cleaning automatically included in an exterior wash?", "Do not assume inclusion. Request roof cleaning explicitly and confirm the agreed scope and price."),
  q("What roof details should I provide?", "RV details, roof material if known, condition, photos if available, work location and site rules."),
], [rvLink]);
add("rv-oxidation-removal", "Exterior fiberglass is washed and a test area assessed before compounding and polishing where the surface permits. Scope and price are confirmed before committing to the full job.", "Send photos of dull, chalky or faded areas, RV size and previous polishing/coating details. Confirm that washing and exterior work are permitted at the parked location.", [
  q("Why assess a test area first?", "The test shows how the surface responds so realistic scope and expectations can be agreed before the full job."),
  q("Is oxidation removal quoted individually?", "Pricing is confirmed after RV size and condition are reviewed; no universal restoration price is stated."),
  q("Can ceramic coating follow oxidation removal?", "Ceramic coating or sealant can be discussed as an optional separate protection step after the surface assessment."),
], [rvLink, { href: "/rv-ceramic-coating-baton-rouge", text: "RV coating and preparation" }]);
add("rv-ceramic-coating", "RV coating follows exterior washing and any needed oxidation removal or polishing. Coating is applied to the agreed exterior surfaces after preparation, with scope and pricing confirmed for the RV.", "Provide RV size, current finish photos, oxidation and any previous coating or polishing. Confirm preparation, covered surfaces and appointment timing before scheduling.", [
  q("Is RV ceramic coating an interior service?", "No. AV Detailing’s RV work is exterior-only, including the agreed exterior coating surfaces."),
  q("Does oxidation need attention before coating?", "The finish is assessed first; washing and any needed oxidation removal or polishing are discussed before coating."),
  q("Can I use the car coating tier prices for my RV?", "No. RV scope and price are confirmed after reviewing its size, condition and preparation; car coating prices are not RV quotes."),
], [rvLink, { href: "/rv-oxidation-removal-baton-rouge", text: "RV oxidation assessment" }]);
const aircraftPrep = "Send make/model, airport and hangar/FBO location, condition, requested areas, preferred dates and contact details. Photos are optional and an aircraft registration number is not required initially. Access and workspace are coordinated for each job.";
add("aircraft-cleaning", "Private-aircraft cleaning requests are assessed against confirmed services: deep interior cleaning, shampooing, polishing and aviation ceramic coating. The inquiry does not establish an exterior washing package or automatic inclusions.", aircraftPrep, [
  q("Is this a fixed aircraft washing package?", "No. It is an assessment and quote inquiry for confirmed aircraft services; inclusions and exclusions are agreed for your aircraft."),
  q("Does an aircraft quote request reserve an appointment?", "No. The request is reviewed and access, scope and dates are coordinated before arrangements are confirmed."),
  q("Do aircraft bookings require a deposit?", "Aircraft bookings do not require a deposit."),
], [aircraftLink, { href: AIRCRAFT_QUOTE_HREF, text: "Request an aircraft quote" }]);
add("aircraft-interior-detailing", "Deep cabin cleaning and shampooing are agreed for the requested aircraft areas. There is no assumed all-cabin package or automatic list of treated surfaces; preparation, inclusions and exclusions are confirmed first.", aircraftPrep + " Describe cabin materials, areas to exclude and any preparation or availability concerns. Drying and return-to-use arrangements require confirmation.", [
  q("Are all cabin surfaces automatically included?", "No. Exact cabin areas, materials, deep cleaning and shampooing are reviewed and agreed for your aircraft."),
  q("Which locations do you cover?", AVIATION_COVERAGE_TEXT),
  q("Is a fixed drying time promised?", "No. Drying and return-to-use arrangements are confirmed for the requested work and aircraft availability."),
], [aircraftLink, { href: AIRCRAFT_QUOTE_HREF, text: "Request a cabin-cleaning quote" }]);
add("aircraft-paint-protection", "Polishing and aviation ceramic coating are distinct detailing services, not repainting or paint repair. Requested surfaces, preparation, products and exclusions are confirmed for the aircraft; polishing is not automatically included with coating.", aircraftPrep + " Describe any known finish or previous coating and ask about preparation, workspace and aftercare for the agreed work.", [
  q("Is this aircraft repainting or paint repair?", "No. The services offered here are polishing and ceramic coating, not repainting or paint repair."),
  q("Is polishing included automatically with coating?", "No. Polishing, coating and preparation are distinct scope decisions to agree in the quote."),
  q("Are lifespan, warranty or curing times promised?", "No universal lifespan, warranty or fixed curing time is stated. Confirm products, surfaces, availability and aftercare for the proposed work."),
], [aircraftLink, { href: AIRCRAFT_QUOTE_HREF, text: "Request a polishing or coating quote" }]);
add("boat-ceramic-coating", "Standalone System X boat ceramic coating is quoted after reviewing the boat size and gelcoat or paint condition. It is separate from Boat Premium Detail’s compound polish and ceramic sealant. Oxidized or faded gelcoat may need restoration before coating.", "Send boat type, length, finish material and photos, mention previous coatings, wax or polishing, and describe oxidation or staining. Share location and site rules so preparation and work access can be agreed with the quote.", [
  q("Is System X boat coating included in Premium Detail?", "No. Premium Detail includes ceramic sealant; standalone System X ceramic coating is a separate quote-based service."),
  q("What determines a boat ceramic coating quote?", "Boat size, gelcoat or paint condition, and the preparation needed are reviewed before scope and price are confirmed."),
  q("Can oxidized gelcoat be coated without assessment?", "The surface is assessed first. Oxidized or faded gelcoat may need restoration before a coating is applied."),
], [boatLink, { href: "/gelcoat-restoration-baton-rouge", text: "Gelcoat assessment before coating" }, { href: "/mobile-boat-detailing-baton-rouge", text: "Plan an on-site boat visit" }]);
add("mobile-rv-detailing", "Mobile RV appointments are planned around the parked location: a home, storage lot or campground where exterior washing is allowed. Motorhomes, fifth wheels and travel trailers are serviced exterior-only; location permission is confirmed before scheduling.", "Provide RV type, size, year/make/model, photos, parking location and site rules. Specify exterior wash, roof cleaning, oxidation removal or coating, rather than assuming every service is included. Confirm scope, price and the 30-minute arrival window.", [
  q("Can you detail an RV at a storage lot or campground?", "We can plan exterior work where the parked location permits it. Share the address, access instructions and site rules so permission and arrangements can be confirmed."),
  q("Do mobile RV visits include the interior?", "No. RV detailing is exterior-only; interior and upholstery cleaning are not offered."),
  q("Which exterior work can I request?", "Exterior wash, roof cleaning, oxidation removal and ceramic coating can be discussed. Confirm each service’s scope and price rather than assuming package inclusion."),
], [rvLink, { href: "/rv-roof-cleaning-baton-rouge", text: "Request RV roof cleaning" }, { href: "/rv-oxidation-removal-baton-rouge", text: "RV oxidation assessment" }, { href: "/rv-ceramic-coating-baton-rouge", text: "RV coating preparation" }]);
entries["/aircraft-detailing-baton-rouge"] = {
  summary: "Plan aircraft work by separating the requested services: cabin deep cleaning and shampooing, polishing, or aviation ceramic coating. We assess condition and agree the included areas and exclusions; car packages, coating tiers and prices do not apply to aircraft.",
  preparation: aircraftPrep + " Share aircraft availability and ask about any drying, curing or return-to-use arrangements for the agreed work. An inquiry alone does not reserve a date, and aircraft bookings require no deposit.",
  faqs: [], links: [ { href: "/aircraft-cleaning-baton-rouge", text: "Aircraft condition assessment" }, { href: "/aircraft-interior-detailing-baton-rouge", text: "Cabin deep cleaning and shampooing" }, { href: "/aircraft-paint-protection-baton-rouge", text: "Polishing and aviation coating" }, { href: AIRCRAFT_QUOTE_HREF, text: "Request an aircraft quote" } ],
};
export const SERVICE_EXPECTATIONS = entries;
export function serviceExpectationsHtml(path: string) {
  const value = entries[path]; if (!value) return "";
  const esc = escapeFaqHtml;
  return `<section data-service-expectations><h2>What to expect</h2><p>${esc(value.summary)}</p><h3>Prepare for your appointment</h3><p>${esc(value.preparation)}</p><ul>${value.links.map(l => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul></section>`;
}