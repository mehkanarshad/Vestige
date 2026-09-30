"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { SkinSummaryCard } from "@/components/session/skin-summary-card";

export default function AnalysisStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { skinSummary, photoPreview } = useSessionStore();

  // Guard: if no analysis data, go back to photo step
  useEffect(() => {
    if (!skinSummary) {
      router.replace(`/session/${id}/photo`);
    }
  }, [skinSummary, id, router]);

  if (!skinSummary) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <StepIndicator current={2} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          Your skin analysis
        </h1>
        <p className="body-lg text-sm">
          Vestige has read your complexion. These insights inform every colour
          and texture choice in your recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Photo */}
        {photoPreview && (
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-vestige-sand shadow-sm">
            <Image
              src={photoPreview}
              alt="Your photo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Analysis card */}
        <div className="flex flex-col justify-center">
          <SkinSummaryCard summary={skinSummary} />
        </div>
      </div>

      <div className="mt-8 p-4 bg-vestige-sand/30 rounded-lg border border-vestige-sand">
        <p className="font-sans text-xs text-vestige-bark leading-relaxed">
          <span className="font-medium text-vestige-espresso">
            Stored in your style history.
          </span>{" "}
          Vestige tracks how your skin changes across sessions. Over time, this
          creates a richer picture of your complexion and how to dress for it.
        </p>
      </div>

      <button
        onClick={() => router.push(`/session/${id}/intention`)}
        className="mt-6 btn-primary w-full gap-2"
      >
        Set your intention
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
