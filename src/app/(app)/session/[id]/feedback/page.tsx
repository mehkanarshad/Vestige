"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Heart, ThumbsDown, Sliders, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  {
    value: "liked" as const,
    label: "Love it",
    description: "This is exactly what I was looking for.",
    icon: Heart,
    color: "text-vestige-blush",
    bg: "bg-vestige-blush/10 border-vestige-blush/40",
    activeBg: "bg-vestige-blush/20 border-vestige-blush ring-1 ring-vestige-blush/30",
  },
  {
    value: "adjusted" as const,
    label: "Almost",
    description: "Good direction — I'd tweak a few things.",
    icon: Sliders,
    color: "text-vestige-gold",
    bg: "bg-vestige-gold/10 border-vestige-gold/40",
    activeBg: "bg-vestige-gold/20 border-vestige-gold ring-1 ring-vestige-gold/30",
  },
  {
    value: "rejected" as const,
    label: "Not for me",
    description: "This doesn't match my style.",
    icon: ThumbsDown,
    color: "text-vestige-stone",
    bg: "bg-vestige-sand border-vestige-sand",
    activeBg: "bg-vestige-sand border-vestige-bark ring-1 ring-vestige-bark/30",
  },
];

const QUICK_NOTES = [
  "Too formal",
  "Too casual",
  "Wrong colors",
  "Love the palette",
  "Not my silhouette",
  "Great texture mix",
  "Too structured",
  "More relaxed please",
  "Perfect for the occasion",
  "Unexpected — I like it",
];

export default function FeedbackStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { selectedOutfit, tryOnImageUrl, tryOnGarment } = useSessionStore();

  const [feedbackType, setFeedbackType] = useState<
    "liked" | "rejected" | "adjusted" | null
  >(null);
  const [detail, setDetail] = useState("");
  const [quickNotes, setQuickNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleQuickNote(note: string) {
    setQuickNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  }

  async function submit() {
    if (!feedbackType) return;
    setLoading(true);
    setError("");

    const garmentNote = tryOnGarment
      ? `Uploaded garment tried: ${tryOnGarment.name} (${tryOnGarment.category})`
      : "";
    const combinedDetail = [
      garmentNote,
      ...quickNotes,
      ...(detail.trim() ? [detail.trim()] : []),
    ].filter(Boolean).join("; ").slice(0, 500);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          type: feedbackType,
          detail: combinedDetail || undefined,
          outfitId: selectedOutfit?.id,
          outfit: selectedOutfit,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }

      router.push(`/session/${id}/complete`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <StepIndicator current={6} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          How did it feel?
        </h1>
        <p className="body-lg text-sm">
          Your feedback becomes part of your style memory. The more honest you
          are, the better Vestige understands you.
        </p>
      </div>

      {/* Outfit recap */}
      {selectedOutfit && (
        <div className="flex gap-4 mb-8 p-4 bg-white/60 rounded-lg border border-vestige-sand">
          {tryOnImageUrl && (
            <div className="relative h-20 w-16 rounded-sm overflow-hidden flex-shrink-0 border border-vestige-sand">
              <Image
                src={tryOnImageUrl}
                alt={tryOnGarment?.name ?? selectedOutfit.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div>
            <p className="caption mb-1">You tried on</p>
            <p className="font-serif text-lg text-vestige-ink">
              {tryOnGarment?.name ?? selectedOutfit.name}
            </p>
            <p className="font-sans text-xs text-vestige-stone mt-0.5">
              Style inspiration: {selectedOutfit.name}
            </p>
          </div>
        </div>
      )}

      {/* Feedback type */}
      <div className="space-y-3 mb-6">
        {FEEDBACK_TYPES.map(
          ({ value, label, description, icon: Icon, color, bg, activeBg }) => (
            <button
              key={value}
              onClick={() => setFeedbackType(value)}
              className={cn(
                "w-full flex items-center gap-4 rounded-lg border p-4 text-left transition-all duration-150",
                feedbackType === value ? activeBg : bg
              )}
              aria-pressed={feedbackType === value}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", color)} />
              <div>
                <p className="font-serif text-base text-vestige-ink">{label}</p>
                <p className="font-sans text-xs text-vestige-stone">
                  {description}
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* Quick notes */}
      {feedbackType && (
        <div className="mb-6">
          <p className="caption mb-3">Add quick notes (optional)</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_NOTES.map((note) => (
              <button
                key={note}
                onClick={() => toggleQuickNote(note)}
                className={cn(
                  "font-sans text-xs px-3 py-1.5 rounded-sm border transition-colors",
                  quickNotes.includes(note)
                    ? "bg-vestige-espresso text-vestige-cream border-vestige-espresso"
                    : "bg-white/60 text-vestige-bark border-vestige-sand hover:border-vestige-bark"
                )}
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Free-text note */}
      {feedbackType && (
        <div className="mb-8">
          <label
            htmlFor="detail"
            className="block font-sans text-xs text-vestige-bark mb-1.5"
          >
            Anything else? <span className="text-vestige-stone">(optional)</span>
          </label>
          <textarea
            id="detail"
            rows={3}
            placeholder="e.g. I loved the palette but wish it was more relaxed…"
            className="vestige-input resize-none"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="font-sans text-xs text-red-600 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!feedbackType || loading}
        className="btn-primary w-full gap-2"
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4" />
            Saving…
          </>
        ) : (
          <>
            Save &amp; finish session
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <button
        onClick={() => router.push(`/session/${id}/complete`)}
        className="btn-ghost w-full mt-3 text-xs text-vestige-stone"
      >
        Skip feedback
      </button>
    </div>
  );
}
