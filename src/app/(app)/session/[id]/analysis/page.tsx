"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { SkinSummaryCard } from "@/components/session/skin-summary-card";
import { SkinChangeCard } from "@/components/session/skin-change-card";

export default function AnalysisStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { skinSummary, skinComparison, photoPreview } = useSessionStore();

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
          Each session creates a fresh skin-concern estimate. Your saved Skin
          Passport continues to inform complexion-aware colour recommendations.
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

      <SkinChangeCard comparison={skinComparison} />

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
