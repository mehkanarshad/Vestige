import { cn } from "@/lib/utils";
import Image from "next/image";

export type EditorialSubject =
  | "home-hero"
  | "wardrobe-rail"
  | "wardrobe-edit"
  | "session-context"
  | "profile-story"
  | "intention-story"
  | "catalog-context";

interface EditorialImageProps {
  subject: EditorialSubject;
  caption?: string;
  className?: string;
}

const PHOTOS: Record<EditorialSubject, { src: string; alt: string; imageClassName?: string }> = {
  "home-hero": {
    src: "/images/editorial/look-01.jpg",
    alt: "Warm editorial fashion portrait with soft amber light and dark tailoring",
  },
  "wardrobe-rail": {
    src: "/images/editorial/look-04.jpg",
    alt: "A carefully spaced rail of neutral garments in a warm, minimal studio",
  },
  "wardrobe-edit": {
    src: "/images/editorial/wardrobe-edit.jpg",
    alt: "A considered edit of warm-toned clothing on a bright boutique rail",
  },
  "session-context": {
    src: "/images/editorial/portrait-warm.jpg",
    alt: "A close portrait in warm amber light, representing the photo context for a styling session",
  },
  "profile-story": {
    src: "/images/editorial/brown-editorial.jpg",
    alt: "A relaxed olive knit outfit in a soft outdoor setting",
    imageClassName: "saturate-[.72] brightness-[1.03]",
  },
  "intention-story": {
    src: "/images/editorial/wood-editorial.jpg",
    alt: "Soft beige and cream fabrics with a close view of their natural textures",
  },
  "catalog-context": {
    src: "/images/editorial/boutique-warm.jpg",
    alt: "A warm boutique interior with a considered clothing display",
  },
};

export function EditorialImage({
  subject,
  caption,
  className,
}: EditorialImageProps) {
  const photo = PHOTOS[subject];

  return (
    <div
      className={cn(
        "relative aspect-[3/2] overflow-hidden select-none bg-vestige-parchment",
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
        className={cn("object-cover", photo.imageClassName)}
      />

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
