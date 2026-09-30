"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { OutfitCard } from "@/components/session/outfit-card";
import { Spinner } from "@/components/ui/spinner";
import { OutfitRecommendation } from "@/types";
import { capitalize } from "@/lib/utils";

export default function RecommendStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    skinSummary,
    intention,
    recommendations,
    setRecommendations,
    setSelectedOutfit,
  } = useSessionStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<OutfitRecommendation | null>(null);
  const [proceeding, setProceeding] = useState(false);

  // Auto-generate on mount if no recommendations yet
  useEffect(() => {
    if (recommendations.length === 0) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    if (!skinSummary || !intention) {
      router.replace(`/session/${id}/photo`);
      return;
    }
    setLoading(true);
    setError("");
    setSelected(null);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, intention }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to generate");
      }

      const { recommendations: recs } = await res.json();
      setRecommendations(recs);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function proceed() {
    if (!selected) return;
    setProceeding(true);
    setSelectedOutfit(selected);

    await fetch(`/api/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedOutfit: selected,
        completedStep: 4,
      }),
    });

    router.push(`/session/${id}/tryon`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <StepIndicator current={4} />
        <div className="flex items-start justify-between mt-6">
          <div>
            <h1 className="display-md text-vestige-ink mb-2">
              Your outfits
            </h1>
            {intention && (
              <p className="body-lg text-sm">
                Styled for your{" "}
                <span className="text-vestige-espresso font-medium">
                  {capitalize(intention)}
                </span>{" "}
                intention — personalised to your skin profile and style history.
              </p>
            )}
          </div>
          {!loading && recommendations.length > 0 && (
            <button
              onClick={generate}
              className="btn-ghost text-xs flex items-center gap-1 flex-shrink-0 ml-4"
              title="Regenerate"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-6 py-16">
          <Spinner className="h-7 w-7 text-vestige-bark" />
          <div className="text-center">
            <p className="font-serif text-xl text-vestige-ink mb-1">
              Consulting your stylist…
            </p>
            <p className="font-sans text-xs text-vestige-stone">
              Vestige is composing three outfits around your skin analysis and style history.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-red-600 mb-4">{error}</p>
          <button onClick={generate} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      )}

      {/* Recommendation cards */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              selected={selected?.id === outfit.id}
              onClick={() =>
                setSelected(selected?.id === outfit.id ? null : outfit)
              }
            />
          ))}
        </div>
      )}

      {/* Continue */}
      {!loading && selected && (
        <button
          onClick={proceed}
          disabled={proceeding}
          className="mt-6 btn-primary w-full gap-2"
        >
          {proceeding ? (
            <>
              <Spinner className="h-4 w-4" />
              Loading try-on…
            </>
          ) : (
            <>
              Try on &ldquo;{selected.name}&rdquo;
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
