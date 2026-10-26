import { useEffect, useRef, useState } from "react";
import { GALLERY_CARD_SIZES, type ResponsivePhoto as Photo } from "@/lib/gallery-images";

/** Start fetching this far ahead of the viewport so photos are ready before they scroll in. */
export const PHOTO_PREFETCH_MARGIN = "1500px 0px";

interface Props {
  photo: Photo;
  alt: string;
  className?: string;
  sizes?: string;
}

/**
 * Lazy, dimensioned picture with AVIF → WebP fallback for existing photos.
 * Stays `loading="lazy"` at page start (nothing below the fold is fetched up
 * front), then switches to eager once the photo is within PHOTO_PREFETCH_MARGIN
 * of the viewport, so slow mobile connections get a head start.
 */
export function ResponsivePhoto({ photo, alt, className, sizes = GALLERY_CARD_SIZES }: Props) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (near || !el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setNear(true); },
      { rootMargin: PHOTO_PREFETCH_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  return (
    <picture>
      <source type="image/avif" srcSet={photo.avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={photo.webpSrcSet} sizes={sizes} />
      <img ref={ref} src={photo.src} alt={alt} className={className} loading={near ? "eager" : "lazy"} decoding="async" width={800} height={600} />
    </picture>
  );
}
