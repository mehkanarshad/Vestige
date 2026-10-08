"use client";

import { OutfitRecommendation } from "@/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Image from "next/image";

interface OutfitCardProps {
  outfit: OutfitRecommendation;
  selected?: boolean;
  onClick?: () => void;
}

export function OutfitCard({ outfit, selected, onClick }: OutfitCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-5 transition-all duration-200 group",
        selected
          ? "border-vestige-espresso bg-white shadow-md ring-1 ring-vestige-espresso/20"
          : "border-vestige-sand bg-white/60 hover:border-vestige-bark hover:bg-white hover:shadow-sm"
      )}
      aria-pressed={selected}
    >
      {outfit.items[0]?.garmentImageUrl && (
        <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-vestige-sand">
          <Image
            src={outfit.items[0].garmentImageUrl}
            alt={outfit.items[0].name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      {/* Color palette strip */}
      <div className="flex gap-1 mb-4">
        {outfit.colorPalette.map((color, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Name + confidence */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-lg text-vestige-ink leading-tight">
          {outfit.name}
        </h3>
        <span className="flex-shrink-0 font-sans text-[10px] text-vestige-stone bg-vestige-sand px-2 py-0.5 rounded-full">
          {Math.round(outfit.confidence * 100)}% match
        </span>
      </div>

      <p className="font-sans text-xs text-vestige-bark leading-relaxed mb-3">
        {outfit.description}
      </p>

      {outfit.items[0]?.brand && (
        <p className="font-sans text-[11px] text-vestige-stone mb-2">
          {outfit.items[0].brand}
          {typeof outfit.items[0].price === "number" && (
            <> · {outfit.items[0].currency ?? ""} {outfit.items[0].price.toFixed(2)}</>
          )}
        </p>
      )}

      {outfit.items[0]?.attributes && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            outfit.items[0].attributes.style,
            outfit.items[0].attributes.silhouette,
            outfit.items[0].attributes.formality,
            outfit.items[0].attributes.texture,
          ].filter((value): value is string => Boolean(value)).map((attribute) => (
            <span
              key={attribute}
              className="font-sans text-[10px] text-vestige-bark bg-vestige-sand/60 px-2 py-0.5 rounded-sm"
            >
              {attribute}
            </span>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {outfit.items.map((item, i) => (
          <span
            key={i}
            className="font-sans text-[10px] text-vestige-bark bg-vestige-sand/60 px-2 py-0.5 rounded-sm"
          >
            {item.name}
          </span>
        ))}
      </div>

      {/* Personalized reason */}
      <div className="flex items-start gap-1.5 pt-3 border-t border-vestige-sand/60">
        <Sparkles className="h-3 w-3 text-vestige-gold flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[11px] text-vestige-bark italic leading-relaxed">
          {outfit.personalizedReason}
        </p>
      </div>
    </button>
  );
}
