"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  className?: string;
  gold?: boolean;
}

export function ProgressBar({ value, label, className, gold }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="t-body-sm text-vestige-bark">{label}</span>
          <span className="t-label text-vestige-stone">{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-px bg-vestige-sand rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out-expo",
            gold
              ? "bg-gradient-to-r from-vestige-gold to-vestige-gold-light"
              : "bg-vestige-bark"
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
