import { SkinSummary } from "@/types";

const TONE_SWATCHES: Record<string, string> = {
  light: "#F5E6D3",
  "light-medium": "#E8C9A0",
  medium: "#C9956A",
  "medium-deep": "#A0674A",
  deep: "#6B3A2A",
  rich: "#3D1F12",
};

const UNDERTONE_LABELS: Record<string, { label: string; hint: string }> = {
  warm: { label: "Warm", hint: "Golden, peachy, or yellow hues" },
  cool: { label: "Cool", hint: "Pink, red, or bluish hues" },
  neutral: { label: "Neutral", hint: "A mix of warm and cool" },
  olive: { label: "Olive", hint: "Greenish or muted golden hues" },
};

export function SkinSummaryCard({ summary }: { summary: SkinSummary }) {
  const swatch = summary.toneColor ?? TONE_SWATCHES[summary.tone] ?? TONE_SWATCHES["medium"];
  const undertone = UNDERTONE_LABELS[summary.undertone] ?? {
    label: summary.undertone,
    hint: "",
  };

  return (
    <div className="vestige-card space-y-5">
      {/* Tone + undertone */}
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundColor: swatch }}
          aria-label={`Skin tone: ${summary.tone}`}
        />
        <div>
          <p className="caption mb-1">Skin tone</p>
          <p className="font-serif text-xl text-vestige-ink capitalize">
            {summary.tone}
          </p>
          <p className="font-sans text-xs text-vestige-bark mt-0.5">
            {summary.undertone === "not assessed"
              ? "Undertone not assessed"
              : `Estimated ${undertone.label.toLowerCase()} undertone — ${undertone.hint}`}
          </p>
          {summary.undertone !== "not assessed" && (
            <p className="font-sans text-[10px] text-vestige-stone mt-1">
              Estimated from measured skin color; lighting can affect it.
            </p>
          )}
        </div>
      </div>

      {/* Skin type */}
      <div>
        <p className="caption mb-1.5">Skin type</p>
        <span className="inline-block font-sans text-xs text-vestige-bark bg-vestige-sand px-3 py-1 rounded-sm capitalize">
          {summary.skinType}
        </span>
      </div>

      {/* Concerns */}
      {summary.concerns.length > 0 && (
        <div>
          <p className="caption mb-1.5">Noted concerns</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.concerns.map((c) => (
              <span
                key={c}
                className="font-sans text-xs text-vestige-bark bg-vestige-sand/80 px-2.5 py-1 rounded-sm capitalize"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Color guidance */}
      <div className="pt-3 border-t border-vestige-sand">
        <p className="caption mb-1.5">Color guidance</p>
        <p className="font-sans text-xs text-vestige-bark leading-relaxed">
          {summary.undertone === "not assessed"
            ? "A color sample was not available to estimate undertone."
            : summary.undertone === "warm"
            ? "Earth tones, warm neutrals, and rich terracottas will complement your complexion beautifully."
            : summary.undertone === "cool"
            ? "Jewel tones, cool grays, and true whites will harmonize with your undertone."
            : summary.undertone === "olive"
            ? "Muted earth tones, olive greens, deep teals, and balanced neutrals can complement your complexion."
            : "You have the versatility to wear both warm and cool palettes — soft neutrals are especially flattering."}
        </p>
      </div>
    </div>
  );
}
