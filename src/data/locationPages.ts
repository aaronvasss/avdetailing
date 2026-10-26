/**
 * Location landing pages for Baton Rouge area SEO.
 * Each entry powers one route via <LocationLandingTemplate />.
 * Intro paragraphs use {{l1}} and {{l2}} tokens for external links.
 */

export interface ExtLink {
  text: string;
  url: string;
}

export interface LocationServiceItem {
  name: string;
  description: string;
  /** Internal page with the full, current scope for this service. */
  href: string;
}

export interface LocationPageConfig {
  slug: string;
  city: string;            // e.g. "Highland Road, Baton Rouge"
  titleH1: string;         // exact H1
  titleTag: string;        // <title> (template appends nothing — full title)
  metaDescription: string;
  intro: string;           // 120–150 words with {{l1}} {{l2}}
  link1?: ExtLink;         // optional external reference (only when it supports a claim)
  link2?: ExtLink;         // local (omit when no relevant local authority exists)
  services: LocationServiceItem[];
  whyChoose: string[];     // 4 bullets
  neighborhoods: string;   // streets, subdivisions, landmarks paragraph
  surroundingParagraph: React.ReactNode | string; // brief w/ internal link
  lat: number;
  lng: number;
  /** Optional city-specific service notes (logistics, conditions, scheduling). */
  localNotes?: string[];
  /** Optional city-specific FAQs rendered with FAQPage structured data. */
  faqs?: { question: string; answer: string }[];
  /**
   * Optional internal reminder rendered as an HTML comment placeholder where
   * real local proof (photos, named jobs, reviews) still needs to be added.
   */
  proofPlaceholder?: string;
}

/**
 * Shared service list for every city page. Scope mirrors the active car
 * packages/add-ons and the corrected car service pages; each item links to
 * the page that carries full details and current prices.
 */
const COMMON_SERVICES: LocationServiceItem[] = [
  { name: "Mobile Car Detailing", href: "/mobile-car-detailing-baton-rouge", description: "Basic, Silver and Gold packages performed at your home or office. Compare what each package includes on the car detailing page." },
  { name: "Interior Detailing", href: "/interior-detailing-baton-rouge", description: "Deep vacuum and trim cleaning in Silver; seat and upholstery shampoo, leather conditioning and carpet deep cleaning in Gold." },
  { name: "Exterior Detailing", href: "/exterior-detailing-baton-rouge", description: "Hand wash and dry, wheels and tires, tire shine and exterior windows. Clay bar treatment is a separate add-on; Gold adds paint sealant." },
  { name: "Paint Correction", href: "/paint-correction-baton-rouge", description: "Paint assessment, then 1-step, 2-step or 3-step machine polishing to reduce swirls, haze and light scratches. Results depend on defect depth and clear coat." },
  { name: "Ceramic Coating", href: "/ceramic-coating-baton-rouge", description: "Paint protection applied after any needed correction; see the ceramic coating page for available options." },
  { name: "Headlight Restoration", href: "/headlight-restoration-baton-rouge", description: "Add-on chosen at the booking add-ons step. We check the lenses on arrival; cracks, moisture or damage can't be fixed by restoration." },
  { name: "Pet Hair & Odor Help", href: "/pet-hair-removal-baton-rouge", description: "Describe the hair or odor (with photos if you can) and we'll recommend an interior package and confirm the scope before you book." },
];

const SERVICE_AREA_NOTE = "Mobile service at your home or office, with appointments between 6 AM and 8 PM Central and a 30-minute arrival window.";

