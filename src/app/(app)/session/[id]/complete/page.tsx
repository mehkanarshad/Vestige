"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Sparkles, User, Clock, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";

export default function CompleteStep() {
  const { id } = useParams<{ id: string }>();
  const { selectedOutfit, intention, skinSummary, tryOnGarment } = useSessionStore();

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      {/* Mark */}
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-vestige-sand mb-8">
        <Sparkles className="h-7 w-7 text-vestige-bark" />
      </div>

      <h1 className="display-md text-vestige-ink mb-4">
        Session complete.
      </h1>

      <p className="body-lg text-sm max-w-sm mx-auto mb-8">
        {selectedOutfit ? (
          <>
            Your trace is left. Vestige has recorded your skin analysis
            {intention ? `, your ${intention} intention` : ""}, and your
            feedback on{" "}
            <span className="text-vestige-espresso italic">
              {tryOnGarment?.name ?? selectedOutfit.name}
            </span>
            . Every future session gets smarter.
          </>
        ) : (
          "Your trace is left. Vestige has recorded this session and will use it to personalise future recommendations."
        )}
      </p>

      {/* What was saved */}
      <div className="text-left vestige-card mb-8 space-y-3">
        <p className="caption mb-2">What Vestige remembered</p>
        {skinSummary && (
          <div className="flex items-center gap-2 font-sans text-xs text-vestige-bark">
            <div className="h-1.5 w-1.5 rounded-full bg-vestige-gold" />
            Skin analysis: {skinSummary.tone} tone, {skinSummary.undertone} undertone
          </div>
        )}
        {intention && (
          <div className="flex items-center gap-2 font-sans text-xs text-vestige-bark">
            <div className="h-1.5 w-1.5 rounded-full bg-vestige-gold" />
            Styling intention: {intention}
          </div>
        )}
        {selectedOutfit && (
          <div className="flex items-center gap-2 font-sans text-xs text-vestige-bark">
            <div className="h-1.5 w-1.5 rounded-full bg-vestige-gold" />
            Style inspiration: {selectedOutfit.name}
          </div>
        )}
        {tryOnGarment && (
          <div className="flex items-center gap-2 font-sans text-xs text-vestige-bark">
            <div className="h-1.5 w-1.5 rounded-full bg-vestige-gold" />
            Garment tried: {tryOnGarment.name} ({tryOnGarment.category})
          </div>
        )}
        <div className="flex items-center gap-2 font-sans text-xs text-vestige-bark">
          <div className="h-1.5 w-1.5 rounded-full bg-vestige-gold" />
          Feedback added to your style profile
        </div>
      </div>

      {/* Next actions */}
      <div className="flex flex-col gap-3">
        <Link href="/session/new" className="btn-primary w-full gap-2">
          Start another session
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/profile" className="btn-secondary w-full gap-2">
          <User className="h-4 w-4" />
          View your style profile
        </Link>
        <Link href="/history" className="btn-ghost w-full gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Session history
        </Link>
      </div>
    </div>
  );
}
