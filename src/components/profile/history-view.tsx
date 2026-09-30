"use client";

import Link from "next/link";
import Image from "next/image";
import { OutfitRecommendation, SkinSummary } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Heart, ThumbsDown, Sliders, ArrowRight, Sparkles } from "lucide-react";

interface FeedbackItem {
  id: string;
  type: "liked" | "rejected" | "adjusted";
  detail: string | null;
  outfit: OutfitRecommendation | null;
  createdAt: string;
}

interface SessionSummary {
  id: string;
  createdAt: string;
  intention: string | null;
  completedStep: number;
  skinSummary: SkinSummary | null;
  selectedOutfit: OutfitRecommendation | null;
  tryOnImageUrl: string | null;
  feedback: FeedbackItem[];
}

const FEEDBACK_ICONS = {
  liked: Heart,
  rejected: ThumbsDown,
  adjusted: Sliders,
};

const FEEDBACK_COLORS = {
  liked: "text-vestige-blush",
  rejected: "text-vestige-stone",
  adjusted: "text-vestige-gold",
};

const STEP_LABELS: Record<number, string> = {
  0: "Started",
  1: "Photo uploaded",
  2: "Skin analysed",
  3: "Intention set",
  4: "Outfits generated",
  5: "Try-on complete",
  6: "Feedback given",
};

export function HistoryView({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <div className="vestige-section">
        <div className="vestige-container max-w-3xl text-center py-16">
          <Sparkles className="h-8 w-8 text-vestige-stone mx-auto mb-4" />
          <h1 className="display-md text-vestige-ink mb-3">No sessions yet.</h1>
          <p className="body-lg text-sm max-w-xs mx-auto mb-8">
            Your styling history will appear here after your first session.
          </p>
          <Link href="/session/new" className="btn-primary gap-2">
            Start your first session
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vestige-section">
      <div className="vestige-container max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <p className="caption mb-3">Session history</p>
          <h1 className="display-md text-vestige-ink mb-2">Your traces.</h1>
          <p className="body-lg text-sm">
            Every session listed below contributed to your style profile.
          </p>
        </div>

        {/* Session list */}
        <div className="space-y-6">
          {sessions.map((session, index) => {
            const primaryFeedback = session.feedback[0];
            const FeedbackIcon = primaryFeedback
              ? FEEDBACK_ICONS[primaryFeedback.type]
              : null;

            return (
              <div
                key={session.id}
                className="vestige-card hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex gap-5">
                  {/* Try-on thumbnail or placeholder */}
                  <div className="flex-shrink-0">
                    {session.tryOnImageUrl ? (
                      <div className="relative h-24 w-18 rounded-sm overflow-hidden border border-vestige-sand">
                        <Image
                          src={session.tryOnImageUrl}
                          alt={session.selectedOutfit?.name ?? "Try-on"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-18 rounded-sm bg-vestige-sand border border-vestige-sand flex items-center justify-center">
                        <span className="font-sans text-[10px] text-vestige-stone text-center px-1">
                          {STEP_LABELS[session.completedStep] ?? "In progress"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-sans text-[10px] text-vestige-stone">
                          {formatDate(session.createdAt)}
                          {index === 0 && (
                            <span className="ml-2 bg-vestige-sand text-vestige-bark px-1.5 py-0.5 rounded-sm text-[9px]">
                              Latest
                            </span>
                          )}
                        </p>
                        <h3 className="font-serif text-lg text-vestige-ink mt-0.5">
                          {session.selectedOutfit?.name ?? "Session incomplete"}
                        </h3>
                      </div>

                      {/* Feedback badge */}
                      {FeedbackIcon && primaryFeedback && (
                        <div
                          className={cn(
                            "flex items-center gap-1 flex-shrink-0",
                            FEEDBACK_COLORS[primaryFeedback.type]
                          )}
                        >
                          <FeedbackIcon className="h-3.5 w-3.5" />
                          <span className="font-sans text-[10px] capitalize">
                            {primaryFeedback.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Intention */}
                    {session.intention && (
                      <p className="font-sans text-xs text-vestige-stone capitalize mb-2">
                        Intention:{" "}
                        <span className="text-vestige-bark">
                          {session.intention}
                        </span>
                      </p>
                    )}

                    {/* Skin summary chips */}
                    {session.skinSummary && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="font-sans text-[10px] text-vestige-stone bg-vestige-sand px-2 py-0.5 rounded-full capitalize">
                          {session.skinSummary.tone} tone
                        </span>
                        <span className="font-sans text-[10px] text-vestige-stone bg-vestige-sand px-2 py-0.5 rounded-full capitalize">
                          {session.skinSummary.undertone} undertone
                        </span>
                      </div>
                    )}

                    {/* Outfit items */}
                    {session.selectedOutfit && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {session.selectedOutfit.items
                          .slice(0, 3)
                          .map((item, i) => (
                            <span
                              key={i}
                              className="font-sans text-[10px] text-vestige-stone"
                            >
                              {item.name}
                              {i <
                                Math.min(
                                  session.selectedOutfit!.items.length,
                                  3
                                ) -
                                  1 && (
                                <span className="mx-1 text-vestige-sand">
                                  ·
                                </span>
                              )}
                            </span>
                          ))}
                        {session.selectedOutfit.items.length > 3 && (
                          <span className="font-sans text-[10px] text-vestige-stone">
                            +{session.selectedOutfit.items.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Feedback note */}
                    {primaryFeedback?.detail && (
                      <p className="font-sans text-xs text-vestige-stone italic border-t border-vestige-sand/60 pt-2 mt-2">
                        &ldquo;{primaryFeedback.detail}&rdquo;
                      </p>
                    )}

                    {/* Color palette dots */}
                    {session.selectedOutfit?.colorPalette && (
                      <div className="flex gap-1 mt-2">
                        {session.selectedOutfit.colorPalette.map((c, i) => (
                          <div
                            key={i}
                            className="h-2.5 w-2.5 rounded-full border border-white/30"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex justify-center">
          <Link href="/session/new" className="btn-primary gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Add to your history
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