export const LOCATION_PAGES: LocationPageConfig[] = [
  {
    slug: "car-detailing-highland-road-baton-rouge",
    city: "Highland Road",
    titleH1: "Car Detailing on Highland Road, Baton Rouge, LA",
    titleTag: "Car Detailing on Highland Road, Baton Rouge",
    metaDescription:
      "Mobile car detailing along Highland Road, Baton Rouge \u2014 Bocage, Goodwood, Kenilworth, Perkins Road and the LSU area. Compare packages, add-ons and book online.",
    intro:
      "AV Detailing brings mobile car detailing to homes and offices along the Highland Road corridor in Baton Rouge, from the LSU area and Perkins Road out to Bocage, Goodwood and Kenilworth. Choose a Basic, Silver or Gold package, add options such as clay bar treatment or headlight restoration, and we come to your driveway at the time you book. If your paint needs more than a wash, we assess it first and recommend paint correction or ceramic coating options.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile service to your driveway in Bocage, Goodwood, Kenilworth and the Perkins Road area \u2014 no shop drop-off.",
      "Book around LSU game days, school pickup and commute traffic by choosing your own appointment time.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve homes along Highland Road itself, plus surrounding subdivisions and corridors including Bocage, Goodwood, Kenilworth, Stanford Avenue, Perkins Road, the Acadian Thruway area, the Garden District edge, and the streets around LSU. Whether you're near the LSU lakes, the Perkins Road overpass, or out toward Pollard Estates, our mobile team comes to you.",
    surroundingParagraph: "highland-link",
    lat: 30.3963,
    lng: -91.1271,
  },
  {
    slug: "car-detailing-shenandoah-baton-rouge",
    city: "Shenandoah",
    titleH1: "Car Detailing in Shenandoah, Baton Rouge, LA",
    titleTag: "Car Detailing in Shenandoah Baton Rouge, LA",
    metaDescription:
      "Mobile car detailing in Shenandoah, Baton Rouge \u2014 Shenandoah Estates, Siegen Lane, Nicholson Dr and the Mall of Louisiana area. Compare packages and book online.",
    intro:
      "AV Detailing brings mobile car detailing to homes and offices in the Shenandoah area of Baton Rouge, including Shenandoah Estates, the Siegen Lane corridor, Nicholson Drive and the streets around the Mall of Louisiana. Pick a Basic, Silver or Gold package for your car, SUV or truck, add extras at the booking add-ons step, and we come to your driveway. Paint correction and ceramic coating start with an assessment of your paint.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Serves Shenandoah Estates, the Siegen Lane corridor, Nicholson Drive and the Mall of Louisiana area.",
      "Package prices are set by vehicle type \u2014 car, SUV or truck \u2014 and shown before you book.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve Shenandoah Estates, the Siegen Lane corridor, Nicholson Drive, the Mall of Louisiana area, Burbank Drive, Bluebonnet Boulevard, and the neighborhoods between Siegen and Highland Road. If you're near the Mall, off Picardy, or out toward Burbank, we come to you.",
    surroundingParagraph: "shenandoah-link",
    lat: 30.3542,
    lng: -91.0351,
  },
  {
    slug: "car-detailing-gonzales-la",
    city: "Gonzales",
    titleH1: "Car Detailing in Gonzales, LA",
    titleTag: "Car Detailing in Gonzales, LA",
    metaDescription:
      "Mobile car detailing in Gonzales, LA \u2014 Prairieville Road, Hwy 30, Tanger Outlets and Burnside areas. Compare packages and add-ons, then book online.",
    intro:
      "AV Detailing brings mobile car detailing to Gonzales in Ascension Parish, including the Prairieville Road area, the Hwy 30 corridor, the streets around Tanger Outlets and out toward Burnside. Choose a Basic, Silver or Gold package, add clay bar treatment, headlight restoration or engine bay cleaning if you need them, and we come to your home or office \u2014 no drive into Baton Rouge required.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile detailing in Ascension Parish \u2014 no need to drive to Baton Rouge.",
      "Add clay bar treatment, headlight restoration or engine bay cleaning when you book.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve the Prairieville Road area, the Hwy 30 corridor, neighborhoods around Tanger Outlets, the Burnside area, and the residential streets between I-10 and Hwy 44. Whether you're near the outlets, off Airline Highway, or out toward the river, our mobile team comes to you.",
    surroundingParagraph: "gonzales-link",
    lat: 30.2382,
    lng: -90.9201,
  },
  {
    slug: "car-detailing-prairieville-la",
    city: "Prairieville",
    titleH1: "Car Detailing in Prairieville, LA",
    titleTag: "Car Detailing in Prairieville, LA",
    metaDescription:
      "Mobile car detailing in Prairieville, LA \u2014 Airline Hwy and Hwy 73 corridors, Galvez and Ascension Parish subdivisions. Compare packages and book online.",
    intro:
      "AV Detailing brings mobile car detailing to Prairieville, covering the Airline Highway and Hwy 73 corridors, the Galvez community and subdivisions throughout this part of Ascension Parish. Choose a Basic, Silver or Gold package, pick any add-ons, and we come to your driveway. For swirls, haze or protection, we assess your paint first and recommend paint correction or ceramic coating options.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile service to your driveway in Prairieville and nearby Ascension Parish subdivisions.",
      "Book around commutes into Baton Rouge and Gonzales by choosing your own appointment time.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve the Airline Highway corridor, the Hwy 73 area, the Galvez community, and the newer subdivisions throughout Prairieville and Ascension Parish. Whether you're near Hoo Shoo Too Road, off Hwy 73, or in one of the newer developments closer to Hwy 42, we come to you.",
    surroundingParagraph: "prairieville-link",
    lat: 30.3057,
    lng: -90.9784,
  },
  {
    slug: "car-detailing-denham-springs-la",
    city: "Denham Springs",
    titleH1: "Car Detailing in Denham Springs, LA",
    titleTag: "Car Detailing in Denham Springs, LA",
    metaDescription:
      "Mobile car detailing in Denham Springs, LA \u2014 I-12 corridor, Range Ave, Bass Pro area, Juban Rd and Springfield Rd. Compare packages and book online.",
    intro:
      "AV Detailing brings mobile car detailing to Denham Springs and nearby Livingston Parish, including the I-12 corridor, Range Avenue, the Bass Pro area, Juban Road and Springfield Road. We work at homes, offices and business lots. Choose a Basic, Silver or Gold package for your car, SUV or truck, add extras such as clay bar treatment for bonded road film, and tell us where the vehicle will be parked.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile detailing for cars, SUVs and trucks at your driveway, office or business lot.",
      "Clay bar treatment is available as an add-on for bonded road film and bug residue.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve the I-12 corridor, Range Avenue, the Bass Pro area, Juban Road, Springfield Road, Pete's Highway, Florida Boulevard (Hwy 190), the Antique Village / downtown Denham Springs area, and the residential streets stretching out toward Watson and Livingston. Whether you're near the Bass Pro, off Juban, or in a subdivision along Springfield Road, our mobile team comes to you.",
    localNotes: [
      "We work at driveways, offices and business lots around Range Avenue and Juban Road — note in your booking where the vehicle will be parked and any access instructions.",
      "Package prices are set by vehicle type (car, SUV or truck) and shown before you book.",
      "Clay bar treatment is available as an add-on for bonded road film and bug residue on exterior paint.",
      "Boat and RV owners can request exterior work at home; see the boat and RV pages for current options and what to tell us.",
      "Appointments run between 6 AM and 8 PM Central, with a 30-minute arrival window.",
    ],
    faqs: [
      {
        question: "Do you actually come to Denham Springs, or do I have to drive to Baton Rouge?",
        answer:
          "We come to you. AV Detailing is mobile and serves Denham Springs and nearby Livingston Parish, including the I-12 corridor, Range Avenue, Juban Road, Springfield Road and out toward Watson. Book online and we arrive at your home or office.",
      },
      {
        question: "Can you detail a truck or a large SUV?",
        answer:
          "Yes. Pricing is set by vehicle type — car, SUV or truck — and you see the price for your vehicle type before you book.",
      },
      {
        question: "How long does a detail take in my driveway?",
        answer:
          "Standard package appointments are scheduled for about 2 hours 15 minutes. Paint correction and ceramic coating take longer, and we confirm the time when you book.",
      },
      {
        question: "Can you remove lovebugs and road film?",
        answer:
          "Our exterior wash removes surface dirt and bug residue. For bonded contamination, add clay bar treatment at the booking add-ons step; heavy etching may need a paint correction assessment.",
      },
      {
        question: "Do you detail boats and RVs parked at a Denham Springs home?",
        answer:
          "You can request it. RV service is exterior-only, and boat work starts with details about the boat and where it's parked — see the RV and boat pages for current options.",
      },
      {
        question: "How do I book a detail in Denham Springs?",
        answer:
          "Book online through our booking page or call (225) 521-6264. You'll get a confirmation with your appointment time and a 30-minute arrival window.",
      },
    ],
    proofPlaceholder:
      "PLACEHOLDER — add real local proof for Denham Springs here: before/after photos from actual Denham Springs jobs, named neighborhoods serviced, and verified customer reviews. Do not publish invented examples.",
    surroundingParagraph: "denham-link",
    lat: 30.4855,
    lng: -90.9559,
  },
  {
    slug: "car-detailing-walker-la",
    city: "Walker",
    titleH1: "Car Detailing in Walker, LA",
    titleTag: "Car Detailing in Walker, LA",
    metaDescription:
      "Mobile car detailing in Walker, LA \u2014 Hwy 16 corridor, Walker Road and north Livingston Parish. Compare packages and add-ons, then book online.",
    intro:
      "AV Detailing brings mobile car detailing to Walker in Livingston Parish, including the Hwy 16 corridor, Walker Road, the Hwy 447 area and nearby neighborhoods. Choose a Basic, Silver or Gold package for your car, SUV or truck, add any extras at the booking add-ons step, and we come to your driveway \u2014 no trip into Baton Rouge needed.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile service to your driveway in Walker \u2014 no Baton Rouge drive required.",
      "Clay bar treatment is available as an add-on for bonded road film and bug residue.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve the Hwy 16 corridor, Walker Road, the neighborhoods along Hwy 447, and the residential streets throughout north Livingston Parish. Whether you're near Hwy 16, off Walker South Road, or out toward Watson, our mobile team comes to you.",
    surroundingParagraph: "walker-link",
    lat: 30.4866,
    lng: -90.8631,
  },
  {
    slug: "car-detailing-zachary-la",
    city: "Zachary",
    titleH1: "Car Detailing in Zachary, LA",
    titleTag: "Car Detailing in Zachary, LA",
    metaDescription:
      "Mobile car detailing in Zachary, LA \u2014 Pride Road corridor, Hwy 19 and north Baton Rouge. Compare packages and add-ons, then book online.",
    intro:
      "AV Detailing brings mobile car detailing to Zachary, including the Pride Road corridor, Hwy 19, the community core and nearby north Baton Rouge neighborhoods. Choose a Basic, Silver or Gold package for your car, SUV or truck, add extras such as headlight restoration or engine bay cleaning, and we come to your home or office.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile service to your Zachary driveway \u2014 no drive down to Baton Rouge.",
      "Book around commutes and family routines by choosing your own appointment time.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve the Pride Road corridor, Hwy 19, the Zachary community core, and the commuter neighborhoods throughout north Baton Rouge. Whether you're near Plank Road, off Hwy 19, or out toward Pride, our mobile team comes to you.",
    surroundingParagraph: "zachary-link",
    lat: 30.6491,
    lng: -91.1565,
  },
  {
    slug: "car-detailing-central-la",
    city: "Central",
    titleH1: "Car Detailing in Central, LA",
    titleTag: "Car Detailing in Central, LA",
    metaDescription:
      "Mobile car detailing in Central, LA \u2014 Greenwell Springs Rd, Sullivan Rd, Hooper Rd and the Livingston Parish border. Compare packages and book online.",
    intro:
      "AV Detailing brings mobile car detailing to the City of Central, northeast of Baton Rouge, including Greenwell Springs Road, Sullivan Road, Hooper Road and the Wax Road area. Choose a Basic, Silver or Gold package, add any extras at the booking add-ons step, and we come to your driveway. Paint correction and ceramic coating start with an assessment of your paint.",
    services: COMMON_SERVICES,
    whyChoose: [
      SERVICE_AREA_NOTE,
      "Mobile service to your driveway anywhere in Central \u2014 no trip into Baton Rouge.",
      "Package prices are set by vehicle type \u2014 car, SUV or truck \u2014 and shown before you book.",
      "Every service links to its own page with current package details and prices.",
    ],
    neighborhoods:
      "We serve Greenwell Springs Road, Sullivan Road, Hooper Road, the Wax Road area, and the residential streets out toward the Central / Livingston Parish border. Whether you're near Greenwell Springs, off Sullivan, or out toward Hooper, our mobile team comes to you.",
    surroundingParagraph: "central-link",
    lat: 30.5527,
    lng: -91.0357,
  },
];

export const LOCATION_PAGES_BY_SLUG: Record<string, LocationPageConfig> = Object.fromEntries(
  LOCATION_PAGES.map((p) => [p.slug, p])
);
