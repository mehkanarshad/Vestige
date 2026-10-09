import { SkinAnalysisComparison } from "@/types";
import { formatDate } from "@/lib/utils";

interface SkinChangeCardProps {
  comparison: SkinAnalysisComparison | null;
}

export function SkinChangeCard({ comparison }: SkinChangeCardProps) {
  const latestTrendDate = comparison?.trajectory
    .at(-1)?.observations.at(-1)?.capturedAt;

  return (
    <section className="mt-6 rounded-lg border border-vestige-sand bg-white p-5">
      <p className="caption mb-1">Skin analysis trend</p>
      {!comparison ? (
        <p className="font-sans text-sm text-vestige-bark">
          This is your first fresh analysis. Changes will appear after your next session.
        </p>
      ) : comparison.trajectory.length === 0 ? (
        <p className="font-sans text-sm text-vestige-bark">
          There are no concern scores shared across these analyses to compare.
        </p>
      ) : (
        <>
          <p className="font-sans text-xs text-vestige-stone mb-4">
            Estimated concern trajectory through{" "}
            {formatDate(latestTrendDate ?? comparison.previousCapturedAt)}
          </p>
          <div className="divide-y divide-vestige-sand/70">
            {comparison.trajectory.map((signal) => {
              const delta = signal.deltaPercentagePoints;
              const relativeChange = signal.relativePercentageChange;
              return (
                <div
                  key={signal.key}
                  className="flex items-center justify-between gap-4 py-2.5 font-sans text-sm"
                >
                  <span className="text-vestige-ink">{signal.label}</span>
                  <span className="text-right text-vestige-bark">
                    {(signal.firstScore * 100).toFixed(1)}% →{" "}
                    {(signal.currentScore * 100).toFixed(1)}%{" "}
                    <span className="whitespace-nowrap">
                      ({delta > 0 ? "+" : ""}{delta.toFixed(1)} pp
                      {relativeChange === null
                        ? ""
                        : `, ${relativeChange > 0 ? "+" : ""}${relativeChange.toFixed(1)}%`}
                      ; {signal.observations.length} analyses)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-4 border-t border-vestige-sand pt-3 font-sans text-[11px] leading-relaxed text-vestige-stone">
        Percent change is relative to the first available estimate; pp means
        percentage points. These automated estimates are not a diagnosis or proof
        of improvement. Lighting, photo angle, and other conditions can change scores.
      </p>
    </section>
  );
}
