/** Locally hosted lookbook photography with consistent aspect ratios and overlays. */
import { cn } from "@/lib/utils";
import Image from "next/image";

export type ImageAspect = "portrait" | "landscape" | "square" | "wide" | "story";
export type ImageVariant = 0 | 1 | 2 | 3 | 4 | 5;

interface EditorialImageProps {
  aspect?: ImageAspect;
  variant?: ImageVariant;
  caption?: string;
  overlayText?: string; // large editorial text overlaid on the image
  className?: string;
  dark?: boolean; // forces a darker tonal range
}

/** Aspect ratio map */
const ASPECT: Record<ImageAspect, string> = {
  portrait:  "aspect-[2/3]",
  landscape: "aspect-[3/2]",
  square:    "aspect-square",
  wide:      "aspect-[16/9]",
  story:     "aspect-[9/16]",
};

const PHOTOS = [
  {
    src: "/images/editorial/look-01.jpg",
    alt: "Model wearing a warm-toned street-style outfit",
  },
  {
    src: "/images/editorial/look-02.jpg",
    alt: "Editorial fashion look in muted seasonal colors",
  },
  {
    src: "/images/editorial/look-03.jpg",
    alt: "A polished, contemporary outfit styled for the street",
  },
  {
    src: "/images/editorial/look-04.jpg",
    alt: "A curated collection of wardrobe pieces in neutral tones",
  },
  {
    src: "/images/editorial/look-05.jpg",
    alt: "Model in a considered seasonal look",
  },
  {
    src: "/images/editorial/look-06.jpg",
    alt: "Close beauty portrait with natural makeup",
  },
];

export function EditorialImage({
  aspect = "portrait",
  variant = 0,
  caption,
  overlayText,
  className,
  dark,
}: EditorialImageProps) {
  const photo = PHOTOS[dark ? 3 + (variant % 3) : variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none bg-vestige-parchment",
        ASPECT[aspect],
        className
      )}
      role="img"
      aria-label={caption ?? photo.alt}
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className={cn("object-cover", dark && "brightness-90")}
      />

      {/* Optional large editorial overlay text */}
      {overlayText && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-vestige-ink/30 to-transparent p-5">
          <span
            className="font-serif leading-none text-vestige-cream/25 pointer-events-none"
            style={{ fontSize: "clamp(2rem, 8vw, 4rem)", fontWeight: 700 }}
          >
            {overlayText}
          </span>
        </div>
      )}

      {/* Caption badge */}
      {caption && (
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-block t-label-sm text-vestige-cream/80 bg-vestige-ink/40 backdrop-blur-sm px-2 py-1">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Legacy alias — keeps existing pages that import PhotoPlaceholder working.
 */
interface PhotoPlaceholderProps {
  aspect?: "portrait" | "landscape" | "square";
  label?: string;
  index?: number;
  className?: string;
}

export function PhotoPlaceholder({ aspect = "portrait", label, index = 0, className }: PhotoPlaceholderProps) {
  return (
    <EditorialImage
      aspect={aspect}
      variant={(index % 6) as ImageVariant}
      caption={label}
      className={className}
    />
  );
}
