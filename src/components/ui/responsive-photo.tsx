import { GALLERY_CARD_SIZES, type ResponsivePhoto as Photo } from "@/lib/gallery-images";

interface Props {
  photo: Photo;
  alt: string;
  className?: string;
  sizes?: string;
}

/** Lazy, dimensioned picture with AVIF → WebP fallback for existing photos. */
export function ResponsivePhoto({ photo, alt, className, sizes = GALLERY_CARD_SIZES }: Props) {
  return (
    <picture>
      <source type="image/avif" srcSet={photo.avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={photo.webpSrcSet} sizes={sizes} />
      <img src={photo.src} alt={alt} className={className} loading="lazy" decoding="async" width={800} height={600} />
    </picture>
  );
}
