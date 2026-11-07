import aircraftHangaravif400 from "../assets/approved-jobs/aircraft-hangar-citation-400.avif.asset.json";
import aircraftHangaravif800 from "../assets/approved-jobs/aircraft-hangar-citation-800.avif.asset.json";
import aircraftHangaravif1200 from "../assets/approved-jobs/aircraft-hangar-citation-1200.avif.asset.json";
import aircraftHangarwebp400 from "../assets/approved-jobs/aircraft-hangar-citation-400.webp.asset.json";
import aircraftHangarwebp800 from "../assets/approved-jobs/aircraft-hangar-citation-800.webp.asset.json";
import aircraftHangarwebp1200 from "../assets/approved-jobs/aircraft-hangar-citation-1200.webp.asset.json";
import aircraftDetailavif400 from "../assets/approved-jobs/aircraft-citation-detail-400.avif.asset.json";
import aircraftDetailavif800 from "../assets/approved-jobs/aircraft-citation-detail-800.avif.asset.json";
import aircraftDetailavif1200 from "../assets/approved-jobs/aircraft-citation-detail-1200.avif.asset.json";
import aircraftDetailwebp400 from "../assets/approved-jobs/aircraft-citation-detail-400.webp.asset.json";
import aircraftDetailwebp800 from "../assets/approved-jobs/aircraft-citation-detail-800.webp.asset.json";
import aircraftDetailwebp1200 from "../assets/approved-jobs/aircraft-citation-detail-1200.webp.asset.json";
import rvFoamavif400 from "../assets/approved-jobs/rv-foam-wash-400.avif.asset.json";
import rvFoamavif800 from "../assets/approved-jobs/rv-foam-wash-800.avif.asset.json";
import rvFoamavif1200 from "../assets/approved-jobs/rv-foam-wash-1200.avif.asset.json";
import rvFoamwebp400 from "../assets/approved-jobs/rv-foam-wash-400.webp.asset.json";
import rvFoamwebp800 from "../assets/approved-jobs/rv-foam-wash-800.webp.asset.json";
import rvFoamwebp1200 from "../assets/approved-jobs/rv-foam-wash-1200.webp.asset.json";
import boatSideavif400 from "../assets/approved-jobs/boat-renaissance-prowler-side-400.avif.asset.json";
import boatSideavif800 from "../assets/approved-jobs/boat-renaissance-prowler-side-800.avif.asset.json";
import boatSideavif1200 from "../assets/approved-jobs/boat-renaissance-prowler-side-1200.avif.asset.json";
import boatSidewebp400 from "../assets/approved-jobs/boat-renaissance-prowler-side-400.webp.asset.json";
import boatSidewebp800 from "../assets/approved-jobs/boat-renaissance-prowler-side-800.webp.asset.json";
import boatSidewebp1200 from "../assets/approved-jobs/boat-renaissance-prowler-side-1200.webp.asset.json";
import boatBowavif400 from "../assets/approved-jobs/boat-renaissance-prowler-bow-400.avif.asset.json";
import boatBowavif800 from "../assets/approved-jobs/boat-renaissance-prowler-bow-800.avif.asset.json";
import boatBowavif1200 from "../assets/approved-jobs/boat-renaissance-prowler-bow-1200.avif.asset.json";
import boatBowwebp400 from "../assets/approved-jobs/boat-renaissance-prowler-bow-400.webp.asset.json";
import boatBowwebp800 from "../assets/approved-jobs/boat-renaissance-prowler-bow-800.webp.asset.json";
import boatBowwebp1200 from "../assets/approved-jobs/boat-renaissance-prowler-bow-1200.webp.asset.json";
import type { ResponsivePhoto } from "./gallery-images";
interface Pointer { url: string }
const makePhoto = (avif: Pointer[], webp: Pointer[]): ResponsivePhoto => ({
  avifSrcSet: avif.map((p, i) => `${p.url} ${[400, 800, 1200][i]}w`).join(", "),
  webpSrcSet: webp.map((p, i) => `${p.url} ${[400, 800, 1200][i]}w`).join(", "),
  src: webp[1].url,
});
/** Owner-approved uploads, resized only; intentional registration blurring is preserved. */
export const APPROVED_JOB_PHOTOS = [
  { key: "aircraftHangar", category: "Aircraft", vehicle: "Cessna Citation", service: "Private jet detail", alt: "Cessna Citation private jet detail in a hangar by AV Detailing in Baton Rouge", photo: makePhoto([aircraftHangaravif400, aircraftHangaravif800, aircraftHangaravif1200], [aircraftHangarwebp400, aircraftHangarwebp800, aircraftHangarwebp1200]) },
  { key: "aircraftDetail", category: "Aircraft", vehicle: "Cessna Citation", service: "Private jet detail", alt: "Cessna Citation private jet detail, hangar view, by AV Detailing in Baton Rouge", photo: makePhoto([aircraftDetailavif400, aircraftDetailavif800, aircraftDetailavif1200], [aircraftDetailwebp400, aircraftDetailwebp800, aircraftDetailwebp1200]) },
  { key: "rvFoam", category: "RVs", vehicle: "Motorhome", service: "Exterior foam wash", alt: "Motorhome exterior foam wash by AV Detailing in Baton Rouge", photo: makePhoto([rvFoamavif400, rvFoamavif800, rvFoamavif1200], [rvFoamwebp400, rvFoamwebp800, rvFoamwebp1200]) },
  { key: "boatSide", category: "Boats", vehicle: "Renaissance Prowler 31", service: "Boat detail", alt: "Renaissance Prowler 31 boat detail on a trailer, side view, by AV Detailing in Baton Rouge", photo: makePhoto([boatSideavif400, boatSideavif800, boatSideavif1200], [boatSidewebp400, boatSidewebp800, boatSidewebp1200]) },
  { key: "boatBow", category: "Boats", vehicle: "Renaissance Prowler 31", service: "Boat detail", alt: "Renaissance Prowler 31 boat detail on a trailer, bow view, by AV Detailing in Baton Rouge", photo: makePhoto([boatBowavif400, boatBowavif800, boatBowavif1200], [boatBowwebp400, boatBowwebp800, boatBowwebp1200]) }
] as const;
export const approvedPhotoCaption = (p: typeof APPROVED_JOB_PHOTOS[number]) => `${p.vehicle} · ${p.service}`;
export const APPROVED_PHOTO_PAGES = {
  aircraft: ["/aircraft-detailing-baton-rouge", "/aircraft-cleaning-baton-rouge", "/aircraft-interior-detailing-baton-rouge", "/aircraft-paint-protection-baton-rouge"],
  rv: ["/rv-detailing-baton-rouge", "/mobile-rv-detailing-baton-rouge", "/rv-oxidation-removal-baton-rouge", "/rv-roof-cleaning-baton-rouge", "/rv-ceramic-coating-baton-rouge"],
  boat: ["/boat-detailing-baton-rouge", "/mobile-boat-detailing-baton-rouge", "/boat-ceramic-coating-baton-rouge", "/hull-cleaning-baton-rouge", "/pontoon-cleaning-baton-rouge", "/gelcoat-restoration-baton-rouge"],
};
export function approvedPhotosForPage(path: string) {
  return APPROVED_PHOTO_PAGES.aircraft.includes(path) ? APPROVED_JOB_PHOTOS.filter(p => p.category === "Aircraft")
    : APPROVED_PHOTO_PAGES.rv.includes(path) ? APPROVED_JOB_PHOTOS.filter(p => p.category === "RVs")
    : APPROVED_PHOTO_PAGES.boat.includes(path) ? APPROVED_JOB_PHOTOS.filter(p => p.category === "Boats") : [];
}
