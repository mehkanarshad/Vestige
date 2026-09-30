"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { Spinner } from "@/components/ui/spinner";
import { OutfitRecommendation } from "@/types";

export default function TryOnStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    selectedOutfit,
    recommendations,
    setSelectedOutfit,
    setTryOnImageUrl,
    tryOnImageUrl,
    photoPreview,
  } = useSessionStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeOutfit, setActiveOutfit] = useState<OutfitRecommendation | null>(
    selectedOutfit
  );

  useEffect(() => {
    if (!activeOutfit && recommendations.length > 0) {
      setActiveOutfit(recommendations[0]);
    }
  }, [recommendations, activeOutfit]);

  useEffect(() => {
    if (activeOutfit && !tryOnImageUrl) {
      triggerTryOn(activeOutfit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOutfit]);

  async function triggerTryOn(outfit: OutfitRecommendation) {
    setLoading(true);
    setError("");

    // Get the primary top garment for VTO
    const topItem =
      outfit.items.find((i) => i.category === "top" || i.category === "dress") ??
      outfit.items[0];

    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          outfitId: outfit.id,
          garmentImageUrl:
            topItem.garmentImageUrl ??
            `https://placehold.co/400x600/C4B8A8/3D2B1F?text=${encodeURIComponent(topItem.name)}`,
          garmentCategory: topItem.category,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Try-on failed");
      }

      const { tryOnImageUrl: url } = await res.json();
      setTryOnImageUrl(url);
      setSelectedOutfit(outfit);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Try-on failed.");
    } finally {
      setLoading(false);
    }
  }

  function switchOutfit(outfit: OutfitRecommendation) {
    if (outfit.id === activeOutfit?.id) return;
    setActiveOutfit(outfit);
    setTryOnImageUrl("");
    triggerTryOn(outfit);
  }

  const displayUrl = tryOnImageUrl || photoPreview;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <StepIndicator current={5} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          Try it on
        </h1>
        <p className="body-lg text-sm">
          See how the outfit looks on you. Switch between looks below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* VTO preview */}
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-vestige-sand border border-vestige-sand shadow-sm">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-vestige-cream/80 z-10">
              <Spinner className="h-6 w-6 text-vestige-bark" />
              <p className="font-sans text-xs text-vestige-stone">
                Compositing look…
              </p>
            </div>
          )}
          {displayUrl && (
            <Image
              src={displayUrl}
              alt={activeOutfit ? `Try-on: ${activeOutfit.name}` : "Try-on preview"}
              fill
              className="object-cover"
              unoptimized
            />
          )}
          {!displayUrl && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-sans text-xs text-vestige-stone">
                Preview will appear here
              </p>
            </div>
          )}
          {activeOutfit && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-vestige-ink/60 to-transparent">
              <p className="font-serif text-white text-lg">
                {activeOutfit.name}
              </p>
            </div>
          )}
        </div>

        {/* Outfit details + switcher */}
        <div className="flex flex-col gap-4">
          {activeOutfit && (
            <>
              <div>
                <p className="caption mb-1">Wearing</p>
                <h2 className="font-serif text-2xl text-vestige-ink mb-2">
                  {activeOutfit.name}
                </h2>
                <p className="font-sans text-xs text-vestige-bark leading-relaxed">
                  {activeOutfit.description}
                </p>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {activeOutfit.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-vestige-sand last:border-0"
                  >
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0 border border-white/40"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-sans text-xs text-vestige-ink font-medium">
                        {item.name}
                      </p>
                      <p className="font-sans text-[10px] text-vestige-stone capitalize">
                        {item.category} · {item.color}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Color palette */}
              <div className="flex gap-1">
                {activeOutfit.colorPalette.map((c, i) => (
                  <div
                    key={i}
                    className="h-6 flex-1 rounded-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </>
          )}

          {/* Switch outfits */}
          {recommendations.length > 1 && (
            <div>
              <p className="caption mb-2">Switch look</p>
              <div className="flex flex-col gap-2">
                {recommendations.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => switchOutfit(outfit)}
                    disabled={loading}
                    className={`text-left px-3 py-2 rounded-sm border text-xs font-sans transition-colors ${
                      activeOutfit?.id === outfit.id
                        ? "border-vestige-espresso text-vestige-espresso bg-vestige-sand/50"
                        : "border-vestige-sand text-vestige-bark hover:border-vestige-bark"
                    }`}
                  >
                    {outfit.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="font-sans text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => router.push(`/session/${id}/recommend`)}
          className="btn-secondary text-sm gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => router.push(`/session/${id}/feedback`)}
          className="btn-primary flex-1 text-sm gap-2"
        >
          Give feedback
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
