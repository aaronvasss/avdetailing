import { CERAMIC_SEO, CERAMIC_STEPS, CERAMIC_BUYING_GUIDANCE } from "../lib/ceramic-seo";
import { MOBILE_CAR_SEO, INTERIOR_CAR_SEO, PAINT_CORRECTION_SEO } from "../lib/car-seo";
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
  seoTitle?: string;
  processHeading?: string;
  scopeHeading?: string;
  relatedLinks?: { text: string; href: string }[];
  metaDescription: string;
  intro: string;          // 120–150 words, contains {{l1}} and {{l2}}
  link1: ExtLink;         // national authority
  link2: ExtLink;         // local Louisiana authority
  steps: string[];        // 4–5 numbered process steps
  whyChoose: string[];    // 4 bullets
  serviceType: string;    // schema.org Service serviceType
  /** Car supporting page: breadcrumbs to the car hub and car related links from car-seo. */
  carPage?: boolean;
  /** Boat supporting page: breadcrumbs to the boat hub and boat links from boat-seo. */
  boatPage?: boolean;
  /** Show boat packages with live prices. */
  showBoatPackages?: boolean;
  /** Show the interior-by-package comparison from car-seo. */
  showInteriorPackages?: boolean;
  /** Exterior RV supporting page: RV breadcrumbs, links and guidance from rv-seo. */
  rvPage?: boolean;
  /** Legacy page for a service that is not offered: noindex,follow, no Service schema, excluded from sitemap. */
  unavailable?: boolean;
}

const SERVICE_AREAS_PARAGRAPH =
  "AV Detailing serves all of Greater Baton Rouge and surrounding communities including Highland Road, Shenandoah, Gonzales, Prairieville, Central Baton Rouge, Walker, Denham Springs, Zachary, Old Jefferson, and Highland Lakes. Our mobile detailing team comes directly to your home, office, or storage location anywhere in our service area — no drop-off required.";

export const SERVICE_AREAS_TEXT = SERVICE_AREAS_PARAGRAPH;

