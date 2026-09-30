/**
 * EditorialImage — the visual stand-in for real fashion photography.
 *
 * Design intent: these should feel like crops from a lookbook, not grey boxes.
 * Each variant has a distinct tonal composition — light, mid, and deep — so
 * a grid of them reads as varied, not repetitive.
 *
 * When real photography is available, swap the inner content for an <Image />.
 * The outer shell (aspect ratio, rounding, overflow) stays identical.
 */
import { cn } from "@/lib/utils";

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

/**
 * Six tonal compositions — each is a pair of warm-neutral stops
 * that produce the illusion of fabric texture and depth.
 * They intentionally look like desaturated fashion photography.
 */
const COMPOSITIONS: {
  bg: string;
  grain: string;
  vignette: string;
}[] = [
  // 0 — light ivory: editorial white paper
  {
    bg:       "bg-gradient-to-br from-[#EDE8E0] via-[#E0D8CE] to-[#D0C8BC]",
    grain:    "opacity-[0.055]",
    vignette: "from-[#C4B8AA]/30",
  },
  // 1 — warm sand: midday studio
  {
    bg:       "bg-gradient-to-tl from-[#D8CCB8] via-[#C8BC A8] to-[#B8AC98]",
    grain:    "opacity-[0.06]",
    vignette: "from-[#A89880]/40",
  },
  // 2 — pale stone: overcast diffuse
  {
    bg:       "bg-gradient-to-br from-[#D4CEC8] via-[#C8C2BA] to-[#BCB4AA]",
    grain:    "opacity-[0.05]",
    vignette: "from-[#A0988E]/25",
  },
  // 3 — deep umber: late-light warmth
  {
    bg:       "bg-gradient-to-bl from-[#6A5848] via-[#584840] to-[#483830]",
    grain:    "opacity-[0.07]",
    vignette: "from-[#30201800]/0",
  },
  // 4 — charcoal: fashion week backstage
  {
    bg:       "bg-gradient-to-tr from-[#302820] via-[#3C3028] to-[#281E18]",
    grain:    "opacity-[0.08]",
    vignette: "from-[#18100800]/0",
  },
  // 5 — blush clay: warm skin tones
  {
    bg:       "bg-gradient-to-br from-[#DCC8B8] via-[#C8B4A4] to-[#B8A090]",
    grain:    "opacity-[0.055]",
    vignette: "from-[#A08878]/30",
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
  const comp = COMPOSITIONS[(dark ? 3 + (variant % 3) : variant) % COMPOSITIONS.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none",
        ASPECT[aspect],
        comp.bg,
        className
      )}
      aria-hidden={!caption}
      aria-label={caption}
      role={caption ? "img" : undefined}
    >
      {/* Film grain — mimics photo texture */}
      <div
        aria-hidden
        className={cn("absolute inset-0 pointer-events-none", comp.grain)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Directional vignette — adds depth, looks like studio lighting falloff */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 pointer-events-none",
          "bg-gradient-to-t to-transparent",
          comp.vignette
        )}
      />

      {/* Subtle inner border — like a matte */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(26,23,20,0.06)" }}
      />

      {/* Optional large editorial overlay text */}
      {overlayText && (
        <div className="absolute inset-0 flex items-end p-5">
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
