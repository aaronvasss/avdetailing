/**
 * Service landing pages for Baton Rouge SEO.
 * Each entry powers one route via <ServiceLandingTemplate />.
 *
 * Intro paragraphs use {{l1}} and {{l2}} tokens which the template replaces
 * with anchor tags for the national + local authority links.
 */

export interface ExtLink {
  text: string;
  url: string;
}

export interface ServiceLandingConfig {
  slug: string;
  title: string;          // H1 + base page title (template appends " | AV Detailing")
  metaDescription: string;
  intro: string;          // 120–150 words, contains {{l1}} and {{l2}}
  link1: ExtLink;         // national authority
  link2: ExtLink;         // local Louisiana authority
  steps: string[];        // 4–5 numbered process steps
  whyChoose: string[];    // 4 bullets
  serviceType: string;    // schema.org Service serviceType
}

const SERVICE_AREAS_PARAGRAPH =
  "AV Detailing serves all of Greater Baton Rouge and surrounding communities including Highland Road, Shenandoah, Gonzales, Prairieville, Central Baton Rouge, Walker, Denham Springs, Zachary, Old Jefferson, and Highland Lakes. Our mobile detailing team comes directly to your home, office, or storage location anywhere in our service area — no drop-off required.";

export const SERVICE_AREAS_TEXT = SERVICE_AREAS_PARAGRAPH;

