/**
 * Responsive delivery for the existing gallery photos. Variants are resized
 * copies of the original files in src/assets/gallery (same photo, aspect and
 * framing; no retouching). Cards never reference the multi-MB originals.
 */
import carAfterAvif400 from "@/assets/optimized/gallery-car-detail-after-400.avif";
import carAfterAvif800 from "@/assets/optimized/gallery-car-detail-after-800.avif";
import carAfterAvif1200 from "@/assets/optimized/gallery-car-detail-after-1200.avif";
import carAfterWebp400 from "@/assets/optimized/gallery-car-detail-after-400.webp";
import carAfterWebp800 from "@/assets/optimized/gallery-car-detail-after-800.webp";
import carAfterWebp1200 from "@/assets/optimized/gallery-car-detail-after-1200.webp";
import carBeforeAvif400 from "@/assets/optimized/gallery-car-detail-before-400.avif";
import carBeforeAvif800 from "@/assets/optimized/gallery-car-detail-before-800.avif";
import carBeforeWebp400 from "@/assets/optimized/gallery-car-detail-before-400.webp";
import carBeforeWebp800 from "@/assets/optimized/gallery-car-detail-before-800.webp";
import boatAfterAvif400 from "@/assets/optimized/gallery-boat-detail-after-400.avif";
import boatAfterAvif800 from "@/assets/optimized/gallery-boat-detail-after-800.avif";
import boatAfterWebp400 from "@/assets/optimized/gallery-boat-detail-after-400.webp";
import boatAfterWebp800 from "@/assets/optimized/gallery-boat-detail-after-800.webp";
import boatBeforeAvif400 from "@/assets/optimized/gallery-boat-detail-before-400.avif";
import boatBeforeAvif800 from "@/assets/optimized/gallery-boat-detail-before-800.avif";
import boatBeforeWebp400 from "@/assets/optimized/gallery-boat-detail-before-400.webp";
import boatBeforeWebp800 from "@/assets/optimized/gallery-boat-detail-before-800.webp";
import paintAfterAvif400 from "@/assets/optimized/gallery-paint-correction-after-400.avif";
import paintAfterAvif800 from "@/assets/optimized/gallery-paint-correction-after-800.avif";
import paintAfterWebp400 from "@/assets/optimized/gallery-paint-correction-after-400.webp";
import paintAfterWebp800 from "@/assets/optimized/gallery-paint-correction-after-800.webp";
import paintBeforeAvif400 from "@/assets/optimized/gallery-paint-correction-before-400.avif";
import paintBeforeAvif800 from "@/assets/optimized/gallery-paint-correction-before-800.avif";
import paintBeforeWebp400 from "@/assets/optimized/gallery-paint-correction-before-400.webp";
import paintBeforeWebp800 from "@/assets/optimized/gallery-paint-correction-before-800.webp";

export interface ResponsivePhoto {
  avifSrcSet: string;
  webpSrcSet: string;
  /** Fallback for browsers without srcset/picture: a mid-size WebP, never the original. */
  src: string;
}

/** Cards: 1 column on phones, 2 from md, 3 (~400px) from lg inside container-custom. */
export const GALLERY_CARD_SIZES = "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw";

const set = (pairs: Array<[string, number]>) => pairs.map(([u, w]) => `${u} ${w}w`).join(", ");

function photo(avif: Array<[string, number]>, webp: Array<[string, number]>): ResponsivePhoto {
  return { avifSrcSet: set(avif), webpSrcSet: set(webp), src: webp.find(([, w]) => w === 800)?.[0] ?? webp[0][0] };
}

export const GALLERY_PHOTOS = {
  carAfter: photo(
    [[carAfterAvif400, 400], [carAfterAvif800, 800], [carAfterAvif1200, 1200]],
    [[carAfterWebp400, 400], [carAfterWebp800, 800], [carAfterWebp1200, 1200]],
  ),
  carBefore: photo([[carBeforeAvif400, 400], [carBeforeAvif800, 800]], [[carBeforeWebp400, 400], [carBeforeWebp800, 800]]),
  boatAfter: photo([[boatAfterAvif400, 400], [boatAfterAvif800, 800]], [[boatAfterWebp400, 400], [boatAfterWebp800, 800]]),
  boatBefore: photo([[boatBeforeAvif400, 400], [boatBeforeAvif800, 800]], [[boatBeforeWebp400, 400], [boatBeforeWebp800, 800]]),
  paintAfter: photo([[paintAfterAvif400, 400], [paintAfterAvif800, 800]], [[paintAfterWebp400, 400], [paintAfterWebp800, 800]]),
  paintBefore: photo([[paintBeforeAvif400, 400], [paintBeforeAvif800, 800]], [[paintBeforeWebp400, 400], [paintBeforeWebp800, 800]]),
} satisfies Record<string, ResponsivePhoto>;
