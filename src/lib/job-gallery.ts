/** Owner-confirmed real AV jobs; no inferred location, coating or correction step. */
export const JOB_GALLERY = [
  { key: "car", vehicle: "Range Rover Biography", service: "Full detail", beforeKey: "carBefore", afterKey: "carAfter", assetStem: "car-detail" },
  { key: "paint", vehicle: "Porsche 911", service: "Paint correction", beforeKey: "paintBefore", afterKey: "paintAfter", assetStem: "paint-correction" },
  { key: "boat", vehicle: "Yacht", service: "Marine detail", beforeKey: "boatBefore", afterKey: "boatAfter", assetStem: "boat-detail" },
] as const;
export const GALLERY_INTRO = "These before-and-after photos show real AV Detailing jobs: a Range Rover Biography full detail, Porsche 911 paint correction and yacht marine detail. Each pair shows the same vehicle before and after the photographed service.";
export function jobForPage(path: string) {
  const key = ["/car-detailing-baton-rouge", "/mobile-car-detailing-baton-rouge", "/interior-detailing-baton-rouge", "/exterior-detailing-baton-rouge"].includes(path) ? "car"
    : ["/paint-correction-baton-rouge", "/ceramic-coating-baton-rouge"].includes(path) ? "paint"
    : ["/boat-detailing-baton-rouge", "/mobile-boat-detailing-baton-rouge", "/gelcoat-restoration-baton-rouge"].includes(path) ? "boat" : undefined;
  return JOB_GALLERY.find(job => job.key === key);
}
export const jobCaption = (job: typeof JOB_GALLERY[number]) => `${job.vehicle} · ${job.service}`;
export const jobAlt = (job: typeof JOB_GALLERY[number], stage: "before" | "after") => `${job.vehicle} ${stage} ${job.service.toLowerCase()} by AV Detailing`;