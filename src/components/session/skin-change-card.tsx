import { SkinAnalysisComparison } from "@/types";
import { formatDate } from "@/lib/utils";

interface SkinChangeCardProps {
  comparison: SkinAnalysisComparison | null;
}

export function SkinChangeCard({ comparison }: SkinChangeCardProps) {
  return (
    <section className="mt-6 rounded-lg border border-vestige-sand bg-white p-5">
      <p className="caption mb-1">Skin analysis trend</p>
      {!comparison ? (
        <p className="font-sans text-sm text-vestige-bark">
          This is your first fresh analysis. Changes will appear after your next session.
        </p>
      ) : comparison.changes.length === 0 ? (
        <p className="font-sans text-sm text-vestige-bark">
          There are no concern scores shared by both analyses to compare.
        </p>
      ) : (
        <>
          <p className="font-sans text-xs text-vestige-stone mb-4">
            Today compared with {formatDate(comparison.previousCapturedAt)}
          </p>
          <div className="divide-y divide-vestige-sand/70">
            {comparison.changes.map((change) => {
              const delta = change.deltaPercentagePoints;
              const value = `${delta > 0 ? "+" : ""}${delta.toFixed(1)} pp`;
              const direction = delta > 0
                ? "higher estimate"
                : delta < 0
                  ? "lower estimate"
                  : "no measured change";
              return (
                <div
                  key={change.key}
                  className="flex items-center justify-between gap-4 py-2.5 font-sans text-sm"
                >
                  <span className="text-vestige-ink">{change.label}</span>
                  <span className="text-right text-vestige-bark">
                    {(change.previousScore * 100).toFixed(1)}% →{" "}
                    {(change.currentScore * 100).toFixed(1)}%{" "}
                    <span className="whitespace-nowrap">({value}, {direction})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-4 border-t border-vestige-sand pt-3 font-sans text-[11px] leading-relaxed text-vestige-stone">
        These are automated concern estimates, not a diagnosis or proof of skin
        improvement. Lighting, photo angle, and other conditions can change the scores.
      </p>
    </section>
  );
}
