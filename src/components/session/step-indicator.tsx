"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  "Photo",
  "Analysis",
  "Intention",
  "Outfits",
  "Try On",
  "Feedback",
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3" aria-label="Session progress">
      {/* Dots */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "step-dot h-1.5 rounded-full transition-all duration-300",
              i + 1 === current
                ? "step-dot-active bg-vestige-espresso w-8"
                : i + 1 < current
                ? "step-dot-done bg-vestige-bark w-4"
                : "step-dot-pending bg-vestige-sand w-4"
            )}
            aria-label={`Step ${i + 1}: ${STEPS[i]}${i + 1 === current ? " (current)" : i + 1 < current ? " (complete)" : ""}`}
          />
        ))}
      </div>
      {/* Label */}
      <span className="font-sans text-xs text-vestige-stone">
        {current} / {STEPS.length} — {STEPS[current - 1]}
      </span>
    </div>
  );
}
