export const GUIDE_PUBLISH_DATE = "2026-11-07";
export const GUIDES_INDEX = { path: "/guides", title: "Car & Boat Care Guides | AV Detailing", description: "Explore practical car and boat care guidance: ceramic coating vs wax, lovebug removal, gelcoat oxidation and when to schedule a detail." };
export interface CareGuide {
  path: string; title: string; description: string; h1: string; intro: string;
  photo: "car" | "paint" | "boat";
  sections: { heading: string; paragraphs: string[] }[];
  links: { href: string; text: string }[];
  sources: { href: string; text: string }[];
}
export const CARE_GUIDES: CareGuide[] = [
  {
    path: "/guides/ceramic-coating-vs-wax", title: "Ceramic Coating vs Wax: Car Care Guide | AV Detailing",
    description: "Compare wax and ceramic coating, general longevity and maintenance needs. Explore Baton Rouge coating options and vehicle-size pricing.",
    h1: "Ceramic coating vs wax", photo: "paint",
    intro: "Wax and ceramic coating are different ways to protect a finish. The right choice depends on the surface, your maintenance routine and how you use the vehicle.",
    sections: [
      { heading: "Different types of protection", paragraphs: ["Wax leaves a protective layer on the surface and needs periodic renewal. A ceramic coating forms a bonded protective layer. Neither repairs existing defects, replaces washing or makes paint scratch-proof."] },
      { heading: "Longevity is not a guarantee", paragraphs: ["Ceramic coatings generally remain in place longer than conventional wax. Actual longevity depends on the product, preparation, exposure and ongoing care. A named coating term is not a promise that every finish will look the same throughout that time."] },
      { heading: "Maintenance still matters", paragraphs: ["Wash with products suitable for your vehicle and follow the protection product’s care directions. Remove contamination carefully rather than scrubbing harder. Confirm any curing or aftercare instructions before washing a newly coated vehicle."] },
      { heading: "Choosing a service in Baton Rouge", paragraphs: ["AV Detailing offers System X ceramic coating in 3-Year, 6-Year and 10-Year options. Paint condition should be assessed first; correction scope is quoted separately. Compare the options and cost guide before booking, and confirm preparation and timing for your vehicle."] },
    ],
    links: [{ href: "/ceramic-coating-baton-rouge", text: "Ceramic coating options" }, { href: "/ceramic-coating-cost-baton-rouge", text: "Ceramic coating cost by vehicle size" }, { href: "/paint-correction-baton-rouge", text: "Paint correction assessment" }],
    sources: [{ href: "https://www.ace.aaa.com/automotive/advocacy/how-to-wax-your-car.html", text: "AAA: waxing your car" }, { href: "https://systemx.com/pages/aftercare", text: "System X: coating aftercare" }],
  },
  {
    path: "/guides/remove-lovebugs-car-paint", title: "Removing Lovebugs from Car Paint | AV Detailing",
    description: "Gentle lovebug-removal tips for Louisiana’s May and September seasons. Know when to stop scrubbing and consider an exterior detail.",
    h1: "Removing lovebugs from car paint", photo: "car",
    intro: "Louisiana drivers often encounter lovebugs around May and September. Seasonal timing varies with local conditions, so check the front of your vehicle after trips rather than relying only on the calendar.",
    sections: [
      { heading: "Start gently, while the surface is cool", paragraphs: ["Park out of direct sun and let the panels cool. Rinse away loose dirt before touching the paint. Use a cleaner intended for automotive finishes, following the label and the vehicle or coating care instructions."] },
      { heading: "Soften residue instead of scraping", paragraphs: ["Allow suitable wash solution to soften residue as directed, without letting it dry on the panel. Use a clean, soft wash material and gentle pressure. Rinse thoroughly. Avoid dry scraping, abrasive pads, household solvents and unverified home remedies."] },
      { heading: "Know when to stop", paragraphs: ["If residue will not release easily, or the finish feels rough or looks marked after washing, do not keep increasing pressure. Cleaning can remove residue but may not remove an existing mark or etched area. Have the finish assessed before stronger treatment."] },
      { heading: "When to book an exterior detail", paragraphs: ["Consider an exterior detail when buildup is widespread, difficult to remove safely or beyond the cleaning you want to handle yourself. Tell AV Detailing about the buildup and any coating already on the vehicle. Exterior service and any separate add-on scope can then be confirmed."] },
    ],
    links: [{ href: "/exterior-detailing-baton-rouge", text: "Exterior car detailing" }, { href: "/car-detailing-baton-rouge", text: "Compare car detailing packages" }],
    sources: [{ href: "https://gardeningsolutions.ifas.ufl.edu/design/gardening-with-wildlife/lovebugs/", text: "UF/IFAS: lovebugs and seasonal activity" }, { href: "https://exchange.aaa.com/wp-content/uploads/2017/05/ATU_Car_Cleaning_Detailing_External.pdf", text: "AAA: car cleaning and detailing guidance" }],
  },
  {
    path: "/guides/boat-oxidation-gelcoat-care", title: "Boat Oxidation & Gelcoat Care Guide | AV Detailing",
    description: "Recognize dull or chalky gelcoat and learn general boat-care guidance for Louisiana sun. Explore gelcoat assessment and marine detailing options.",
    h1: "Boat oxidation and gelcoat care", photo: "boat",
    intro: "Sun and exposure can weather a boat’s gelcoat. A dull surface is a reason to inspect the finish, not proof that every boat needs the same polishing or protection treatment.",
    sections: [
      { heading: "Signs worth checking", paragraphs: ["Reduced gloss, fading, a chalky appearance or uneven-looking areas may indicate oxidation or weathering. Dirt and other surface deposits can also affect appearance. Clean gently and assess the finish before choosing a correction process."] },
      { heading: "Routine care in Louisiana sun", paragraphs: ["Use a mild cleaner suitable for the boat’s surface and follow the manufacturer’s directions. Rinse away residue and avoid letting cleaner dry on hot gelcoat. Shade or a suitable cover can limit exposure when practical; cover use should follow the boat maker’s guidance."] },
      { heading: "Do not jump straight to aggressive correction", paragraphs: ["Different finishes and degrees of weathering need different approaches. Avoid repeated abrasive treatment without knowing the surface condition. Deep damage, cracks or persistent discoloration may need assessment beyond routine cleaning; restoration results depend on the finish."] },
      { heading: "Discuss scope and access before service", paragraphs: ["AV Detailing offers boat detailing, gelcoat assessment and separately quoted System X boat ceramic coating. That coating is separate from the ceramic sealant in Premium Detail. For hull cleaning, the boat must be on a trailer or lift; in-water cleaning is not offered. Describe the boat, condition and access when arranging service."] },
    ],
    links: [{ href: "/gelcoat-restoration-baton-rouge", text: "Gelcoat restoration assessment" }, { href: "/boat-detailing-baton-rouge", text: "Boat detailing packages" }, { href: "/boat-ceramic-coating-baton-rouge", text: "Boat ceramic coating quotes" }],
    sources: [{ href: "https://www.wetamarine.com/assets/Uploads/Care-and-upkeep-of-Gelcoats-2024.pdf", text: "Weta Marine: gelcoat care and upkeep" }],
  },
  {
    path: "/guides/how-often-detail-car", title: "How Often Should You Detail Your Car? | AV Detailing",
    description: "Use vehicle condition, driving and exposure to plan car detailing. Compare Baton Rouge packages and recurring maintenance memberships.",
    h1: "How often should you detail your car?", photo: "car",
    intro: "There is no single detailing interval for every vehicle. Regular washing and a more thorough detail serve different needs; let use, exposure and visible buildup guide your decisions.",
    sections: [
      { heading: "Check condition, not just the calendar", paragraphs: ["Road trips, outdoor parking, rain, bugs and daily use affect what needs attention. Inside, look for debris, spills, pet hair and areas that routine cleaning is not reaching. Address fresh spills and contamination promptly with surface-appropriate care."] },
      { heading: "Match the service to the work", paragraphs: ["A routine wash is not the same as deep interior cleaning, paint correction or coating preparation. Review package inclusions instead of assuming that every detail includes shampooing or every add-on. Describe the areas you want addressed before choosing a package."] },
      { heading: "Build a routine you can maintain", paragraphs: ["Follow your vehicle’s care instructions and any coating aftercare guidance. A recurring plan may help if you want scheduled maintenance, while occasional appointments may fit other vehicles. The appropriate scope still depends on condition."] },
      { heading: "Compare packages and memberships", paragraphs: ["AV Detailing’s car packages are Basic, Silver and Gold. Monthly, bi-weekly and weekly membership options are also available. Compare current inclusions and plan terms, and confirm the right starting service for your vehicle rather than assuming a membership replaces an initial detail."] },
    ],
    links: [{ href: "/car-detailing-baton-rouge", text: "Car detailing packages" }, { href: "/memberships", text: "Detailing memberships" }, { href: "/interior-detailing-baton-rouge", text: "Interior detailing inclusions" }],
    sources: [{ href: "https://exchange.aaa.com/wp-content/uploads/2017/05/ATU_Car_Cleaning_Detailing_External.pdf", text: "AAA: car cleaning and detailing guidance" }],
  },
];
const SITE = "https://avdetailing.net";
export function guideSchemas(guide: CareGuide) {
  return [
    { "@context": "https://schema.org", "@type": "Article", "@id": `${SITE}${guide.path}#article`, headline: guide.h1, description: guide.description, datePublished: GUIDE_PUBLISH_DATE, inLanguage: "en", author: { "@type": "Organization", name: "AV Detailing", "@id": `${SITE}/#business` }, publisher: { "@id": `${SITE}/#business` }, mainEntityOfPage: `${SITE}${guide.path}` },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` }, { "@type": "ListItem", position: 3, name: guide.h1, item: `${SITE}${guide.path}` }] },
  ];
}