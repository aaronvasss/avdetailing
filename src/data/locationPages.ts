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
}

export interface LocationPageConfig {
  slug: string;
  city: string;            // e.g. "Highland Road, Baton Rouge"
  titleH1: string;         // exact H1
  titleTag: string;        // <title> (template appends nothing — full title)
  metaDescription: string;
  intro: string;           // 120–150 words with {{l1}} {{l2}}
  link1: ExtLink;          // national
  link2: ExtLink;          // local
  services: LocationServiceItem[];
  whyChoose: string[];     // 4 bullets
  neighborhoods: string;   // streets, subdivisions, landmarks paragraph
  surroundingParagraph: React.ReactNode | string; // brief w/ internal link
  lat: number;
  lng: number;
}

const CR: ExtLink = { text: "Consumer Reports", url: "https://www.consumerreports.org/cars/car-care/" };
const BRLA: ExtLink = { text: "the City of Baton Rouge", url: "https://www.brla.gov/" };

const COMMON_SERVICES: LocationServiceItem[] = [
  { name: "Mobile Car Detailing", description: "Full interior and exterior detailing performed at your home, office, or jobsite with a self-contained mobile rig." },
  { name: "System X Ceramic Coating", description: "3-year, 5-year, and 10-year ceramic coating tiers engineered to withstand Louisiana UV, humidity, and rain." },
  { name: "Paint Correction", description: "1-step, 2-step, and 3-step machine polishing to remove swirls, oxidation, and light scratches." },
  { name: "Interior Detailing", description: "Deep shampoo, steam extraction, leather conditioning, and odor neutralization." },
  { name: "Exterior Detailing", description: "Hand wash, decontamination, clay bar, and protective sealant or wax application." },
  { name: "Headlight Restoration", description: "Sand, polish, and seal cloudy or yellowed headlights for safer night driving." },
  { name: "Pet Hair & Odor Removal", description: "Specialized extraction and ozone treatment for embedded hair and lingering odors." },
];

