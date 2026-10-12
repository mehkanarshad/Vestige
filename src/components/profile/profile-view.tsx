"use client";

import Link from "next/link";
import { StyleProfileData, StyleEvolutionEntry } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";

interface ProfileViewProps {
  profile: StyleProfileData;
  evolution: StyleEvolutionEntry[];
  totalSessions: number;
  userName: string;
}

const INTENTION_LABELS: Record<string, string> = {
  confident: "Confident",
  calm: "Calm",
  bold: "Bold",
  professional: "Professional",
  playful: "Playful",
  minimal: "Minimal",
  experimental: "Experimental",
};

export function ProfileView({
  profile,
  evolution,
  totalSessions,
  userName,
}: ProfileViewProps) {
  const isEmpty = profile.sessionCount === 0 && totalSessions === 0;
  const topIntentions = Object.entries(profile.intentions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="vestige-section">
      <div className="vestige-container max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <p className="caption mb-3">Style Profile</p>
          <h1 className="display-lg text-vestige-ink mb-3">
            {userName}&apos;s Style
          </h1>
          {profile.styleSummary ? (
            <p className="font-serif text-xl text-vestige-bark italic leading-relaxed max-w-xl">
              &ldquo;{profile.styleSummary}&rdquo;
            </p>
          ) : (
            <p className="body-lg text-sm max-w-xl">
              Your style profile is forming. Complete a few sessions to unlock
              your personal style DNA.
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Sessions", value: totalSessions },
            { label: "Styles noted", value: profile.preferredStyles.length },
            {
              label: "Colors catalogued",
              value: profile.colorPalette.length,
            },
          ].map(({ label, value }) => (
            <div key={label} className="vestige-card text-center">
              <p className="font-serif text-3xl text-vestige-ink">{value}</p>
              <p className="caption mt-1">{label}</p>
            </div>
          ))}
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {/* Skin traits */}
            {profile.skinTraits && (
              <section>
                <p className="caption mb-4">Skin signature</p>
                <div className="vestige-card">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Tone", value: profile.skinTraits.tone },
                      {
                        label: "Estimated undertone",
                        value: profile.skinTraits.undertone,
                      },
                      {
                        label: "Skin type",
                        value: profile.skinTraits.skinType,
                      },
                      {
                        label: "Concerns",
                        value:
                          profile.skinTraits.concerns.length > 0
                            ? profile.skinTraits.concerns
                                .slice(0, 2)
                                .join(", ")
                            : "none noted",
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="caption mb-1">{label}</p>
                        <p className="font-sans text-sm text-vestige-ink capitalize">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Color palette */}
            {profile.colorPalette.length > 0 && (
              <section>
                <p className="caption mb-4">Your colour palette</p>
                <div className="vestige-card">
                  <div className="flex gap-2 flex-wrap">
                    {profile.colorPalette.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div
                          className="h-10 w-10 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                        <span className="font-sans text-[9px] text-vestige-stone text-center max-w-[48px] truncate">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Preferred styles */}
            {(profile.preferredStyles.length > 0 ||
              profile.avoidedStyles.length > 0) && (
              <section>
                <p className="caption mb-4">Style signals</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.preferredStyles.length > 0 && (
                    <div className="vestige-card">
                      <p className="font-sans text-xs text-vestige-stone mb-3">
                        Gravitates toward
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferredStyles.map((s) => (
                          <span
                            key={s}
                            className="font-sans text-xs bg-vestige-sand text-vestige-bark px-3 py-1 rounded-sm capitalize"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.avoidedStyles.length > 0 && (
                    <div className="vestige-card">
                      <p className="font-sans text-xs text-vestige-stone mb-3">
                        Moves away from
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.avoidedStyles.map((s) => (
                          <span
                            key={s}
                            className="font-sans text-xs bg-vestige-sand/50 text-vestige-stone px-3 py-1 rounded-sm capitalize line-through decoration-vestige-stone/40"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Intentions */}
            {topIntentions.length > 0 && (
              <section>
                <p className="caption mb-4">How you like to feel</p>
                <div className="vestige-card">
                  <div className="space-y-3">
                    {topIntentions.map(([key, count]) => {
                      const maxCount = topIntentions[0][1];
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="font-sans text-xs text-vestige-bark capitalize">
                              {INTENTION_LABELS[key] ?? key}
                            </span>
                            <span className="font-sans text-xs text-vestige-stone">
                              {count}×
                            </span>
                          </div>
                          <div className="h-1.5 bg-vestige-sand rounded-full overflow-hidden">
                            <div
                              className="h-full bg-vestige-bark rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Style evolution timeline */}
            {evolution.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-3.5 w-3.5 text-vestige-stone" />
                  <p className="caption">Style evolution</p>
                </div>
                <div className="relative pl-4 border-l border-vestige-sand space-y-6">
                  {evolution.map((entry, i) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-vestige-sand border-2 border-vestige-bark" />
                      <p className="font-sans text-[10px] text-vestige-stone mb-1">
                        {formatDate(entry.snapshotAt)}
                      </p>
                      <p className="font-serif text-base text-vestige-ink italic">
                        &ldquo;{entry.summary}&rdquo;
                      </p>
                      {entry.signals && (
                        <div className="mt-2 space-y-1 font-sans text-xs text-vestige-stone">
                          <p>
                            Latest five-session window: {formatDate(entry.signals.windowStartAt)}–{formatDate(entry.signals.windowEndAt)}
                          </p>
                          <p>
                            Snapshot after {entry.signals.sessionCount} feedback sessions
                            {entry.signals.style.feedbackAcceptance.current === null
                              ? ""
                              : ` · ${entry.signals.style.feedbackAcceptance.current.toFixed(1)}% liked in latest window`}
                            {entry.signals.style.feedbackAcceptance.deltaPercentagePoints === null
                              ? ""
                              : ` (${entry.signals.style.feedbackAcceptance.deltaPercentagePoints > 0 ? "+" : ""}${entry.signals.style.feedbackAcceptance.deltaPercentagePoints.toFixed(1)} pp vs prior window)`}
                          </p>
                          {entry.signals.skin.slice(0, 3).map((signal) => (
                            <p key={signal.key}>
                              {signal.label} estimate: {(signal.firstScore * 100).toFixed(1)} to{" "}
                              {(signal.currentScore * 100).toFixed(1)} ({signal.deltaPercentagePoints > 0 ? "+" : ""}
                              {signal.deltaPercentagePoints.toFixed(1)} points across {signal.observations} analyses)
                            </p>
                          ))}
                          {entry.signals.style.intentions.slice(0, 2).map((signal) => (
                            <p key={signal.intention}>
                              {signal.intention} intention: {(signal.currentShare * 100).toFixed(0)}%
                              {signal.deltaPercentagePoints === null
                                ? " of this window"
                                : ` (${signal.deltaPercentagePoints > 0 ? "+" : ""}${signal.deltaPercentagePoints.toFixed(1)} pp)`}
                            </p>
                          ))}
                          {entry.signals.style.preferences
                            .filter((signal) => signal.delta !== null)
                            .slice(0, 2)
                            .map(({ facet, value, delta }) => delta !== null && (
                              <p key={`${facet}:${value}`}>
                                {value} {facet} preference balance: {delta > 0 ? "+" : ""}
                                {(delta * 100).toFixed(0)} points vs prior window
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Now marker */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-vestige-espresso border-2 border-vestige-espresso" />
                    <p className="font-sans text-[10px] text-vestige-stone mb-1">
                      Now
                    </p>
                    <p className="font-serif text-base text-vestige-bark italic">
                      {profile.styleSummary ||
                        "Still writing your style story."}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-vestige-sand flex items-center justify-between">
          <p className="font-sans text-xs text-vestige-stone">
            {totalSessions === 0
              ? "Your profile builds with every session."
              : `Built across ${totalSessions} session${totalSessions !== 1 ? "s" : ""}.`}
          </p>
          <Link href="/session/new" className="btn-primary text-sm gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            New session
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-vestige-sand mb-6">
        <Sparkles className="h-6 w-6 text-vestige-stone" />
      </div>
      <h2 className="font-serif text-2xl text-vestige-ink mb-3">
        Your profile is waiting.
      </h2>
      <p className="font-sans text-sm text-vestige-bark max-w-xs mx-auto mb-8">
        Complete your first session to start building your style DNA. Vestige
        learns more with every interaction.
      </p>
      <Link href="/session/new" className="btn-primary gap-2">
        Start your first session
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
