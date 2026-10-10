"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ImagePlus, Shirt, ThumbsDown, ThumbsUp, Sparkles, X } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { Spinner } from "@/components/ui/spinner";
import { OutfitRecommendation } from "@/types";

interface RankedGarmentSuggestion {
  garmentId: string;
  name: string;
  category: "top" | "bottom" | "dress" | "outerwear";
  colorHex: string;
  imageUrl: string | null;
  predictedSatisfaction: number;
  skinColorScore: number;
  collaborativeScore: number | null;
  neighborCount: number;
}

function isTryOnCategory(category: string): category is RankedGarmentSuggestion["category"] {
  return ["top", "bottom", "dress", "outerwear"].includes(category);
}

export default function TryOnStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    selectedOutfit,
    recommendations,
    setSelectedOutfit,
    setTryOnImageUrl,
    setTryOnGarment,
    tryOnImageUrl,
    tryOnGarment,
    photoPreview,
  } = useSessionStore();

  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState("");
  const [activeOutfit, setActiveOutfit] = useState<OutfitRecommendation | null>(
    selectedOutfit
  );
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(
    tryOnGarment?.imageUrl ?? null
  );
  const [garmentName, setGarmentName] = useState(tryOnGarment?.name ?? "");
  const [garmentColorHex, setGarmentColorHex] = useState("#808080");
  const [colorScore, setColorScore] = useState<{
    score: number;
    label: string;
    deltaE: number;
    lightnessContrast: number;
    hueHarmony: number;
    colorConfidence: number;
  } | null>(null);
  const [colorScoreStale, setColorScoreStale] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<"liked" | "rejected" | "more_like_this" | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [rankedSuggestions, setRankedSuggestions] = useState<RankedGarmentSuggestion[]>([]);
  const [activePrediction, setActivePrediction] = useState<number | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<"top" | "bottom" | "dress" | "outerwear">(
    tryOnGarment?.category ?? "top"
  );
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/session/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load this session");
        return response.json();
      })
      .then((session) => {
        if (cancelled) return;
        const sessionRecommendations = session.recommendations ?? recommendations;
        const outfit: OutfitRecommendation | null =
          session.selectedOutfit ?? selectedOutfit ?? sessionRecommendations[0] ?? null;
        setActiveOutfit(outfit);
        if (outfit) setSelectedOutfit(outfit);
        const recommendedItem = outfit?.items.find((item) => item.colorHex);
        if (recommendedItem?.colorHex) setGarmentColorHex(recommendedItem.colorHex);
        setSavedPhotoUrl(session.photoUrl ?? null);
        if (session.tryOnImageUrl) setTryOnImageUrl(session.tryOnImageUrl);
        if (session.tryOnGarmentColor) setGarmentColorHex(session.tryOnGarmentColor);
        if (typeof session.tryOnColorScore === "number") {
          setColorScore({
            score: session.tryOnColorScore,
            label: session.tryOnColorScore >= 82 ? "Strong color match" : session.tryOnColorScore >= 65 ? "Good color match" : "Try a different color",
            deltaE: session.tryOnColorDeltaE ?? 0,
            lightnessContrast: session.tryOnColorContrast ?? 0,
            hueHarmony: session.tryOnColorHarmony ?? 0,
            colorConfidence: 0,
          });
        }

        if (session.tryOnGarmentImage) {
          const garment = {
            garmentId: session.tryOnGarmentId,
            imageUrl: session.tryOnGarmentImage,
            name: session.tryOnGarmentName ?? "Uploaded garment",
            category: session.tryOnGarmentCategory ?? "top",
          } as const;
          setGarmentPreviewUrl(garment.imageUrl);
          setGarmentName(garment.name);
          if (["top", "bottom", "dress", "outerwear"].includes(garment.category)) {
            setGarmentCategory(garment.category as "top" | "bottom" | "dress" | "outerwear");
          }
          setTryOnGarment(garment);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load this session");
        }
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });

    return () => {
      cancelled = true;
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    };
  }, [id]);

  function handleGarmentFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP garment photo.");
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      setError("Garment photos must be smaller than 10 MB.");
      return;
    }

    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = previewUrl;
    setGarmentFile(file);
    setGarmentPreviewUrl(previewUrl);
    setGarmentName(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    setColorScore(null);
    setColorScoreStale(false);
    setTryOnImageUrl("");
    setError("");
    void scoreGarment(file);
  }

  async function scoreGarment(file: File, colorHex?: string) {
    setScoring(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("garmentImage", file);
      if (colorHex) formData.append("colorHex", colorHex);
      const response = await fetch("/api/garment-score", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not score this garment");
      setGarmentColorHex(result.garmentColorHex);
      setColorScore({
        score: result.score,
        label: result.label,
        deltaE: result.deltaE,
        lightnessContrast: result.lightnessContrast,
        hueHarmony: result.hueHarmony,
        colorConfidence: result.colorConfidence,
      });
      setColorScoreStale(false);
    } catch (scoreError: unknown) {
      setColorScore(null);
      setError(scoreError instanceof Error ? scoreError.message : "Could not score this garment");
    } finally {
      setScoring(false);
    }
  }

  async function rescoreSelectedColor() {
    let file = garmentFile;
    if (!file && garmentPreviewUrl) {
      const response = await fetch(garmentPreviewUrl);
      const blob = await response.blob();
      file = new File([blob], "saved-garment.jpg", { type: blob.type || "image/jpeg" });
    }
    if (!file) return;
    await scoreGarment(file, garmentColorHex);
  }

  async function triggerTryOn(candidate?: RankedGarmentSuggestion) {
    if (!activeOutfit) {
      setError("Choose a styling recommendation first.");
      return;
    }
    if (!candidate && !garmentFile && !tryOnGarment) {
      setError("Upload the garment you want to try on.");
      return;
    }
    if (!candidate && (!colorScore || colorScoreStale)) {
      setError("Score the selected garment color before rendering.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("sessionId", id);
      formData.append("outfitId", activeOutfit.id);
      formData.append("garmentName", candidate?.name ?? (garmentName.trim() || garmentFile?.name || "Uploaded garment"));
      formData.append("garmentCategory", candidate?.category ?? garmentCategory);
      formData.append("garmentColorHex", candidate?.colorHex ?? garmentColorHex);
      if (candidate) {
        formData.append("garmentId", candidate.garmentId);
      } else if (garmentFile) {
        formData.append("garmentImage", garmentFile);
      } else {
        formData.append("reuseSavedGarment", "true");
      }
      setFeedbackAction(null);
      setActivePrediction(candidate?.predictedSatisfaction ?? null);
      if (candidate) {
        setRankedSuggestions((current) => current.filter((item) => item.garmentId !== candidate.garmentId));
      } else {
        setRankedSuggestions([]);
      }

      const res = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Try-on failed");
      }

      const data = await res.json();
      setTryOnImageUrl(data.tryOnImageUrl);
      setGarmentPreviewUrl(data.garmentImageUrl);
      setTryOnGarment({
        garmentId: data.garmentId,
        imageUrl: data.garmentImageUrl,
        name: data.garmentName,
        category: data.garmentCategory,
      });
      setGarmentColorHex(data.garmentColorHex);
      setGarmentName(data.garmentName);
      setGarmentCategory(data.garmentCategory);
      setColorScore({
        score: data.colorScore,
        label: data.colorLabel,
        deltaE: data.colorDeltaE,
        lightnessContrast: data.colorContrast,
        hueHarmony: data.colorHarmony,
        colorConfidence: data.colorConfidence,
      });
      setColorScoreStale(false);
      setSelectedOutfit(activeOutfit);
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
      setGarmentFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Try-on failed.");
    } finally {
      setLoading(false);
    }
  }

  async function sendGarmentFeedback(action: "liked" | "rejected" | "more_like_this") {
    if (!tryOnGarment?.garmentId || !tryOnImageUrl) return;
    setFeedbackLoading(true);
    setError("");
    try {
      const response = await fetch("/api/garment-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save your feedback");
      setFeedbackAction(action);

      const rankingResponse = await fetch(
        `/api/garment-recommendations?sessionId=${encodeURIComponent(id)}`
      );
      const ranking = await rankingResponse.json();
      if (rankingResponse.ok) {
        const ranked: RankedGarmentSuggestion[] = ranking.recommendations ?? [];
        if (ranked.length > 0) {
          setRankedSuggestions(ranked.slice(1));
          await triggerTryOn(ranked[0]);
        } else {
          setRankedSuggestions([]);
        }
      }
    } catch (feedbackError: unknown) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Could not save your feedback");
    } finally {
      setFeedbackLoading(false);
    }
  }

  function switchOutfit(outfit: OutfitRecommendation) {
    if (outfit.id === activeOutfit?.id) return;
    setActiveOutfit(outfit);
    setSelectedOutfit(outfit);
  }

  async function clearGarment() {
    if (tryOnGarment) {
      const response = await fetch(`/api/session/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tryOnGarmentId: "",
          tryOnGarmentImage: "",
          tryOnGarmentName: "",
          tryOnGarmentCategory: "",
          tryOnGarmentColor: "",
          tryOnColorScore: null,
          tryOnColorDeltaE: null,
          tryOnColorContrast: null,
          tryOnColorHarmony: null,
          tryOnImageUrl: "",
        }),
      });
      if (!response.ok) {
        setError("Could not remove the saved garment. Please try again.");
        return;
      }
    }
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
    setGarmentFile(null);
    setGarmentPreviewUrl(null);
    setGarmentName("");
    setGarmentColorHex("#808080");
    setColorScore(null);
    setColorScoreStale(false);
    setTryOnGarment(null);
    setTryOnImageUrl("");
    setError("");
  }

  const displayUrl = tryOnImageUrl || savedPhotoUrl || photoPreview;
  const recommendedItem = activeOutfit?.items.find(
    (item) => item.garmentId && item.colorHex && item.garmentImageUrl && isTryOnCategory(item.category)
  );
  const recommendedCandidate = recommendedItem?.garmentId &&
    recommendedItem.colorHex &&
    recommendedItem.garmentImageUrl &&
    isTryOnCategory(recommendedItem.category)
    ? {
        garmentId: recommendedItem.garmentId,
        name: recommendedItem.name,
        category: recommendedItem.category,
        colorHex: recommendedItem.colorHex,
        imageUrl: recommendedItem.garmentImageUrl,
        predictedSatisfaction: Math.round((activeOutfit?.confidence ?? 0) * 100),
        skinColorScore: Math.round((activeOutfit?.confidence ?? 0) * 100),
        collaborativeScore: null,
        neighborCount: 0,
      }
    : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <StepIndicator current={5} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          Try it on
        </h1>
        <p className="body-lg text-sm">
          Try on one garment at a time using an upload or a suggested wardrobe piece. Your outfit recommendation is styling guidance; the full outfit is not rendered.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* VTO preview */}
        <div className="relative aspect-[3/4] overflow-hidden bg-vestige-sand border border-vestige-sand">
          {(loading || hydrating) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-vestige-cream/80 z-10">
              <Spinner className="h-6 w-6 text-vestige-bark" />
              <p className="font-sans text-xs text-vestige-stone">
                {hydrating ? "Loading session…" : "Trying on your garment…"}
              </p>
            </div>
          )}
          {displayUrl && (
            <Image
              src={displayUrl}
              alt={tryOnImageUrl ? `Try-on: ${tryOnGarment?.name ?? garmentName}` : "Your uploaded photo"}
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
          {tryOnImageUrl && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-vestige-ink/60 to-transparent">
              <p className="font-serif text-white text-lg">
                {tryOnGarment?.name ?? garmentName}
              </p>
              {activePrediction !== null && (
                <p className="mt-1 font-sans text-[11px] text-white/90">
                  Predicted satisfaction {activePrediction}/100
                </p>
              )}
            </div>
          )}
        </div>

        {/* User garment upload and recommendation context */}
        <div className="flex flex-col gap-4">
          <section className="border-b border-vestige-sand pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="caption mb-1">Your garment</p>
                <p className="font-sans text-xs text-vestige-bark">
                  Try a ranked catalog pick or upload any piece you are considering.
                </p>
              </div>
              <input
                ref={garmentInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleGarmentFile(file);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => garmentInputRef.current?.click()}
                className="btn-secondary shrink-0 gap-2 text-xs"
                disabled={loading || hydrating}
              >
                <ImagePlus className="h-4 w-4" />
                {garmentPreviewUrl ? "Replace" : "Upload"}
              </button>
            </div>

            {garmentPreviewUrl && (
              <div className="mt-4 flex items-center gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden border border-vestige-sand bg-white">
                  <Image
                    src={garmentPreviewUrl}
                    alt={garmentName || "Uploaded garment"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="caption mb-1 block" htmlFor="garment-name">Piece name</label>
                  <input
                    id="garment-name"
                    value={garmentName}
                    onChange={(event) => setGarmentName(event.target.value)}
                    maxLength={120}
                    className="w-full border-b border-vestige-sand bg-transparent px-0 py-1 font-sans text-sm text-vestige-ink focus:border-vestige-bark focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearGarment}
                  className="btn-ghost p-2"
                  aria-label="Remove uploaded garment"
                  title="Remove garment"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex-1 font-sans text-xs text-vestige-bark">
                Garment type
                <select
                  value={garmentCategory}
                  onChange={(event) => setGarmentCategory(event.target.value as "top" | "bottom" | "dress" | "outerwear")}
                  className="mt-1 block w-full border border-vestige-sand bg-white px-3 py-2 text-sm text-vestige-ink focus:border-vestige-bark focus:outline-none"
                  disabled={loading}
                >
                  <option value="top">Top or shirt</option>
                  <option value="bottom">Bottom</option>
                  <option value="dress">Dress</option>
                  <option value="outerwear">Jacket or coat</option>
                </select>
              </label>
              {recommendedCandidate && (
                <button
                  type="button"
                  onClick={() => triggerTryOn(recommendedCandidate)}
                  disabled={loading || hydrating || scoring}
                  className="btn-accent gap-2 text-sm"
                >
                  {loading ? <Spinner className="h-4 w-4" /> : <Shirt className="h-4 w-4" />}
                  Try recommended piece on
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerTryOn()}
                disabled={loading || hydrating || scoring || !colorScore || colorScoreStale || (!garmentFile && !tryOnGarment) || !activeOutfit}
                className="btn-accent gap-2 text-sm"
              >
                {loading ? <Spinner className="h-4 w-4" /> : <Shirt className="h-4 w-4" />}
                Try my garment on
              </button>
            </div>
            <p className="mt-2 font-sans text-[11px] text-vestige-stone">
              Front-facing product photo works best. JPEG, PNG, or WebP, up to 10 MB.
            </p>
            {garmentPreviewUrl && (
              <div className="mt-4 border-t border-vestige-sand pt-4" aria-live="polite">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <label className="caption mb-1 block" htmlFor="garment-color">Estimated garment color</label>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 border border-vestige-sand" style={{ backgroundColor: garmentColorHex }} />
                      <input
                        id="garment-color"
                        type="color"
                        value={garmentColorHex}
                        onChange={(event) => {
                          setGarmentColorHex(event.target.value);
                          setColorScoreStale(true);
                        }}
                        aria-label="Adjust garment color sample"
                        disabled={scoring || loading}
                      />
                      <span className="font-mono text-xs text-vestige-stone">{garmentColorHex}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={rescoreSelectedColor}
                    disabled={scoring || loading || (!colorScoreStale && Boolean(colorScore))}
                    className="btn-secondary text-xs"
                  >
                    {scoring ? "Scoring…" : "Score color"}
                  </button>
                </div>
                {colorScore && !colorScoreStale && (
                  <div className="mt-3">
                    <p className="font-serif text-lg text-vestige-ink">
                      {colorScore.score}/100 · {colorScore.label}
                    </p>
                    <p className="font-sans text-[11px] text-vestige-stone">
                      CIEDE2000 ΔE {colorScore.deltaE.toFixed(1)} · lightness contrast {colorScore.lightnessContrast}% · hue harmony {colorScore.hueHarmony}%
                    </p>
                    {colorScore.colorConfidence > 0 && (
                      <p className="mt-1 font-sans text-[11px] text-vestige-stone">
                        Estimated sample confidence {Math.round(colorScore.colorConfidence * 100)}%. Adjust the swatch if the photo background affected the estimate.
                      </p>
                    )}
                    <p className="mt-1 font-sans text-[11px] text-vestige-stone">
                      This color score uses this session&apos;s latest skin-color reading when available. Skin-concern trends remain informational.
                    </p>
                  </div>
                )}
                {colorScoreStale && (
                  <p className="mt-2 font-sans text-[11px] text-vestige-stone">
                    Re-score this adjusted sample before rendering.
                  </p>
                )}
              </div>
            )}
          </section>

          {tryOnImageUrl && tryOnGarment?.garmentId && (
            <section className="border-b border-vestige-sand pb-5">
              <p className="caption mb-3">How was this piece?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { action: "liked" as const, label: "Like", Icon: ThumbsUp },
                  { action: "rejected" as const, label: "Reject", Icon: ThumbsDown },
                  { action: "more_like_this" as const, label: "More like this", Icon: Sparkles },
                ].map(({ action, label, Icon }) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendGarmentFeedback(action)}
                    disabled={feedbackLoading}
                    aria-pressed={feedbackAction === action}
                    className={`flex items-center justify-center gap-1.5 border px-2 py-2 font-sans text-xs transition-colors ${
                      feedbackAction === action
                        ? "border-vestige-espresso bg-vestige-sand text-vestige-ink"
                        : "border-vestige-sand text-vestige-bark hover:border-vestige-bark"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              {feedbackLoading && <p className="mt-2 font-sans text-xs text-vestige-stone">Updating your preferences…</p>}
            </section>
          )}

          {(feedbackAction || activePrediction !== null) && (
            <section>
              <p className="caption mb-3">Top predictions from your wardrobe</p>
              {rankedSuggestions.length === 0 ? (
                <p className="font-sans text-xs text-vestige-stone">
                  Your preference vector is updated. Add or rate more garments to build a ranked set of unseen pieces.
                </p>
              ) : (
                <div className="divide-y divide-vestige-sand">
                  {rankedSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.garmentId} className="flex items-center gap-3 py-3">
                      {suggestion.imageUrl && (
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden border border-vestige-sand bg-white">
                          <Image src={suggestion.imageUrl} alt={suggestion.name} fill className="object-contain" unoptimized />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-xs font-medium text-vestige-ink">{suggestion.name}</p>
                        <p className="font-sans text-[10px] text-vestige-stone">
                          {suggestion.predictedSatisfaction}/100 predicted · {suggestion.neighborCount} similar users
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerTryOn(suggestion)}
                        disabled={loading || feedbackLoading}
                        className="btn-secondary shrink-0 text-xs"
                      >
                        Try next
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeOutfit && (
            <>
              <div>
                <p className="caption mb-1">Style inspiration</p>
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