export const SERVICE_LANDING_PAGES: ServiceLandingConfig[] = [
  // ===================== CAR (9) =====================
  {
    slug: MOBILE_CAR_SEO.slug,
    title: MOBILE_CAR_SEO.title,
    seoTitle: MOBILE_CAR_SEO.seoTitle,
    carPage: true,
    metaDescription: MOBILE_CAR_SEO.description,
    intro:
      "AV Detailing is a mobile service: we detail your car at your home, office or another location you choose in Baton Rouge, Prairieville, Gonzales, Denham Springs, Walker, Central, Zachary and nearby areas, so there is no shop drop-off. Appointments run between 6 AM and 8 PM, and we give you a 30-minute arrival window. You don't need to be present as long as the vehicle is accessible; we let you know when the service is complete.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How a Mobile Car Detailing Visit Works",
    steps: [
      "Book online or call — choose your vehicle, package, any add-ons and an available time.",
      "We confirm your appointment and the address where the vehicle will be parked.",
      "We arrive within your 30-minute arrival window.",
      "We complete the package you booked on-site.",
      "We let you know when the service is complete.",
    ],
    scopeHeading: "What to Have Ready",
    whyChoose: [
      "The exact address and where the vehicle will be parked.",
      "Access to the vehicle if you won't be there (keys or unlocked doors as arranged).",
      "Your vehicle year, make and model, and the package you want.",
      "Personal items removed from the cabin and trunk where possible.",
    ],
    serviceType: "Mobile Car Detailing",
  },
  {
    slug: "ceramic-coating-baton-rouge",
    title: CERAMIC_SEO.h1,
    seoTitle: CERAMIC_SEO.title,
    metaDescription: CERAMIC_SEO.description,
    intro: CERAMIC_SEO.intro,
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    steps: CERAMIC_STEPS,
    whyChoose: CERAMIC_BUYING_GUIDANCE,
    serviceType: "Ceramic Coating",
  },
  {
    slug: "paint-correction-baton-rouge",
    title: PAINT_CORRECTION_SEO.h1,
    seoTitle: PAINT_CORRECTION_SEO.title,
    carPage: true,
    metaDescription: PAINT_CORRECTION_SEO.description,
    intro: PAINT_CORRECTION_SEO.intro,
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    steps: [
      "Paint assessment under good light to identify swirls, water spots and scratches.",
      "Wash and decontamination.",
      "Test area to choose the right compound, pad and polish.",
      "Machine polishing in one, two or three stages.",
      "Wipe-down and protection step.",
    ],
    whyChoose: [
      "Options: 1-Step Polish, 2-Step Correction or 3-Step Restoration.",
      "Improvement depends on defect depth and available clear coat.",
      "Usual preparation before ceramic coating.",
      "Mobile service across Greater Baton Rouge.",
    ],
    serviceType: "Paint Correction",
  },
  {
    slug: INTERIOR_CAR_SEO.slug,
    title: INTERIOR_CAR_SEO.title,
    seoTitle: INTERIOR_CAR_SEO.seoTitle,
    carPage: true,
    showInteriorPackages: true,
    metaDescription: INTERIOR_CAR_SEO.description,
    intro:
      "If your car's cabin needs more than a quick clean, start by matching the work to the right package. Basic covers a light vacuum and wipe-down, Silver adds a deep vacuum of seats, carpets, mats and trunk plus console, door panel, dashboard and trim cleaning, and Gold adds seat and upholstery shampooing, leather cleaning and conditioning and a carpet deep clean. Seat shampoo is only included in Gold. We do the work at your home or office in Baton Rouge and nearby areas.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Choose Your Interior Service",
    steps: [
      "Light dust and crumbs: Basic covers a light vacuum and interior wipe-down.",
      "Daily-use cabins: Silver adds a deep vacuum and console, door panel, dashboard and trim cleaning.",
      "Stained seats or carpets: Gold adds seat and upholstery shampooing and a carpet deep clean.",
      "Leather seats: Gold includes leather cleaning and conditioning.",
    ],
    scopeHeading: "Tell Us About Your Interior",
    whyChoose: [
      "Seat material (cloth or leather) and any stains you want addressed.",
      "Pet hair, odors or spills — describe them so we can set expectations; results depend on the source and how long it has been there.",
      "Your vehicle year, make and model.",
      "Results vary with material and stain type; some stains may not fully come out.",
    ],
    serviceType: "Interior Car Detailing",
  },
  {
    slug: "exterior-detailing-baton-rouge",
    title: "Exterior Car Detailing in Baton Rouge: Wash & Package Choices",
    seoTitle: "Exterior Car Detailing in Baton Rouge | Exterior Only & Packages | AV Detailing",
    carPage: true,
    metaDescription:
      "Mobile exterior car detailing in Baton Rouge: compare the Exterior Only wash with full packages and optional clay bar, headlight and engine bay add-ons.",
    intro:
      "If you only need the outside of your car cleaned, the Exterior Only package covers a hand wash and dry, wheels and tires, tire shine and exterior windows at your home or office in Baton Rouge and nearby areas. Clay bar treatment is a separate add-on for paint that feels rough, and headlight restoration can be added for cloudy lenses. If you also want the inside done, compare the Basic, Silver and Gold packages on the car detailing page; Gold adds a paint sealant. For swirls and scratches, paint correction is assessed separately.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Choose Your Exterior Service",
    steps: [
      "Routine wash: Exterior Only — hand wash and dry, wheels and tires, tire shine and exterior windows.",
      "Rough or contaminated paint: add clay bar treatment when you book.",
      "Inside and out: choose Basic, Silver or Gold on the car detailing page; Gold includes a paint sealant.",
      "Swirls, haze or scratches: request a paint correction assessment.",
    ],
    scopeHeading: "Tell Us About Your Car",
    whyChoose: [
      "Your vehicle year, make, model and size.",
      "What you want addressed — routine dirt, tar, sap, bug residue or rough paint.",
      "Where the car will be parked for the visit.",
      "Your preferred date and time.",
    ],
    serviceType: "Exterior Car Detailing",
  },
  {
    slug: "headlight-restoration-baton-rouge",
    title: "Headlight Restoration in Baton Rouge: Add It to Your Detail",
    seoTitle: "Headlight Restoration in Baton Rouge | Car Detailing Add-On | AV Detailing",
    carPage: true,
    metaDescription:
      "Headlight restoration in Baton Rouge for cloudy or yellowed lenses, added to a mobile car detailing booking. See how we assess lens condition first.",
    intro:
      "Cloudy or yellowed headlight lenses are common in South Louisiana sun. Headlight restoration is an add-on you can choose when you book a car detailing package, and we do the work at your home or office in Baton Rouge and nearby areas. We look at the lenses before starting: surface haze and yellowing usually improve, while cracks, moisture inside the housing or damage to the lens itself cannot be fixed by restoration. If your lenses fall into that category, we will tell you before doing the work.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Add Headlight Restoration",
    steps: [
      "Choose your car detailing package online.",
      "Select Headlight Restoration on the add-ons step.",
      "Note any cracks, moisture or damage in the booking notes.",
      "We check the lenses on arrival and confirm before starting.",
    ],
    scopeHeading: "Tell Us About Your Headlights",
    whyChoose: [
      "Your vehicle year, make and model.",
      "Whether the lenses are hazy, yellowed, cracked or have moisture inside.",
      "A photo of the lenses if you have one.",
      "How much improvement depends on the lens condition.",
    ],
    serviceType: "Headlight Restoration",
  },
  {
    slug: "odor-removal-baton-rouge",
    title: "Car Odor Removal in Baton Rouge: Odor Elimination Add-On",
    seoTitle: "Car Odor Removal in Baton Rouge | Odor Elimination Add-On | AV Detailing",
    carPage: true,
    metaDescription:
      "Car odor removal in Baton Rouge: choose a car detailing package, then add Odor Elimination at the booking add-ons step. Note the smell and its source for our team.",
    intro:
      "Smoke, pet, mildew and spill odors come from different sources, so the right approach depends on what caused the smell and how far it has soaked into seats and carpet. When you book a car detailing package, you can add Odor Elimination at the add-ons step; its price is shown there. Odor Elimination is a separate add-on, not part of any package. In your booking notes, tell us what you notice, where it seems to come from and how long it has been there. Seat and carpet shampooing is part of the Gold package if stains are involved. How much a smell improves depends on its source; we will be honest about what to expect.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Book Odor Elimination",
    steps: [
      "Choose your car detailing package and vehicle type.",
      "Add Odor Elimination at the booking add-ons step.",
      "Describe the odor, its likely source and how long it has been there in your booking notes.",
      "We check the affected areas on arrival and tell you what to expect.",
    ],
    scopeHeading: "What to Tell Us",
    whyChoose: [
      "Type of odor — smoke, pet, mildew, food or something else.",
      "Where it is strongest: seats, carpet, trunk or vents.",
      "Any visible stains, spills or moisture.",
      "Your vehicle year, make and model.",
    ],
    serviceType: "Car Odor Removal",
  },
  {
    slug: "pet-hair-removal-baton-rouge",
    title: "Pet Hair Removal in Baton Rouge: Interior Cleaning for Pet Owners",
    seoTitle: "Pet Hair Removal for Cars in Baton Rouge | Interior Detailing | AV Detailing",
    carPage: true,
    metaDescription:
      "Pet hair removal for cars in Baton Rouge: choose a car detailing package, then add Pet Hair Removal at the booking add-ons step and tell us where the hair collects.",
    intro:
      "Embedded pet hair in carpet, seats and cargo areas takes extra time to remove, and the amount varies a lot from car to car. When you book a car detailing package, you can add Pet Hair Removal at the add-ons step; its price is shown there. It is a separate add-on, not part of any package. Silver includes a deep vacuum of seats, carpets, mats and trunk, and Gold adds shampooing. In your booking notes, tell us what kind of pet rides with you, where the hair collects and how heavy it is, so the visit has the time it needs at your home or office in Baton Rouge.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Book Pet Hair Removal",
    steps: [
      "Choose your car detailing package and vehicle type.",
      "Add Pet Hair Removal at the booking add-ons step.",
      "Note where the hair is and how heavy it is in your booking notes.",
      "We check the interior on arrival and tell you if heavy hair needs extra time.",
    ],
    scopeHeading: "What to Tell Us",
    whyChoose: [
      "Type of pet and how often it rides in the car.",
      "Seat material (cloth or leather) and any stains or odors.",
      "Whether you use seat covers or a cargo liner.",
      "Your vehicle year, make and model.",
    ],
    serviceType: "Pet Hair Removal",
  },
  {
    slug: "engine-bay-cleaning-baton-rouge",
    title: "Engine Bay Cleaning in Baton Rouge: Add It to Your Detail",
    seoTitle: "Engine Bay Cleaning in Baton Rouge | Car Detailing Add-On | AV Detailing",
    carPage: true,
    metaDescription:
      "Engine bay cleaning in Baton Rouge as an add-on to a mobile car detail. Tell us your vehicle and the bay's condition so we can check it before cleaning.",
    intro:
      "Engine bay cleaning is an add-on you can choose when you book a car detailing package; it covers a clean and dressing of the engine compartment at your home or office in Baton Rouge and nearby areas. Every engine bay is different, so we look at it before starting and adjust the approach to the vehicle. Let us know about any leaks, aftermarket parts, exposed wiring or recent repairs in your booking notes, and we will tell you if anything should be left alone.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How to Add Engine Bay Cleaning",
    steps: [
      "Choose your car detailing package online.",
      "Select Engine Bay Cleaning on the add-ons step.",
      "Note leaks, aftermarket parts or recent repairs in the booking notes.",
      "We check the engine bay on arrival before cleaning.",
    ],
    scopeHeading: "Tell Us About Your Engine Bay",
    whyChoose: [
      "Your vehicle year, make, model and engine type.",
      "Heavy grease, oil leaks or dust buildup.",
      "Aftermarket parts, exposed wiring or recent repairs.",
      "Whether the engine will be cool when we arrive.",
    ],
    serviceType: "Engine Bay Cleaning",
  },

  // ===================== RV (exterior-only; content from rv-seo) =====================
  {
    slug: "mobile-rv-detailing-baton-rouge",
    title: "Mobile RV Detailing in Baton Rouge: On-Site Exterior Service",
    seoTitle: "Mobile RV Detailing in Baton Rouge | On-Site Exterior | AV Detailing",
    rvPage: true,
    metaDescription:
      "How on-site exterior RV detailing works in Baton Rouge: service at your home, storage lot or campground, and what to send us about your RV, location and site rules.",
    intro:
      "AV Detailing comes to your RV instead of asking you to move it. We service motorhomes, fifth wheels and travel trailers where they are parked — at home, a storage lot or a campground in the Baton Rouge area — when the location allows exterior washing. Our RV service is exterior-only. Before we schedule, we confirm your RV, its condition, the exterior work you want and any site rules, so the visit is planned around your location.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How an On-Site RV Visit Is Planned",
    steps: [
      "You send your RV details, location and the exterior work you want.",
      "We confirm the location allows exterior washing and note any site rules.",
      "We agree the exterior scope and confirm pricing before the visit.",
      "We arrive within the scheduled arrival window and complete the agreed exterior work.",
      "We do a walkaround with you or send an update when the job is complete.",
    ],
    scopeHeading: "What to Send Before an On-Site Visit",
    whyChoose: [
      "RV type, year, make and model.",
      "Where it is parked and whether the property, storage lot or campground permits washing.",
      "The exterior work you want: wash, oxidation removal or ceramic coating.",
      "Photos of the current condition, if you have them, and your preferred dates.",
    ],
    serviceType: "Mobile RV Exterior Detailing",
  },
  {
    slug: "rv-oxidation-removal-baton-rouge",
    title: "RV Oxidation Removal in Baton Rouge, LA",
    seoTitle: "RV Oxidation Removal in Baton Rouge | Exterior RV | AV Detailing",
    rvPage: true,
    metaDescription:
      "RV oxidation removal in Baton Rouge for chalky or faded fiberglass. We assess a test area first and confirm scope and pricing for your RV before work begins.",
    intro:
      "Chalky, dull or faded fiberglass is a common sign of oxidation on an RV exterior. AV Detailing removes oxidation with compounding and polishing, starting with a test area so we can judge how your surface responds before committing to the full job. Results depend on the surface's condition, so we explain what is realistic for your RV and confirm the scope and price before work begins. Ceramic coating can be added afterward for surface protection.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How RV Oxidation Removal Works",
    steps: [
      "Exterior wash so the surface can be assessed.",
      "Test area to gauge the oxidation and how the surface responds.",
      "Compounding to remove the oxidized layer where the surface allows.",
      "Polishing to refine the finish.",
      "Optional sealant or ceramic coating, if you choose it.",
    ],
    scopeHeading: "Before You Book Oxidation Removal",
    whyChoose: [
      "Send photos of the most faded areas so we can review the condition.",
      "Tell us whether the RV has been polished or coated before.",
      "Expect pricing to be confirmed after we review the RV's size and condition.",
      "Service is performed where your RV is parked, when the site permits.",
    ],
    serviceType: "RV Oxidation Removal",
  },
  {
    slug: "rv-interior-detailing-baton-rouge",
    title: "RV Interior Detailing Is Not Offered",
    seoTitle: "RV Interior Detailing Not Offered | AV Detailing",
    unavailable: true,
    metaDescription:
      "AV Detailing does not offer RV interior detailing. See our exterior RV services in Baton Rouge: exterior wash, oxidation removal and ceramic coating.",
    intro:
      "AV Detailing does not provide RV or motorhome interior, upholstery or carpet cleaning. Our RV service is exterior-only. If your RV needs exterior care, these options are available in Baton Rouge and surrounding areas.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    steps: [],
    whyChoose: [],
    serviceType: "RV Interior Detailing (not offered)",
  },
  {
    slug: "rv-ceramic-coating-baton-rouge",
    title: "RV Ceramic Coating in Baton Rouge, LA",
    seoTitle: "RV Ceramic Coating in Baton Rouge | Exterior RV | AV Detailing",
    rvPage: true,
    metaDescription:
      "RV ceramic coating in Baton Rouge, applied after washing and any needed oxidation removal. Send your RV details and condition so we can confirm scope and pricing.",
    intro:
      "Ceramic coating adds a protective layer to your RV's exterior surfaces and can make routine washing easier. Because a coating seals in whatever is underneath, we wash the RV and address oxidation first where needed. AV Detailing reviews your RV's size and condition, explains the preparation it needs and confirms the scope and price with you before work begins.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How RV Ceramic Coating Works",
    steps: [
      "Exterior wash and decontamination.",
      "Oxidation removal and polishing where the surface needs it.",
      "Surface wipe-down to prepare for coating.",
      "Ceramic coating applied to the agreed exterior surfaces.",
      "Walkaround and care guidance for washing afterward.",
    ],
    scopeHeading: "Before You Book RV Ceramic Coating",
    whyChoose: [
      "Tell us your RV type, year, make and model.",
      "Share photos of the current finish, including any oxidation.",
      "Let us know about any previous coatings or polishing.",
      "Pricing is confirmed after we review the preparation your RV needs.",
    ],
    serviceType: "RV Ceramic Coating",
  },
  {
    slug: "rv-roof-cleaning-baton-rouge",
    title: "RV Roof Cleaning in Baton Rouge, LA",
    seoTitle: "RV Roof Cleaning in Baton Rouge | Mobile Service | AV Detailing",
    rvPage: true,
    metaDescription:
      "Mobile RV roof cleaning in Baton Rouge. Tell us your RV, roof material and condition, and where it's parked; we assess access and confirm the quote first.",
    intro:
      "AV Detailing offers RV roof cleaning as part of our exterior-only mobile RV service in Baton Rouge. Every roof is different, so we start with your RV details, the roof material and condition, and how the roof can be reached where the RV is parked, then confirm the scope and price before scheduling.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How a Roof Cleaning Request Works",
    steps: [
      "Send your RV details and photos of the roof, if you have them.",
      "We assess the roof's material, condition and access.",
      "We agree the scope and pricing before scheduling.",
    ],
    scopeHeading: "What to Include in Your Request",
    whyChoose: [
      "RV type, year, make and model.",
      "Roof material, if you know it, and visible condition.",
      "Where the RV is parked and any site rules for washing.",
      "Your preferred dates and contact details.",
    ],
    serviceType: "RV Roof Cleaning",
  },

  // ===================== BOAT (content rules in boat-seo) =====================
  {
    slug: "mobile-boat-detailing-baton-rouge",
    title: "Mobile Boat Detailing in Baton Rouge: How Visits Work",
    seoTitle: "Mobile Boat Detailing in Baton Rouge | How Visits Work | AV Detailing",
    boatPage: true,
    showBoatPackages: true,
    metaDescription:
      "How mobile boat detailing works in Baton Rouge: we come to where your boat is kept. Learn what to send first — boat details, location, access and site rules.",
    intro:
      "AV Detailing is a mobile service, so we detail your boat where it is kept in Baton Rouge, Gonzales, Prairieville, Walker, Denham Springs, Central and nearby areas, when the location allows detailing work. Appointments run between 6 AM and 8 PM with a 30-minute arrival window. Before we schedule, we confirm your boat, where it is kept, how it can be reached and any marina or storage rules.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How a Mobile Boat Visit Is Planned",
    steps: [
      "Send your boat details, location and the work you want.",
      "We confirm the location allows detailing and note any site rules.",
      "We agree the package or quoted scope and the price.",
      "We arrive within your 30-minute arrival window and complete the agreed work.",
    ],
    scopeHeading: "What to Send Before a Visit",
    whyChoose: [
      "Boat type, year, make, model and length.",
      "Where it is kept and whether it is on a trailer or lift.",
      "Any marina or storage rules for washing or detailing.",
      "The work you want and photos of the current condition, if you have them.",
    ],
    serviceType: "Mobile Boat Detailing",
  },
  {
    slug: "boat-ceramic-coating-baton-rouge",
    title: "Boat Ceramic Coating in Baton Rouge, LA",
    seoTitle: "Boat Ceramic Coating in Baton Rouge | Quotes & Assessment | AV Detailing",
    boatPage: true,
    showBoatPackages: true,
    metaDescription:
      "System X boat ceramic coating in Baton Rouge, quoted after we review your gelcoat or paint. A separate service from the Premium Detail's ceramic sealant.",
    intro:
      "Boat ceramic coating is a separate service from our detail packages: AV Detailing applies System X ceramic coating to your boat's gelcoat or paint, quoted after we review your boat's size and condition. Because a coating seals in the surface underneath, oxidized or faded gelcoat may need restoration first. This is different from the Boat Premium Detail, a package that includes a compound polish and ceramic sealant rather than a ceramic coating.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How a Boat Coating Quote Works",
    steps: [
      "Send your boat details, where it is kept and photos of the finish.",
      "We review the condition and whether oxidation needs attention first.",
      "We quote the System X coating and any preparation it needs.",
      "We confirm the price before any work is scheduled.",
    ],
    scopeHeading: "Before You Request a Coating Quote",
    whyChoose: [
      "Tell us the boat type, length and whether the finish is gelcoat or paint.",
      "Mention any previous coating, wax or polishing.",
      "Describe oxidation or staining; heavier oxidation may need gelcoat restoration first.",
      "Want a package instead? The Boat Premium Detail includes a ceramic sealant, not a coating.",
    ],
    serviceType: "Boat Ceramic Coating",
  },
  {
    slug: "gelcoat-restoration-baton-rouge",
    title: "Gelcoat Restoration in Baton Rouge: Oxidation Assessment",
    seoTitle: "Gelcoat Restoration & Oxidation Removal in Baton Rouge | AV Detailing",
    boatPage: true,
    showBoatPackages: true,
    metaDescription:
      "Gelcoat restoration in Baton Rouge for chalky, faded or oxidized boats. We assess the finish and test an area before recommending Full Detail, Premium Detail or a quote.",
    intro:
      "Chalky, faded or dull gelcoat is usually a sign of oxidation. How much gloss can come back depends on how far the oxidation has gone and the condition of the gelcoat, so we start by assessing the finish and testing an area. Our Boat Full Detail includes oxidation removal, and the Boat Premium Detail adds a compound polish and ceramic sealant; heavier restoration is quoted after review.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How Gelcoat Assessment Works",
    steps: [
      "Wash so the surface can be judged.",
      "Test area to see how the gelcoat responds.",
      "Recommendation: Full Detail, Premium Detail or a quoted restoration scope.",
      "Price confirmed before work begins.",
    ],
    scopeHeading: "Before You Book",
    whyChoose: [
      "Send photos of the most faded or chalky areas.",
      "Tell us if the boat has been polished, waxed or coated before.",
      "Results depend on gelcoat condition; some fading may not fully recover.",
      "Consider ceramic coating afterward for surface protection.",
    ],
    serviceType: "Gelcoat Restoration",
  },
  {
    slug: "hull-cleaning-baton-rouge",
    title: "Boat Hull Cleaning in Baton Rouge: Request an Assessment",
    seoTitle: "Boat Hull Cleaning in Baton Rouge | Assessment & Quotes | AV Detailing",
    boatPage: true,
    metaDescription:
      "Boat hull cleaning in Baton Rouge for waterline and hull staining. Hull cleaning is done with the boat out of the water on a trailer or lift. Tell us where it is so we can confirm the scope.",
    intro:
      "Waterline stains, scum and hard-water deposits build up on boats used on local rivers and lakes. We clean hulls only while the boat is out of the water on a trailer or a lift; we do not offer in-water cleaning. In your inquiry, tell us whether the boat is on a trailer or lift, where it is located, how we can reach the hull, the hull material and what you are seeing, and we will review the request before quoting.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How a Hull Cleaning Request Works",
    steps: [
      "Send your boat details, hull material and photos of the staining.",
      "Confirm the boat will be on a trailer or lift, and where it is located.",
      "We review the request and confirm the scope we can offer.",
      "We confirm the price before scheduling.",
    ],
    scopeHeading: "What to Tell Us",
    whyChoose: [
      "Boat type, length and hull material (fiberglass, aluminum or painted).",
      "Whether it is on a trailer or lift, the location, and how we can reach the hull.",
      "The type of staining or buildup and how long it has been there.",
      "Your preferred dates and contact details.",
    ],
    serviceType: "Boat Hull Cleaning",
  },
  {
    slug: "pontoon-cleaning-baton-rouge",
    title: "Pontoon Boat Cleaning & Care in Baton Rouge",
    seoTitle: "Pontoon Boat Cleaning in Baton Rouge | Decks, Vinyl & Logs | AV Detailing",
    boatPage: true,
    showBoatPackages: true,
    metaDescription:
      "Pontoon boat cleaning in Baton Rouge: decks, vinyl seating and aluminum logs. See which boat package fits and what to send for log cleaning or a quoted scope.",
    intro:
      "Pontoons have different surfaces than a fiberglass hull: decks, vinyl seating, rails and aluminum logs. Boat Wash & Wax covers an exterior wash, wax and vinyl cleaning; Boat Full Detail covers a complete interior and exterior detail with oxidation removal. Aluminum log cleaning and heavier staining are reviewed and quoted after we see the condition.",
    link1: { text: "", url: "" },
    link2: { text: "", url: "" },
    processHeading: "How We Plan Pontoon Care",
    steps: [
      "Send photos of the deck, seating and logs.",
      "We match the work to a boat package or a quoted scope.",
      "We confirm the price and schedule at your location.",
    ],
    scopeHeading: "What to Tell Us",
    whyChoose: [
      "Pontoon year, make, model and length.",
      "Deck and seating condition, including stains or mildew.",
      "Log condition and whether the pontoon is on a trailer, lift or in the water.",
      "Where it is kept and any site rules.",
    ],
    serviceType: "Pontoon Boat Cleaning",
  },
  {
    slug: "aircraft-cleaning-baton-rouge",
    title: "Aircraft Cleaning Assessment & Quotes in Baton Rouge",
    seoTitle: "Aircraft Cleaning Assessment Baton Rouge | AV Detailing",
    metaDescription: "Request an aircraft cleaning assessment in Baton Rouge. Discuss condition, interior cleaning, shampooing, polishing or ceramic coating before agreeing scope.",
    intro: "An aircraft cleaning inquiry starts with your aircraft's condition and the work you want assessed. AV Detailing reviews private-aircraft requests, including private jets, to agree a specific scope rather than assume a package. Our aircraft services are deep interior cleaning, shampooing, polishing and ceramic coating. Tell us your aircraft type, its current condition, the areas that concern you and where it is parked, and we will recommend which of these services fits and prepare a quote.",
    link1: { text: "Aircraft detailing overview", url: "/aircraft-detailing-baton-rouge" },
    link2: { text: "Aircraft polishing and ceramic coating", url: "/aircraft-paint-protection-baton-rouge" },
    processHeading: "From aircraft condition to an agreed work scope",
    steps: [
      "Provide your aircraft make/model, airport and hangar or FBO location, and contact details.",
      "Describe the aircraft condition, requested areas and concerns. Say whether you want interior deep cleaning, shampooing, polishing or ceramic coating assessed. Photos are optional; no aircraft registration number is required initially.",
      "Share your preferred dates and availability. We coordinate airport access and workspace arrangements for the proposed job.",
      "Agree the included and excluded work after the aircraft, condition and request have been reviewed. Sending an inquiry does not reserve an appointment.",
    ],
    scopeHeading: "What your aircraft cleaning quote should clarify",
    whyChoose: [
      "Which confirmed service addresses your request, and which areas are included or excluded? An inquiry does not establish a washing package or automatic inclusions.",
      "What condition details, existing finish information or photos would help assess the request? Products and exact inclusions are confirmed for the agreed work, not copied from car detailing.",
      "Are you requesting cabin cleaning or shampooing, polishing, ceramic coating, or a combination? These are distinct services to agree in the quote.",
      "What access and workspace arrangements need to be made at your aircraft's location?",
    ],
    relatedLinks: [
      { text: "Private-aircraft detailing overview and coverage", href: "/aircraft-detailing-baton-rouge" },
      { text: "Aircraft interior deep cleaning and shampooing", href: "/aircraft-interior-detailing-baton-rouge" },
      { text: "Aircraft polishing and ceramic coating", href: "/aircraft-paint-protection-baton-rouge" },
    ],
    serviceType: "Aircraft Cleaning Assessment and Quote Inquiry",
  },
  {
    slug: "aircraft-interior-detailing-baton-rouge",
    title: "Private-Aircraft Cabin Deep Cleaning & Shampooing",
    seoTitle: "Aircraft Cabin Deep Cleaning & Shampooing Baton Rouge | AV Detailing",
    metaDescription: "Private-aircraft cabin deep cleaning and shampooing in Baton Rouge. Share interior condition, requested areas and location to agree your quote and access.",
    intro: "AV Detailing provides deep interior cleaning and shampooing for private aircraft, including private jets. This page focuses on the cabin rather than exterior cleaning or polishing. Tell us which interior areas need attention, their current condition and the work you want. We review those details with your aircraft make/model before agreeing the inclusions and exclusions; there is no assumed all-cabin package or automatic list of treated surfaces.",
    link1: { text: "Aircraft detailing overview", url: "/aircraft-detailing-baton-rouge" },
    link2: { text: "Aircraft polishing and ceramic coating", url: "/aircraft-paint-protection-baton-rouge" },
    processHeading: "Planning your aircraft interior cleaning",
    steps: [
      "Share your aircraft make/model and describe the cabin areas, materials and condition you want reviewed. Photos are optional.",
      "Say whether you are requesting deep interior cleaning, shampooing or both, and identify any areas you do not want included.",
      "Provide the airport and hangar or FBO location, preferred dates, availability and contact details.",
      "Confirm the cabin work scope, access and workspace arrangements before agreeing the appointment. A quote request alone does not reserve a date.",
    ],
    scopeHeading: "Cabin details to agree in your quote",
    whyChoose: [
      "Which areas are included in deep cleaning, and which are proposed for shampooing? Exact inclusions are confirmed for your aircraft.",
      "Which materials and products are involved? Product names and suitability need confirmation for the agreed areas, not a universal aircraft-surface claim.",
      "What should you move or prepare before the visit? Ask about preparation for the cabin areas included in the scope.",
      "How should aircraft availability be planned around the requested work? Any drying and return-to-use arrangements need confirmation; no fixed turnaround is promised.",
    ],
    relatedLinks: [
      { text: "Private-aircraft detailing overview and coverage", href: "/aircraft-detailing-baton-rouge" },
      { text: "Aircraft cleaning assessment and quote guidance", href: "/aircraft-cleaning-baton-rouge" },
      { text: "Aircraft polishing and ceramic coating", href: "/aircraft-paint-protection-baton-rouge" },
    ],
    serviceType: "Aircraft Interior Deep Cleaning and Shampooing",
  },
  {
    slug: "aircraft-paint-protection-baton-rouge",
    title: "Aircraft Polishing & Ceramic Coating in Baton Rouge",
    seoTitle: "Aircraft Polishing & Ceramic Coating Baton Rouge | AV Detailing",
    metaDescription: "Aircraft polishing and ceramic coating in Baton Rouge, not repainting. Discuss aircraft condition, requested areas, preparation and access for a tailored quote.",
    intro: "AV Detailing offers polishing and ceramic coating for private aircraft, including private jets. Polishing and coating are distinct detailing services: tell us whether you want one or both and which areas you want assessed. This is not an aircraft repainting or paint-repair service offer. We review the aircraft condition and requested work before agreeing the scope; preparation, products and included surfaces are confirmed for the particular job, not assumed from a coating package.",
    link1: { text: "Aircraft detailing overview", url: "/aircraft-detailing-baton-rouge" },
    link2: { text: "Aircraft cleaning assessment and quote guidance", url: "/aircraft-cleaning-baton-rouge" },
    processHeading: "Discussing polishing and coating for your aircraft",
    steps: [
      "Provide the aircraft make/model, condition and the areas you want reviewed. Share any known existing finish or coating details; photos are optional.",
      "Identify whether your request is for polishing, ceramic coating or both. Do not assume polishing or other preparation is automatically included with coating.",
      "Share the airport and hangar or FBO location, preferred dates, availability and contact details so access and workspace can be coordinated.",
      "Agree the proposed surfaces, preparation and exclusions before finalizing the quote and scheduling arrangements.",
    ],
    scopeHeading: "Polishing and coating details to confirm",
    whyChoose: [
      "Which areas will be polished or coated, and what preparation is included? The answer depends on the assessed aircraft and agreed request.",
      "What products are proposed, and are they suitable for the agreed surfaces? Product names and compatibility require confirmation before work.",
      "What workspace, curing or aircraft-availability arrangements apply to the proposed work? No fixed curing time is stated before the scope is confirmed.",
      "What aftercare is recommended for the selected work? Ask for the applicable instructions; no coating lifespan, warranty or guaranteed result is promised here.",
    ],
    relatedLinks: [
      { text: "Private-aircraft detailing overview and coverage", href: "/aircraft-detailing-baton-rouge" },
      { text: "Aircraft cleaning assessment and quote guidance", href: "/aircraft-cleaning-baton-rouge" },
      { text: "Aircraft interior deep cleaning and shampooing", href: "/aircraft-interior-detailing-baton-rouge" },
    ],
    serviceType: "Aircraft Polishing and Ceramic Coating",
  },
];

export const SERVICE_LANDING_BY_SLUG: Record<string, ServiceLandingConfig> = Object.fromEntries(
  SERVICE_LANDING_PAGES.map((p) => [p.slug, p]),
);