export const LOCATION_PAGES: LocationPageConfig[] = [
  {
    slug: "car-detailing-highland-road-baton-rouge",
    city: "Highland Road",
    titleH1: "Car Detailing on Highland Road, Baton Rouge, LA",
    titleTag: "Car Detailing on Highland Road, Baton Rouge",
    metaDescription:
      "Mobile car detailing along Highland Road, Baton Rouge — Bocage, Goodwood, Kenilworth, Perkins Road & LSU area. System X ceramic coating & correction.",
    intro:
      "Highland Road runs from the LSU campus through the Perkins Road overpass and out to the affluent neighborhoods east of Acadian Thruway — a corridor that sees some of the heaviest daily commuter traffic in Baton Rouge. Residents in Bocage, Goodwood, Kenilworth, and the Perkins Road area often own luxury European sedans, late-model SUVs, and weekend sports cars that deserve professional care without the hassle of dropping off at a shop. AV Detailing brings a fully equipped mobile rig directly to your driveway anywhere along the Highland Road corridor. The mix of LSU game-day traffic, construction grime, and Louisiana UV is hard on paint and interiors. According to {{l1}}, regular professional detailing preserves resale value, and {{l2}} encourages residents to keep vehicles maintained for safer roads through the parish.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile service to your driveway in Bocage, Goodwood, Kenilworth, and the Perkins Road area — no shop drop-off.",
      "Experienced with luxury and high-end vehicles common along the Highland Road corridor.",
      "System X ceramic coating tiers engineered for the intense UV and humidity east of LSU.",
      "Flexible scheduling that works around LSU game days, school pickup, and commuter traffic.",
    ],
    neighborhoods:
      "We regularly service homes along Highland Road itself, plus surrounding subdivisions and corridors including Bocage, Goodwood, Kenilworth, Stanford Avenue, Perkins Road, the Acadian Thruway area, the Garden District edge, and the streets around LSU. Whether you're near the LSU lakes, the Perkins Road overpass, or out toward Pollard Estates, our mobile team comes to you.",
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
      "Mobile car detailing in Shenandoah, Baton Rouge — Shenandoah Estates, Siegen Lane, Nicholson Dr & Mall of Louisiana. System X ceramic coating.",
    intro:
      "The Shenandoah area off Nicholson Drive and Siegen Lane has grown into one of the busiest family-residential corridors in Baton Rouge, anchored by the Mall of Louisiana and a steady mix of subdivisions, schools, and retail. Most households in Shenandoah Estates and the surrounding streets juggle family SUVs, daily-driver trucks, and commuter sedans — vehicles that rack up miles fast and rarely get a free Saturday for shop detailing. AV Detailing brings a fully equipped mobile rig to your driveway anywhere in the Shenandoah / Siegen / Nicholson area, with System X products and professional paint correction. According to {{l1}}, consistent professional care extends a vehicle's life, and {{l2}} reminds residents that well-maintained vehicles are safer on the parish's busiest roads.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile service that fits around school pickup, work, and weekend errands.",
      "Experienced with family SUVs, trucks, and daily-driver sedans common in Shenandoah.",
      "Serves Shenandoah Estates, Siegen Lane corridor, Nicholson Drive, and the Mall of Louisiana area.",
      "System X protection that holds up against Louisiana sun and Mall of Louisiana parking-lot heat.",
    ],
    neighborhoods:
      "Our team regularly details vehicles throughout Shenandoah Estates, the Siegen Lane corridor, Nicholson Drive, the Mall of Louisiana area, Burbank Drive, Bluebonnet Boulevard, and the neighborhoods between Siegen and Highland Road. If you're near the Mall, off Picardy, or out toward Burbank, we come to you.",
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
      "Mobile car detailing in Gonzales, LA — serving Prairieville Road, Hwy 30, Tanger Outlets, and Burnside with System X ceramic coating and paint correction.",
    intro:
      "Gonzales sits right on the I-10 corridor in Ascension Parish — known as the Jambalaya Capital of the World, and one of the fastest-growing communities in the Greater Baton Rouge region. Residents here drive a mix of trucks, family SUVs, and commuter vehicles that take a beating from I-10 highway grime, lovebugs, and the relentless Louisiana sun. AV Detailing brings full mobile detailing service directly to driveways throughout Gonzales, from the Prairieville Road area and the Hwy 30 corridor to Tanger Outlets and out toward Burnside. We arrive with a self-contained rig, System X ceramic coating, and pro-grade paint correction tools. According to {{l1}}, regular professional care protects long-term value, and {{l2}} encourages residents to keep vehicles well-maintained for safer travel across the parish.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile detailing throughout Ascension Parish — no need to drive to Baton Rouge.",
      "Experience with trucks, SUVs, and family vehicles that see heavy I-10 highway miles.",
      "Bug, tar, and road-grime removal built into every exterior service.",
      "System X ceramic coating tiers engineered for Louisiana UV and humidity.",
    ],
    neighborhoods:
      "We regularly service the Prairieville Road area, the Hwy 30 corridor, neighborhoods around Tanger Outlets, the Burnside area, and the residential streets between I-10 and Hwy 44. Whether you're near the outlets, off Airline Highway, or out toward the river, our mobile team comes to you.",
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
      "Mobile car detailing in Prairieville, LA — Airline Hwy & Hwy 73 corridors, Galvez & new Ascension Parish subdivisions. System X ceramic coating.",
    intro:
      "Prairieville is one of the fastest-growing communities in Louisiana, with new subdivisions springing up along Airline Highway and Hwy 73 every year. Most households here have late-model SUVs, trucks, and family sedans — vehicles that owners want to keep looking new for as long as possible. The combination of suburban driving, Hwy 73 construction grime, and Louisiana's UV makes professional detailing a smart long-term investment. AV Detailing brings a fully equipped mobile rig directly to your driveway anywhere in Prairieville, with System X ceramic coating, paint correction, and interior detailing. According to {{l1}}, consistent professional care preserves resale value, and {{l2}} encourages residents to keep vehicles well-maintained for safer roads throughout the parish.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile service to your driveway in any Ascension Parish subdivision — no drop-off required.",
      "Experience protecting newer vehicles in Prairieville's growing neighborhoods.",
      "System X ceramic coating tiers designed for Louisiana sun and humidity.",
      "Flexible scheduling around commutes into Baton Rouge and Gonzales.",
    ],
    neighborhoods:
      "We regularly service the Airline Highway corridor, the Hwy 73 area, the Galvez community, and the newer subdivisions throughout Prairieville and Ascension Parish. Whether you're near Hoo Shoo Too Road, off Hwy 73, or in one of the newer developments closer to Hwy 42, we come to you.",
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
      "Mobile car detailing in Denham Springs, LA — serving the I-12 corridor, Range Avenue, Bass Pro area, Juban Road, and Springfield Road with System X ceramic coating.",
    intro:
      "Denham Springs in Livingston Parish is heavy truck and SUV country — work vehicles, family haulers, and commuter trucks that see real use on the I-12 corridor every day. The combination of highway road grime, lovebugs, and brutal Louisiana sun means vehicles here need serious detailing to stay protected. AV Detailing brings a fully equipped mobile rig directly to driveways throughout Denham Springs — from the I-12 corridor and Range Avenue to the Bass Pro area, Juban Road, and Springfield Road. We work with System X ceramic coating, professional paint correction, and full interior services. According to {{l1}}, professional detailing preserves long-term value, and {{l2}} encourages residents to keep vehicles maintained for safer roads across the region.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile detailing built for trucks and SUVs — we come to your driveway or jobsite.",
      "Heavy bug, tar, and I-12 road-grime removal included in every exterior service.",
      "System X ceramic coating tiers engineered for Louisiana UV and humidity.",
      "Flexible scheduling around work, hunting, and family weekends.",
    ],
    neighborhoods:
      "We regularly service the I-12 corridor, Range Avenue, the Bass Pro area, Juban Road, Springfield Road, and the residential streets throughout Denham Springs and Livingston Parish. Whether you're near the Bass Pro, off Juban, or out toward Watson, our mobile team comes to you.",
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
      "Mobile car detailing in Walker, LA — serving the Hwy 16 corridor, Walker Road, and north Livingston Parish with System X ceramic coating and paint correction.",
    intro:
      "Walker is one of Livingston Parish's growing communities, with quick access to Highway 16 and I-12 connecting residents to jobs across Baton Rouge and Denham Springs. Most households here own a mix of trucks, work vehicles, and family SUVs that see daily highway miles — and very few residents want to spend a Saturday driving to a detail shop. AV Detailing brings a fully equipped mobile rig directly to your driveway anywhere in Walker, with System X ceramic coating, paint correction, and complete interior detailing. According to {{l1}}, consistent professional care extends the life of a vehicle, and {{l2}} encourages residents to keep their vehicles well-maintained for safer travel across the parish and into Baton Rouge.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile service to your driveway in Walker — no Baton Rouge commute required.",
      "Truck and SUV experience for the work vehicles common in Livingston Parish.",
      "Heavy I-12 bug and road-grime removal included in every exterior service.",
      "System X ceramic coating tiers engineered for Louisiana sun and humidity.",
    ],
    neighborhoods:
      "We regularly service the Hwy 16 corridor, Walker Road, the neighborhoods along Hwy 447, and the residential streets throughout north Livingston Parish. Whether you're near Hwy 16, off Walker South Road, or out toward Watson, our mobile team comes to you.",
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
      "Mobile car detailing in Zachary, LA — serving the Pride Road corridor, Hwy 19, and north Baton Rouge with System X ceramic coating and paint correction.",
    intro:
      "Zachary sits in North Baton Rouge as a family-oriented suburban community connected by Pride Road and Highway 19, with residents who commute south into Baton Rouge for work but want a quieter neighborhood to come home to. The vehicle mix here leans heavily toward SUVs, trucks, and family sedans, and the combination of commuter mileage, north Baton Rouge road conditions, and Louisiana UV makes professional detailing well worth the investment. AV Detailing brings a fully equipped mobile rig directly to driveways throughout Zachary, with System X ceramic coating, paint correction, and full interior detailing. According to {{l1}}, regular professional care preserves resale value, and {{l2}} encourages residents to keep vehicles maintained for safer roads across the parish.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Mobile service to your Zachary driveway — no drive down to Baton Rouge.",
      "Experience with the SUVs, trucks, and family vehicles common in Zachary.",
      "System X ceramic coating tiers engineered for Louisiana UV and humidity.",
      "Flexible scheduling that works around commutes and family routines.",
    ],
    neighborhoods:
      "We regularly service the Pride Road corridor, Hwy 19, the Zachary community core, and the commuter neighborhoods throughout north Baton Rouge. Whether you're near Plank Road, off Hwy 19, or out toward Pride, our mobile team comes to you.",
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
      "Mobile car detailing in Central, LA — serving Greenwell Springs Road, Sullivan Road, Hooper Road, and the Livingston Parish border with System X ceramic coating.",
    intro:
      "The City of Central is its own incorporated city northeast of Baton Rouge, with a strong community identity and residents who consistently prefer local, mobile service over driving into town. The Greenwell Springs Road corridor anchors the area, with family vehicles and trucks dominating the driveways throughout Central's neighborhoods. The combination of suburban-rural driving, Louisiana sun, and pollen-heavy seasons makes professional detailing a smart investment for vehicles here. AV Detailing brings a fully equipped mobile rig directly to driveways throughout Central, with System X ceramic coating, paint correction, and full interior detailing. According to {{l1}}, consistent professional care preserves vehicle value, and {{l2}} encourages residents across the parish to keep vehicles maintained for safer travel.",
    link1: CR,
    link2: BRLA,
    services: COMMON_SERVICES,
    whyChoose: [
      "Local, mobile service to your driveway anywhere in Central — no trip into Baton Rouge.",
      "Experience with the family vehicles and trucks common in Central neighborhoods.",
      "System X ceramic coating tiers engineered for Louisiana UV and humidity.",
      "Flexible scheduling that works around school, work, and family routines.",
    ],
    neighborhoods:
      "We regularly service Greenwell Springs Road, Sullivan Road, Hooper Road, the Wax Road area, and the residential streets out toward the Central / Livingston Parish border. Whether you're near Greenwell Springs, off Sullivan, or out toward Hooper, our mobile team comes to you.",
    surroundingParagraph: "central-link",
    lat: 30.5527,
    lng: -91.0357,
  },
];

export const LOCATION_PAGES_BY_SLUG: Record<string, LocationPageConfig> = Object.fromEntries(
  LOCATION_PAGES.map((p) => [p.slug, p])
);