export const SERVICE_LANDING_PAGES: ServiceLandingConfig[] = [
  // ===================== CAR (9) =====================
  {
    slug: "mobile-car-detailing-baton-rouge",
    title: "Mobile Car Detailing in Baton Rouge, LA",
    metaDescription:
      "Mobile car detailing in Baton Rouge — we come to your home or office with System X products and a fully equipped mobile rig. Serving Highland Road, Shenandoah, Gonzales & more.",
    intro:
      "Driving across Baton Rouge for a detail appointment means I-10 traffic, Highland Road congestion, and a half day lost waiting at a shop. AV Detailing eliminates that entirely — our mobile car detailing service brings the same professional equipment, System X products, and trained technicians directly to your home, office, or jobsite anywhere in Greater Baton Rouge. We service every neighborhood from Shenandoah and Central to Gonzales and Prairieville with a fully self-contained mobile rig — power, water, and pro-grade tools on board. Louisiana's UV, humidity, and road grime make professional detailing essential, not optional, for keeping paint and interior in good condition. According to {{l1}}, regular professional care preserves long-term vehicle value, and {{l2}} encourages residents to maintain their vehicles for safer roads.",
    link1: { text: "Consumer Reports", url: "https://www.consumerreports.org/cars/car-care/" },
    link2: { text: "the City of Baton Rouge", url: "https://www.brla.gov/" },
    steps: [
      "Schedule online or by phone — pick a date, time, and package.",
      "Our technician arrives at your location with a fully self-contained mobile rig.",
      "Exterior decontamination, interior deep clean, and optional System X protection performed on-site.",
      "Final inspection and walkaround with you before we leave.",
      "Same-day completion at your home, office, or jobsite — no drop-off required.",
    ],
    whyChoose: [
      "System X professional products used on-site at every appointment.",
      "Fully self-contained mobile rig — own water, power, and pro tools.",
      "Serves Highland Road, Shenandoah, Gonzales, Prairieville and all of Greater Baton Rouge.",
      "Save hours by skipping shop drop-off — we work around your schedule.",
    ],
    serviceType: "Mobile Car Detailing",
  },
  {
    slug: "ceramic-coating-baton-rouge",
    title: "Ceramic Coating in Baton Rouge, LA",
    metaDescription:
      "System X ceramic coating in Baton Rouge — 3-year, 5-year, and 10-year tiers. Permanent hydrophobic protection against Louisiana UV, humidity, and water spots.",
    intro:
      "Louisiana's UV index regularly tops 10 in summer — intense enough to break down standard wax and synthetic sealants in weeks. Ceramic coating is a semi-permanent hydrophobic protective layer that bonds chemically to your vehicle's clear coat, and AV Detailing exclusively uses System X, one of the most respected ceramic coating brands in the industry. We offer three tiers in Baton Rouge: 3-year, 5-year (our most popular), and 10-year. Black and dark-colored vehicles see the biggest visual improvement and the largest protection benefit in Louisiana's sun. According to {{l1}}, paint protection is one of the most cost-effective ways to preserve a vehicle's resale value, and {{l2}} highlights how UV and pollutant exposure accelerate finish degradation across South Louisiana. Coatings outlast traditional wax by years and dramatically reduce wash time.",
    link1: { text: "Consumer Reports", url: "https://www.consumerreports.org/cars/car-care/" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Free consultation — pick the 3-year, 5-year, or 10-year System X tier.",
      "Multi-stage paint correction to remove swirls and defects (mandatory prep).",
      "Surface prep with IPA wipedown to remove all oils and polish residue.",
      "System X ceramic coating applied in a controlled, contamination-free environment.",
      "24-hour cure period followed by a final walkaround inspection.",
    ],
    whyChoose: [
      "Exclusively System X — industry-leading ceramic coating brand.",
      "Three tiers offered: 3-year, 5-year (most popular), and 10-year.",
      "Paint correction prep included to avoid locking in swirls under the coating.",
      "Hydrophobic protection engineered for Louisiana UV, humidity, and rain.",
    ],
    serviceType: "Ceramic Coating",
  },
  {
    slug: "paint-correction-baton-rouge",
    title: "Paint Correction in Baton Rouge, LA",
    metaDescription:
      "Multi-stage paint correction in Baton Rouge — remove swirls, water spots, and oxidation. Required prep before System X ceramic coating. 1-step, 2-step, and 3-step pricing.",
    intro:
      "Every car driven on Baton Rouge roads accumulates swirl marks, water spots, light scratches, and oxidation — and Louisiana's relentless UV makes the damage faster and more visible than in northern climates. Paint correction is a precise multi-stage machine polishing process that physically removes those defects from your clear coat, restoring a deep, glassy, mirror-like finish. It is also the mandatory prep step before any ceramic coating — applying a coating over swirls locks them in forever. AV Detailing performs 1-step, 2-step, and 3-step corrections depending on paint condition, using professional dual-action and rotary polishers with quality compounds and polishes. According to {{l1}}, well-maintained paint contributes to overall vehicle condition and safety, and {{l2}} notes how Louisiana's environmental conditions accelerate surface wear on parked vehicles.",
    link1: { text: "NHTSA", url: "https://www.nhtsa.gov/vehicle-safety" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Inspection under direct light to grade swirls, scratches, and oxidation.",
      "Decontamination wash plus clay-bar treatment to remove embedded contaminants.",
      "Test panel to dial in the correct compound, pad, and machine combination.",
      "Machine polishing stages — compound, polish, and finishing pass.",
      "IPA wipedown and protection step (sealant or System X ceramic coating).",
    ],
    whyChoose: [
      "1-step, 2-step, and 3-step correction pricing — matched to your paint condition.",
      "Required prep step before any System X ceramic coating installation.",
      "Professional dual-action and rotary tooling with premium compounds.",
      "Performed mobile across Baton Rouge — at your home, office, or shop.",
    ],
    serviceType: "Paint Correction",
  },
  {
    slug: "interior-detailing-baton-rouge",
    title: "Interior Car Detailing in Baton Rouge, LA",
    metaDescription:
      "Mobile interior car detailing in Baton Rouge — deep vacuum, leather conditioning, fabric shampoo, and odor neutralization. Built for Louisiana heat and humidity.",
    intro:
      "Baton Rouge summers regularly push interior cabin temperatures past 140°F — that heat plus Louisiana humidity turns car interiors into a textbook environment for bacteria, mold, and mildew growth, and accelerates leather cracking and dashboard fade. AV Detailing's interior service is a full top-to-bottom reset: deep vacuum of every crevice, hand-cleaning of dash and console, door panels, A/B/C pillars, headliner spot treatment, leather cleaning and conditioning, fabric seat shampooing, carpet extraction, glass, and odor neutralization. We come to your driveway or office and treat the cabin on-site. According to {{l1}}, indoor air quality directly impacts respiratory health, and your vehicle is one of the most-used indoor spaces in your day. {{l2}} also encourages residents to maintain clean, healthy living and travel environments.",
    link1: { text: "the EPA's indoor air quality guidance", url: "https://www.epa.gov/indoor-air-quality-iaq" },
    link2: { text: "the City of Baton Rouge", url: "https://www.brla.gov/" },
    steps: [
      "Trash removal and full cabin vacuum including under seats and trunk.",
      "Brush and steam clean fabric, carpet, and headliner spot areas.",
      "Leather cleaning and conditioning to prevent Louisiana heat cracking.",
      "Hard surface wipe-down with UV protectant on dash and trim.",
      "Glass cleaning and final odor neutralization throughout the cabin.",
    ],
    whyChoose: [
      "Mobile service at your home or office location in Baton Rouge.",
      "Leather conditioning specifically suited to Louisiana heat exposure.",
      "Fabric seat shampooing and carpet extraction included.",
      "Ozone odor treatment available as an add-on for tougher smells.",
    ],
    serviceType: "Interior Car Detailing",
  },
  {
    slug: "exterior-detailing-baton-rouge",
    title: "Exterior Car Detailing in Baton Rouge, LA",
    metaDescription:
      "Mobile exterior car detailing in Baton Rouge — two-bucket hand wash, clay-bar decontamination, and full surface protection. Built for I-10, I-12, and Highland Road grime.",
    intro:
      "Highland Road, I-10, I-12, and Baton Rouge's industrial corridor along the river coat every vehicle with tar, brake dust, road film, industrial fallout, tree sap, and love-bug residue that a regular drive-through wash never fully removes. AV Detailing's exterior detail is a true decontamination service — foam pre-soak, hand wash with the two-bucket method, clay-bar decontamination to pull embedded contaminants from the clear coat, iron remover treatment, wheel and tire deep clean, glass, and a finishing sealant or wax. Our mobile rig handles it at your home, office, or jobsite. According to {{l1}}, runoff from urban driving surfaces deposits significant contamination, and {{l2}} actively monitors air and surface contaminants across South Louisiana that settle on parked vehicles.",
    link1: { text: "the EPA", url: "https://www.epa.gov/nps/nonpoint-source-urban-areas" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Pre-rinse and foam pre-soak to lift heavy contamination safely.",
      "Hand wash using the two-bucket method to protect the clear coat.",
      "Clay-bar decontamination plus iron-remover treatment.",
      "Wheel, tire, trim, and glass deep clean.",
      "Sealant or wax finish — System X ceramic coating available as an upgrade.",
    ],
    whyChoose: [
      "Two-bucket safe wash method — no swirl-inducing tunnel brushes.",
      "Clay-bar decontamination included in every exterior detail.",
      "Wheel, tire, and trim treatment for a complete look.",
      "Mobile across Highland Road, Shenandoah, Gonzales, and Prairieville.",
    ],
    serviceType: "Exterior Car Detailing",
  },
  {
    slug: "headlight-restoration-baton-rouge",
    title: "Headlight Restoration in Baton Rouge, LA",
    metaDescription:
      "Headlight restoration in Baton Rouge — sand, compound, polish, and UV-resistant seal. Restores nighttime visibility at a fraction of replacement cost.",
    intro:
      "Louisiana's UV index is one of the highest in the country, and it yellows and clouds polycarbonate headlight lenses faster than almost any other state. Foggy headlights can reduce nighttime light output by up to 80%, which directly impacts how far ahead you can see on dark Baton Rouge backroads and highways. Replacing a pair of OEM headlight assemblies often runs $400–$1,500 per side. AV Detailing's professional headlight restoration sands away the oxidized layer, compounds and polishes the lens back to optical clarity, and seals it with a UV-resistant coating that lasts. The result is full brightness restored at a fraction of replacement cost. According to {{l1}}, headlight performance is a recognized safety factor, and {{l2}} requires functional, unobstructed headlights for Louisiana vehicle inspections.",
    link1: { text: "NHTSA", url: "https://www.nhtsa.gov/vehicle-safety/headlights" },
    link2: { text: "the Louisiana Office of Motor Vehicles", url: "https://www.expresslane.org/" },
    steps: [
      "Tape off surrounding paint and trim to protect the finish.",
      "Wet-sand each lens through progressively finer grits.",
      "Machine compound and polish back to optical clarity.",
      "IPA wipedown to remove residue and prep the surface.",
      "UV-resistant sealant coating to lock in long-term clarity.",
    ],
    whyChoose: [
      "Far cheaper than full OEM headlight assembly replacement.",
      "Restores nighttime safety and visibility on dark Baton Rouge roads.",
      "UV-resistant sealant chosen specifically for Louisiana sun exposure.",
      "Available standalone or added to any exterior or full detail package.",
    ],
    serviceType: "Headlight Restoration",
  },
  {
    slug: "odor-removal-baton-rouge",
    title: "Car Odor Removal in Baton Rouge, LA",
    metaDescription:
      "Permanent car odor removal in Baton Rouge — ozone and enzyme treatment for smoke, pet, mildew, and food odors. Mobile service across Greater Baton Rouge.",
    intro:
      "Louisiana's year-round humidity makes smoke, pet, mildew, and food odors significantly worse over time because moisture allows odor compounds to absorb deeper into carpet padding, foam, and headliner fabric. Simple shampooing only masks the smell — within days the odor returns. AV Detailing combines deep extraction, enzyme treatments that break down organic odor molecules at the source, and professional ozone generator treatments that oxidize odors throughout the entire cabin including ventilation ducts. The result is true permanent elimination, not perfume coverup. We perform odor removal on-site at your home or office in the Baton Rouge area. According to {{l1}}, volatile organic compounds inside vehicles affect indoor air quality and health, and {{l2}} promotes healthy living environments throughout the city.",
    link1: { text: "the EPA's guidance on VOCs", url: "https://www.epa.gov/indoor-air-quality-iaq/volatile-organic-compounds-impact-indoor-air-quality" },
    link2: { text: "the City of Baton Rouge", url: "https://www.brla.gov/" },
    steps: [
      "Source identification and physical removal of contaminated material.",
      "Deep extraction of fabric, carpet, and underlying padding.",
      "Enzyme treatment of affected surfaces to break down odor molecules.",
      "Ozone generator cycle in the sealed cabin to oxidize residual odors.",
      "Final airing, ventilation system flush, and verification before handoff.",
    ],
    whyChoose: [
      "Permanent elimination — not perfume masking or temporary coverup.",
      "Combined ozone plus enzyme treatment for full source neutralization.",
      "Handles smoke, pet, mildew, and food odors in one appointment.",
      "Mobile service performed at your driveway or office in Baton Rouge.",
    ],
    serviceType: "Car Odor Removal",
  },
  {
    slug: "pet-hair-removal-baton-rouge",
    title: "Pet Hair Removal in Baton Rouge, LA",
    metaDescription:
      "Professional pet hair removal in Baton Rouge — specialized extraction tools and HEPA vacuum for carpet, upholstery, and crevices. Mobile across Greater Baton Rouge.",
    intro:
      "Pet hair embeds deep into carpet fibers and seat upholstery and resists ordinary vacuuming — and the static-heavy environment of a hot Louisiana vehicle interior makes the problem dramatically worse. Standard vacuums skim the top layer; the embedded hair stays put. AV Detailing uses specialized rubber extraction tools, dedicated pet-hair brushes, and powerful HEPA vacuums to physically lift hair out of every interior surface — seats, carpet, headliner, trunk, cargo areas, and tight crevices around seat tracks. We also follow with a full interior wipe-down and air-quality reset to clear allergens. Pet hair isn't just a cosmetic issue. According to {{l1}}, pet dander is a leading indoor allergen, and {{l2}} encourages residents to maintain healthy indoor environments for themselves and their families.",
    link1: { text: "the American Lung Association", url: "https://www.lung.org/clean-air/indoor-air" },
    link2: { text: "the City of Baton Rouge", url: "https://www.brla.gov/" },
    steps: [
      "Initial high-power vacuum pass across the entire interior.",
      "Rubber-tool and dedicated pet-hair brush extraction on upholstery.",
      "Tight-crevice tool work around seat tracks, console seams, and floor edges.",
      "Final HEPA vacuum pass to capture loosened hair and fine dander.",
      "Allergen-reducing interior wipe-down and ventilation reset.",
    ],
    whyChoose: [
      "Specialized pet-hair extraction tooling — not a standard vacuum.",
      "HEPA vacuum captures fine dander and allergens.",
      "Reduces in-cabin allergens for sensitive passengers.",
      "Mobile service at your home or office anywhere in Baton Rouge.",
    ],
    serviceType: "Pet Hair Removal",
  },
  {
    slug: "engine-bay-cleaning-baton-rouge",
    title: "Engine Bay Cleaning in Baton Rouge, LA",
    metaDescription:
      "Professional engine bay cleaning in Baton Rouge — controlled steam and degreaser process safe for modern electronics. Mobile service across Greater Baton Rouge.",
    intro:
      "Louisiana heat dramatically accelerates grease and oil buildup on engine bay components, making fluid leaks harder to detect and routine maintenance messier and slower. A clean engine bay also makes a strong impression at resale — buyers consistently associate a clean bay with a well-maintained vehicle. AV Detailing's engine bay service uses controlled low-pressure steam, professional degreasers safe for modern engine components, and careful protection of electronics, ECUs, alternators, and air-intake openings. We finish with a UV-safe trim and rubber dressing to leave plastics and hoses looking new. The process is safe for daily drivers, classics, and modern direct-injection engines. According to {{l1}}, vehicle maintenance is a recognized safety factor, and {{l2}} oversees Louisiana's motor vehicle inspection and maintenance program.",
    link1: { text: "NHTSA", url: "https://www.nhtsa.gov/vehicle-safety" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/page/motor-vehicle-inspection-and-maintenance" },
    steps: [
      "Cover sensitive electronics, ECUs, alternators, and intake openings.",
      "Apply professional degreaser to grease and grime buildup.",
      "Agitate with dedicated detail brushes to lift contamination.",
      "Controlled low-pressure rinse or steam cleaning pass.",
      "Dry thoroughly and dress plastics, hoses, and rubber components.",
    ],
    whyChoose: [
      "Safe for modern electronics and direct-injection engines.",
      "Makes fluid leaks dramatically easier to spot during maintenance.",
      "Improves resale presentation and buyer confidence.",
      "Available as an add-on to any detail package at your location.",
    ],
    serviceType: "Engine Bay Cleaning",
  },

  // ===================== RV (5) =====================
  {
    slug: "mobile-rv-detailing-baton-rouge",
    title: "Mobile RV Detailing in Baton Rouge, LA",
    metaDescription:
      "Mobile RV detailing in Baton Rouge — Class A, B, C, fifth wheels, and travel trailers serviced on-site. No hauling required. Denham Springs, Walker, Gonzales & more.",
    intro:
      "Hauling a 30-foot Class A motorhome or 40-foot fifth wheel across Baton Rouge to a detail shop isn't practical — and most shops don't have the space anyway. AV Detailing brings the entire detailing operation directly to your RV, whether it's parked at your home, an off-site storage lot in Denham Springs, Walker, or Gonzales, or a campground in the Greater Baton Rouge area. We service every class: Class A diesel pushers, Class B vans, Class C motorhomes, fifth wheels, travel trailers, toy haulers, and pop-ups. Louisiana's UV, humidity, and rainfall punish RV finishes year-round and require regular professional care. According to {{l1}}, professional cleaning preserves an RV's structural integrity and resale value, and {{l2}} regulates the surface-wash and runoff standards we follow.",
    link1: { text: "the RV Industry Association", url: "https://www.rvia.org/" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "On-site assessment at your RV's parked location.",
      "Roof and sidewall safe wash with RV-specific cleaners.",
      "Black-streak removal and full surface decontamination.",
      "Oxidation removal and machine polishing as needed.",
      "Interior service and a complete walkaround before signoff.",
    ],
    whyChoose: [
      "Every RV class serviced on-site — Class A/B/C, fifth wheels, trailers.",
      "No hauling required — we come to your driveway or storage lot.",
      "System X ceramic coating available for long-term protection.",
      "Mobile across Baton Rouge, Denham Springs, Walker, and Gonzales.",
    ],
    serviceType: "Mobile RV Detailing",
  },
  {
    slug: "rv-oxidation-removal-baton-rouge",
    title: "RV Oxidation Removal in Baton Rouge, LA",
    metaDescription:
      "RV oxidation removal in Baton Rouge — multi-stage compounding and machine polishing to restore chalky, faded fiberglass sidewalls. Mobile service across Louisiana.",
    intro:
      "Chalky, dull, faded fiberglass sidewalls are the most visible sign of UV damage on an RV — and Louisiana's UV exposure does it faster than almost any other state in the country. Left untreated, oxidation eats into the gelcoat permanently and can knock thousands off resale value. AV Detailing's RV oxidation removal is a true multi-stage restoration: heavy compounding to cut through the oxidized layer, machine polishing to restore gloss, and a protective sealant or System X ceramic coating to prevent it from coming back. The transformation between before and after on a heavily oxidized rig is dramatic. According to {{l1}}, surface restoration directly protects long-term RV value, and {{l2}} encourages responsible cleaning practices for runoff and surface contaminants across South Louisiana.",
    link1: { text: "the RV Industry Association", url: "https://www.rvia.org/" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Full wash and surface decontamination of sidewalls.",
      "Test panel to grade the depth of oxidation.",
      "Heavy compound stage with rotary polisher to cut oxidation.",
      "Polish stage to restore gloss and color depth.",
      "Sealant or System X ceramic coating for long-term protection.",
    ],
    whyChoose: [
      "Multi-stage cut and polish process — not a one-pass shortcut.",
      "Dramatic before/after results on heavily oxidized fiberglass.",
      "Optional System X ceramic coating to prevent recurrence.",
      "Mobile service performed at your RV across the Baton Rouge area.",
    ],
    serviceType: "RV Oxidation Removal",
  },
  {
    slug: "rv-interior-detailing-baton-rouge",
    title: "RV Interior Detailing in Baton Rouge, LA",
    metaDescription:
      "RV interior detailing in Baton Rouge — full living space cleaning including kitchen, bathroom, bedroom, carpet shampoo, and humidity-driven odor treatment.",
    intro:
      "An RV interior is essentially a small home that travels with you, which means it picks up cooking smells, pet odors, dust, humidity-driven mildew, and bathroom and kitchen grime — and Louisiana's humidity makes every one of those problems worse. AV Detailing's RV interior service is a full living-space reset covering the kitchen, bathroom, bedroom, dinette, captain's chairs, slide-out tracks, and every cabinet face. We deep-vacuum carpet and upholstery, shampoo seating and rugs, sanitize hard surfaces, wipe headliner and walls, treat odors at the source, and clean every interior window. According to {{l1}}, surface and air-quality maintenance protects long-term RV livability, and {{l2}} encourages clean, healthy living environments throughout the city.",
    link1: { text: "the RV Industry Association", url: "https://www.rvia.org/" },
    link2: { text: "the City of Baton Rouge", url: "https://www.brla.gov/" },
    steps: [
      "Full interior vacuum of carpet, upholstery, and slide-out tracks.",
      "Kitchen and bathroom sanitization with appropriate cleaners.",
      "Carpet and upholstery shampoo plus extraction.",
      "Hard surface wipe-down and interior window cleaning.",
      "Odor treatment at the source — ozone available as an add-on.",
    ],
    whyChoose: [
      "Full living-space service — kitchen, bath, bedroom, and dinette.",
      "Kitchen and bathroom sanitization included as standard.",
      "Mildew and humidity odor treatment for Louisiana conditions.",
      "Performed at your RV wherever it's parked in the Baton Rouge area.",
    ],
    serviceType: "RV Interior Detailing",
  },
  {
    slug: "rv-ceramic-coating-baton-rouge",
    title: "RV Ceramic Coating in Baton Rouge, LA",
    metaDescription:
      "System X RV ceramic coating in Baton Rouge — hydrophobic protection against Louisiana UV, oxidation, black streaks, and water spots. Mobile service across the region.",
    intro:
      "An RV represents a significant investment — often comparable to a second home — and Louisiana's climate is one of the harshest in the country for protecting that investment. UV oxidizes gelcoat, humidity drives black streaks, and rainfall leaves hard-water spots on sidewalls and roof. AV Detailing applies System X ceramic coating designed for large fiberglass and gelcoat surfaces. The coating creates a hard hydrophobic layer that defends against UV, oxidation, black streaks, water spots, bird droppings, and road grime, and dramatically reduces cleaning time after every trip. Prep is critical: we perform full oxidation removal and polish before coating, because skipping that step locks defects in permanently. According to {{l1}}, regular surface protection is essential to RV longevity, and {{l2}} promotes responsible surface care across Louisiana.",
    link1: { text: "the RV Industry Association", url: "https://www.rvia.org/" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Full wash plus iron decontamination of sidewalls and roof edges.",
      "Oxidation removal and machine polish to restore the surface.",
      "IPA wipedown to strip all oils and polish residue.",
      "System X ceramic coating application across all fiberglass surfaces.",
      "24-hour cure period followed by a walkaround inspection.",
    ],
    whyChoose: [
      "Exclusively System X — formulated for large gelcoat surfaces.",
      "Full prep and polish included — no shortcuts that lock in defects.",
      "Hydrophobic protection engineered for Louisiana UV and humidity.",
      "Performed mobile at your RV anywhere across Greater Baton Rouge.",
    ],
    serviceType: "RV Ceramic Coating",
  },
  {
    slug: "rv-roof-cleaning-baton-rouge",
    title: "RV Roof Cleaning in Baton Rouge, LA",
    metaDescription:
      "RV roof cleaning in Baton Rouge — EPDM, TPO, fiberglass, and aluminum roof types. Removes mold, algae, and black streaks driven by Louisiana humidity.",
    intro:
      "RV roofs are the most ignored surface on the entire vehicle — until they leak. Louisiana's rainfall and humidity build mold, algae, and black-streak runoff on EPDM, TPO, fiberglass, and aluminum roofs faster than most regions, and that organic growth can degrade roof membranes and cause real structural damage. AV Detailing's RV roof cleaning uses roof-type-specific safe cleaners, soft brushes, and a methodical wash process that protects seams, vents, AC units, antennas, and skylights. We also visually inspect sealants and call out anything that should be re-caulked before the next rainy season. According to {{l1}}, roof maintenance is critical to RV structural integrity, and {{l2}} encourages proper handling of surface cleaning runoff.",
    link1: { text: "the RV Industry Association", url: "https://www.rvia.org/" },
    link2: { text: "the Louisiana DEQ", url: "https://www.deq.louisiana.gov/" },
    steps: [
      "Identify roof type — EPDM, TPO, fiberglass, or aluminum.",
      "Soft-wash with the appropriate roof-safe cleaner.",
      "Targeted mold, algae, and black-streak treatment.",
      "Seam, vent, and sealant visual inspection with photo notes.",
      "Final rinse and dry without flooding vents or seams.",
    ],
    whyChoose: [
      "EPDM, TPO, fiberglass, and aluminum roof types all serviced.",
      "Roof-safe products only — no membrane damage.",
      "Sealant inspection included with every cleaning.",
      "Mobile service at your storage lot or driveway.",
    ],
    serviceType: "RV Roof Cleaning",
  },

  // ===================== BOAT (5) =====================
  {
    slug: "mobile-boat-detailing-baton-rouge",
    title: "Mobile Boat Detailing in Baton Rouge, LA",
    metaDescription:
      "Mobile boat detailing in Baton Rouge — we come to your marina, launch, storage lot, or driveway. Fishing boats, bass boats, pontoons, cruisers, and yachts.",
    intro:
      "Louisiana has more boats per capita than nearly any other state, and Baton Rouge area waterways — the Mississippi River, False River, Blind River, Lake Pontchartrain access, and surrounding lakes — mean serious UV, algae, and water-line exposure for every vessel. AV Detailing brings full mobile boat detailing directly to your marina slip, storage lot, launch, or home driveway anywhere in the Greater Baton Rouge area, with no trailering required. We service fishing boats, bass boats, ski boats, pontoons, center consoles, cruisers, and yachts. Our mobile rig carries water, power, and pro-grade marine products on board. According to {{l1}}, regular vessel maintenance is a recognized boating safety practice, and {{l2}} encourages all Louisiana boat owners to keep vessels in safe, well-maintained condition.",
    link1: { text: "the US Coast Guard", url: "https://www.uscgboating.org/" },
    link2: { text: "Louisiana Wildlife & Fisheries", url: "https://www.wlf.louisiana.gov/page/boating-safety" },
    steps: [
      "On-site arrival at your marina, launch, storage lot, or driveway.",
      "Full hull and topside wash with marine-safe products.",
      "Waterline and hard-water deposit removal.",
      "Interior, vinyl, deck, and bimini service.",
      "Optional gelcoat polish or System X marine coating finish.",
    ],
    whyChoose: [
      "No trailering required — we come to the boat.",
      "Fishing boats, pontoons, cruisers, and yachts all serviced.",
      "Fully equipped mobile rig with marine-grade products.",
      "Services every marina and launch across the Baton Rouge area.",
    ],
    serviceType: "Mobile Boat Detailing",
  },
  {
    slug: "boat-ceramic-coating-baton-rouge",
    title: "Boat Ceramic Coating in Baton Rouge, LA",
    metaDescription:
      "System X marine ceramic coating in Baton Rouge — hydrophobic protection against UV, algae, and water staining on Louisiana waterways. Mobile at your marina.",
    intro:
      "Louisiana waterways subject your boat to a brutal combination of UV exposure, algae, hard-water staining, salt incursion in coastal runs, and constant moisture — and traditional wax simply doesn't hold up. AV Detailing applies System X marine ceramic coating, formulated specifically for gelcoat and marine paint, to create a hard hydrophobic protective layer that resists UV damage, oxidation, water staining, and algae adhesion. The result is dramatically easier cleaning after every outing — a quick rinse removes most contamination instead of a full scrub. We perform full prep including oxidation removal and polish before coating, since coating over defects locks them in permanently. According to {{l1}}, vessel surface maintenance directly impacts long-term value, and {{l2}} encourages all Louisiana boaters to keep their vessels in protected condition.",
    link1: { text: "the US Coast Guard", url: "https://www.uscgboating.org/" },
    link2: { text: "Louisiana Wildlife & Fisheries", url: "https://www.wlf.louisiana.gov/page/boating-safety" },
    steps: [
      "Full wash plus iron and salt decontamination.",
      "Oxidation removal and machine polish on gelcoat.",
      "IPA wipedown to remove all oils and polish residue.",
      "System X marine ceramic coating application.",
      "Controlled cure period and final verification walkaround.",
    ],
    whyChoose: [
      "Exclusively System X marine-grade ceramic coating.",
      "Full prep included — coating over defects is never an option.",
      "Hydrophobic protection built for Louisiana waterway conditions.",
      "Performed mobile at your marina, slip, or storage location.",
    ],
    serviceType: "Boat Ceramic Coating",
  },
  {
    slug: "gelcoat-restoration-baton-rouge",
    title: "Gelcoat Restoration in Baton Rouge, LA",
    metaDescription:
      "Gelcoat restoration in Baton Rouge — multi-stage compounding and machine polishing to reverse Louisiana UV oxidation on aged boats. Mobile at your marina or storage.",
    intro:
      "Oxidized, chalky, faded gelcoat is the most common cosmetic problem on Louisiana boats over five years old — the state's UV index and humidity work fast on exposed marine surfaces. Once oxidation reaches the gelcoat layer, only proper compounding and machine polishing will reverse it; standard waxing won't touch heavy oxidation. AV Detailing's gelcoat restoration is a multi-stage process: heavy compounding to remove the oxidized layer, machine polishing to restore gloss and color depth, and a sealant or System X coating to lock in protection. The visual transformation on a chalky 10-year-old hull is often dramatic. According to {{l1}}, regular hull and surface maintenance preserves vessel safety and value, and {{l2}} encourages Louisiana boaters to keep their vessels in well-maintained condition.",
    link1: { text: "the US Coast Guard", url: "https://www.uscgboating.org/" },
    link2: { text: "Louisiana Wildlife & Fisheries", url: "https://www.wlf.louisiana.gov/page/boating-safety" },
    steps: [
      "Full wash and surface decontamination.",
      "Test panel to grade the oxidation stage.",
      "Heavy compound stage with rotary polisher.",
      "Machine polish stage to restore gloss and depth.",
      "Sealant or System X marine ceramic coating finish.",
    ],
    whyChoose: [
      "Multi-stage cut and polish — true restoration, not a quick wax.",
      "Dramatic before/after results on aged Louisiana hulls.",
      "Optional System X marine coating for long-term protection.",
      "Mobile at your boat's location across the Baton Rouge area.",
    ],
    serviceType: "Gelcoat Restoration",
  },
  {
    slug: "hull-cleaning-baton-rouge",
    title: "Boat Hull Cleaning in Baton Rouge, LA",
    metaDescription:
      "Boat hull cleaning in Baton Rouge — waterline scum, algae, and hard-water deposit removal on fiberglass, aluminum, and painted hulls. Mobile at your marina or storage.",
    intro:
      "Every outing on Baton Rouge area rivers and lakes leaves your hull coated in waterline scum, algae, hard-water mineral deposits, and oxidation that standard hosing and rinsing cannot remove. Left in place, those deposits stain permanently and degrade hull surface integrity. AV Detailing's hull cleaning service uses marine-safe cleaners, dedicated hull cleaner for hard-water stains, and methodical scrubbing tailored to your hull type — fiberglass, aluminum, or painted. We address the waterline, transom, hull sides, and below-rail surfaces. The result is a hull that looks new and a vessel that performs better in the water. According to {{l1}}, regular hull maintenance affects both safety and performance, and {{l2}} encourages Louisiana boaters to maintain their vessels in safe, well-kept condition.",
    link1: { text: "the US Coast Guard", url: "https://www.uscgboating.org/" },
    link2: { text: "Louisiana Wildlife & Fisheries", url: "https://www.wlf.louisiana.gov/page/boating-safety" },
    steps: [
      "Pre-rinse and soak to lift loose contamination.",
      "Marine-safe hull cleaner application across the affected zones.",
      "Targeted waterline and hard-water deposit removal.",
      "Hand and machine agitation tailored to hull type.",
      "Final rinse and walkaround inspection.",
    ],
    whyChoose: [
      "Fiberglass, aluminum, and painted hulls all serviced.",
      "Hard-water and mineral deposit removal — not just a wash.",
      "Marine-safe products that won't damage gelcoat or paint.",
      "Mobile service at your marina, slip, or storage location.",
    ],
    serviceType: "Boat Hull Cleaning",
  },
  {
    slug: "pontoon-cleaning-baton-rouge",
    title: "Pontoon Cleaning in Baton Rouge, LA",
    metaDescription:
      "Pontoon cleaning in Baton Rouge — aluminum log polishing, vinyl seat restoration, and bimini top cleaning. Mobile on False River and Baton Rouge area lakes.",
    intro:
      "Pontoon logs collect heavy oxidation, water staining, and algae buildup that hosing and standard cleaning never remove — especially on Louisiana lakes like False River and the surrounding Baton Rouge area waterways. AV Detailing specializes in full pontoon detailing: aluminum log polishing with marine-grade acid cleaner where appropriate, deck cleaning, vinyl seat restoration and conditioning, bimini top cleaning, and full interior wipe-down. The aluminum log work in particular makes a dramatic visual difference and brings back the original shine. We service pontoons at your slip, lift, storage lot, or driveway. According to {{l1}}, vessel maintenance is a recognized safety practice, and {{l2}} encourages all Louisiana pontoon owners to maintain vessels properly for safe enjoyment of Louisiana's lakes and rivers.",
    link1: { text: "the US Coast Guard", url: "https://www.uscgboating.org/" },
    link2: { text: "Louisiana Wildlife & Fisheries", url: "https://www.wlf.louisiana.gov/page/boating-safety" },
    steps: [
      "Pre-rinse and initial wash of the entire pontoon.",
      "Aluminum log cleaning and polishing pass.",
      "Deck scrub and vinyl seat shampoo with conditioning.",
      "Bimini top and canvas cleaning.",
      "Final rinse and walkaround inspection.",
    ],
    whyChoose: [
      "Aluminum log polishing specialty — restores original shine.",
      "Vinyl seat restoration and UV conditioning included.",
      "Bimini top and canvas cleaning available.",
      "Mobile at your lift, slip, or storage location.",
    ],
    serviceType: "Pontoon Cleaning",
  },

  // ===================== AIRCRAFT (3) =====================
  {
    slug: "aircraft-cleaning-baton-rouge",
    title: "Aircraft Exterior Cleaning in Baton Rouge, LA",
    metaDescription:
      "Aircraft exterior cleaning in Baton Rouge — aviation-safe products only. Service at BTR, LFT, MSY, NEW, and South Louisiana general aviation airports.",
    intro:
      "Aircraft exterior cleaning is dramatically different from car detailing — wrong products or wrong technique can damage painted aluminum, composite panels, or aircraft plexiglass, and South Louisiana's coastal humidity and salt air make corrosion a real ongoing threat. AV Detailing uses only aviation-approved cleaning solutions and procedures, and our technicians are trained in safe aircraft handling around control surfaces, antennas, static wicks, and pitot probes. We remove exhaust residue, bug deposits, bird droppings, salt, and environmental fallout that over time accelerate corrosion and damage your aircraft's finish. We service aircraft at BTR, LFT, MSY, NEW, and surrounding general aviation fields. According to {{l1}}, regular aircraft cleaning and surface maintenance is a recognized element of overall airworthiness, and {{l2}} hosts most of our Baton Rouge based clients.",
    link1: { text: "the FAA", url: "https://www.faa.gov/aircraft" },
    link2: { text: "Baton Rouge Metropolitan Airport", url: "https://www.flybtr.com/" },
    steps: [
      "Walkaround and aviation-approved product selection.",
      "Pre-rinse with aviation-safe cleaning solution.",
      "Hand wash of painted aluminum and composite panels.",
      "Plexiglass cleaning with plex-safe polish only.",
      "Final wipe, dry, and walkaround signoff.",
    ],
    whyChoose: [
      "Aviation-approved cleaning products only — never automotive chemicals.",
      "Technicians trained around control surfaces and probes.",
      "Service available at BTR, LFT, MSY, NEW, and GA fields.",
      "Mobile to your hangar or ramp — minimal aircraft handling.",
    ],
    serviceType: "Aircraft Exterior Cleaning",
  },
  {
    slug: "aircraft-interior-detailing-baton-rouge",
    title: "Aircraft Interior Detailing in Baton Rouge, LA",
    metaDescription:
      "Aircraft interior detailing in Baton Rouge — aviation-safe seat conditioning, carpet shampoo, panel care, and odor elimination at BTR, LFT, MSY, and NEW.",
    intro:
      "An aircraft cabin reflects your standards as a pilot, operator, or charter customer — and aviation interiors require very different products and techniques than car interiors. Aviation-grade leather and fabric, instrument shrouds, plexiglass, and door seals all need formulations that are safe for aircraft applications. AV Detailing's aircraft interior service covers seat cleaning and leather conditioning, carpet vacuuming and shampooing, instrument panel and shroud wipe-down, window and door-seal cleaning, headliner spot treatment, and full odor elimination — using only products formulated and approved for aircraft cabin use. South Louisiana's humidity makes interior odor and mildew control especially important. According to {{l1}}, regular cabin maintenance is a recognized element of aircraft care, and {{l2}} hosts most of our Baton Rouge based clients.",
    link1: { text: "the FAA", url: "https://www.faa.gov/aircraft" },
    link2: { text: "Baton Rouge Metropolitan Airport", url: "https://www.flybtr.com/" },
    steps: [
      "Cabin walkthrough and aviation-approved product selection.",
      "Seat and leather cleaning with aviation-grade conditioner.",
      "Carpet vacuum, shampoo, and extraction.",
      "Instrument panel and shroud wipe-down with safe wipes.",
      "Plexiglass cleaning plus odor neutralization throughout the cabin.",
    ],
    whyChoose: [
      "Aviation-safe interior products only — never automotive cleaners.",
      "Aviation-grade leather conditioning for cabin seating.",
      "Plexiglass-safe cleaning to protect window clarity.",
      "Service performed at BTR, LFT, MSY, and NEW hangars.",
    ],
    serviceType: "Aircraft Interior Detailing",
  },
  {
    slug: "aircraft-paint-protection-baton-rouge",
    title: "Aircraft Paint Protection in Baton Rouge, LA",
    metaDescription:
      "Aircraft paint protection in Baton Rouge — aviation sealants and protective coatings that slow corrosion and protect resale value. Service at BTR, LFT, MSY, NEW.",
    intro:
      "South Louisiana's UV, humidity, and coastal salt air degrade aircraft paint and aluminum surfaces noticeably faster than inland states or drier climates — and aircraft repaints are extremely expensive, so prevention matters. AV Detailing's aircraft paint protection service applies professional-grade aviation sealants and protective coatings designed for painted aluminum and composite surfaces. The result is a slick, hydrophobic protective layer that slows corrosion, repels environmental contamination, dramatically reduces cleaning time between services, and helps preserve your aircraft's long-term value at resale. All products are aviation-approved. We perform paint protection at hangar locations across BTR, LFT, MSY, and NEW. According to {{l1}}, surface care is a recognized component of aircraft maintenance, and {{l2}} hosts most of our Baton Rouge based fleet clients.",
    link1: { text: "the FAA", url: "https://www.faa.gov/aircraft" },
    link2: { text: "Baton Rouge Metropolitan Airport", url: "https://www.flybtr.com/" },
    steps: [
      "Walkaround and full surface assessment.",
      "Complete aviation-safe wash and rinse.",
      "Surface decontamination to remove salt and environmental fallout.",
      "Aviation sealant or protective coating application.",
      "Cure period followed by a verification walkaround.",
    ],
    whyChoose: [
      "Aviation-approved sealants and coatings only.",
      "Corrosion prevention focus for coastal Louisiana exposure.",
      "Helps protect long-term aircraft resale value.",
      "Performed at BTR, LFT, MSY, and NEW hangars.",
    ],
    serviceType: "Aircraft Paint Protection",
  },
];

export const SERVICE_LANDING_BY_SLUG: Record<string, ServiceLandingConfig> = Object.fromEntries(
  SERVICE_LANDING_PAGES.map((p) => [p.slug, p]),
);
