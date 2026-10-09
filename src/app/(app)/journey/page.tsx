import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { parseJson, formatDate } from "@/lib/utils";
import {
  OutfitRecommendation,
  SkinSummary,
  StyleProfileData,
  StyleEvolutionEntry,
} from "@/types";
import { ArrowRight } from "lucide-react";
import { calculateSkinTrajectory, compareSkinAnalyses } from "@/lib/skin-trends";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";

export const dynamic = "force-dynamic";

/* ─── Feedback label styles ─────────────────────────────────────────────── */
const FB_COLOR: Record<string, string> = {
  liked:    "#7A8C76",
  adjusted: "#B8924A",
  rejected: "#B0A090",
};

export default async function JourneyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [sessions, evolutionRows, profileRow, skinHistory] = await Promise.all([
    prisma.session.findMany({
      where:   { userId: session.user.id, completedStep: { gte: 2 } },
      orderBy: { createdAt: "desc" },
      take:    40,
      select: {
        id: true,
        createdAt: true,
        completedStep: true,
        intention: true,
        selectedOutfit: true,
        skinSummary: true,
        tryOnGarmentName: true,
        tryOnColorScore: true,
        feedback: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { type: true, detail: true },
        },
        garmentInteractions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { action: true, garment: { select: { name: true } } },
        },
      },
    }),
    prisma.styleEvolution.findMany({
      where:   { userId: session.user.id },
      orderBy: { snapshotAt: "asc" },
    }),
    prisma.styleProfile.findUnique({ where: { userId: session.user.id } }),
    loadSkinAnalysisHistory(session.user.id),
  ]);

  const profile: StyleProfileData | null = profileRow ? {
    skinTraits:      parseJson(profileRow.skinTraits),
    preferredStyles: parseJson<string[]>(profileRow.preferredStyles) ?? [],
    avoidedStyles:   parseJson<string[]>(profileRow.avoidedStyles)   ?? [],
    intentions:      parseJson<Record<string, number>>(profileRow.intentions) ?? {},
    colorPalette:    parseJson<string[]>(profileRow.colorPalette)    ?? [],
    styleSummary:    profileRow.styleSummary ?? "",
    sessionCount:    profileRow.sessionCount,
  } : null;

  const evolution: StyleEvolutionEntry[] = evolutionRows.map((e) => ({
    id:          e.id,
    snapshotAt:  e.snapshotAt.toISOString(),
    summary:     e.summary,
    traits:      parseJson<StyleProfileData>(e.traits) ?? (profile as StyleProfileData),
  }));

  const skinComparisons = new Map<
    string,
    ReturnType<typeof compareSkinAnalyses>
  >();
  for (let index = 1; index < skinHistory.length; index += 1) {
    const current = skinHistory[index];
    const previous = skinHistory[index - 1];
    const trajectory = calculateSkinTrajectory(
      skinHistory.slice(0, index + 1).map(({ summary, capturedAt }) => ({
        summary,
        capturedAt,
      }))
    );
    skinComparisons.set(current.sessionId, {
      ...compareSkinAnalyses(
        current.summary,
        previous.summary,
        previous.capturedAt,
        current.capturedAt
      ),
      trajectory,
    });
  }

  if (sessions.length === 0) {
    return (
      <div
        className="container-md text-center"
        style={{ paddingTop: "clamp(5rem, 10vw, 9rem)", paddingBottom: "clamp(5rem, 10vw, 9rem)" }}
      >
        <p className="t-label text-vestige-stone mb-8">Style Journey</p>
        <h1
          className="font-serif text-vestige-ink text-balance mx-auto mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          Your journey starts here.
        </h1>
        <p className="font-sans text-vestige-bark mb-10" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
          Complete your first session and it will appear in your timeline.
          Every interaction you have with Vestige becomes part of this record.
        </p>
        <Link href="/session/new" className="btn-accent btn-lg">
          Begin Styling
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "clamp(3.5rem, 6vw, 5.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>

      {/* ─────────────────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mb-16">
        <p className="t-label text-vestige-stone mb-6">Style Journey</p>
        <h1
          className="font-serif text-vestige-ink"
          style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          Every trace, in order.
        </h1>
        {profile?.styleSummary && (
          <p
            className="font-serif text-vestige-bark mt-4"
            style={{ fontSize: "clamp(1.0625rem, 1.75vw, 1.25rem)", fontStyle: "italic", lineHeight: 1.55, maxWidth: "44ch" }}
          >
            &ldquo;{profile.styleSummary}&rdquo;
          </p>
        )}
      </div>


      <div className="container-xl grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 lg:gap-20">

        {/* ─────────────────────────────────────────────────────
            TIMELINE — sessions as moments, not cards
            The timeline IS the visual. No border boxes around entries.
        ───────────────────────────────────────────────────────── */}
        <div>
          {/* Column header */}
          <p className="t-label text-vestige-stone mb-10">Sessions</p>

          {/* Timeline track */}
          <div className="relative">
            {/* Vertical line — the literal trace */}
            <div
              className="absolute left-0 top-2 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, var(--c-accent) 0%, var(--c-sand) 100%)" }}
            />

            <div className="pl-8 space-y-12">
              {sessions.map((s, idx) => {
                const outfit  = parseJson<OutfitRecommendation>(s.selectedOutfit ?? null);
                const skin    = parseJson<SkinSummary>(s.skinSummary ?? null);
                const fb      = s.feedback[0];
                const garmentReaction = s.garmentInteractions[0];
                const skinComparison = skinComparisons.get(s.id);
                const isFirst = idx === 0;

                return (
                  <div key={s.id} className="relative">
                    {/* Timeline node */}
                    <div
                      className="absolute -left-[33px] top-1.5 rounded-full border-2"
                      style={{
                        width:           isFirst ? 12 : 8,
                        height:          isFirst ? 12 : 8,
                        backgroundColor: isFirst ? "var(--c-accent)" : "var(--c-cream)",
                        borderColor:     isFirst ? "var(--c-accent)" : "var(--c-sand)",
                        left:            isFirst ? "-35px" : "-33px",
                      }}
                    />

                    {/* Date */}
                    <p className="t-label-sm text-vestige-stone mb-3">
                      {formatDate(s.createdAt)}
                      {isFirst && (
                        <span
                          className="ml-3 font-sans normal-case"
                          style={{ fontSize: "0.625rem", color: "var(--c-accent)", letterSpacing: "0.08em" }}
                        >
                          Most recent
                        </span>
                      )}
                    </p>

                    {/* Outfit name — the editorial headline of this moment */}
                    <h3
                      className="font-serif text-vestige-ink mb-2"
                      style={{ fontSize: "clamp(1.1rem, 2vw, 1.375rem)", fontWeight: 500, lineHeight: 1.25 }}
                    >
                      {outfit?.name ?? (s.completedStep >= 4 ? "Session complete" : "Incomplete")}
                    </h3>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-3">
                      {s.intention && (
                        <span className="t-label-sm text-vestige-stone capitalize">{s.intention}</span>
                      )}
                      {s.tryOnGarmentName && (
                        <span className="t-label-sm text-vestige-stone">
                          Tried: {s.tryOnGarmentName}
                        </span>
                      )}
                      {typeof s.tryOnColorScore === "number" && (
                        <span className="t-label-sm text-vestige-stone">
                          Color match: {s.tryOnColorScore}/100
                        </span>
                      )}
                      {garmentReaction && (
                        <span className="t-label-sm text-vestige-stone capitalize">
                          {garmentReaction.action.replaceAll("_", " ")}: {garmentReaction.garment.name}
                        </span>
                      )}
                      {skin && (
                        <span className="t-label-sm text-vestige-stone capitalize">
                          {skin.tone} · {skin.undertone}
                        </span>
                      )}
                      {fb && (
                        <span
                          className="font-sans capitalize"
                          style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", color: FB_COLOR[fb.type] ?? "#B0A090" }}
                        >
                          {fb.type}
                        </span>
                      )}
                    </div>

                    {skinComparison && skinComparison.trajectory.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {skinComparison.trajectory.map((signal) => {
                          const delta = signal.relativePercentageChange;
                          return (
                            <span
                              key={signal.key}
                              className="rounded-sm bg-vestige-sand/60 px-2 py-1 font-sans text-[11px] text-vestige-bark"
                              title={`${signal.label}: ${delta === null ? `${signal.deltaPercentagePoints.toFixed(1)} percentage-point change` : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}% relative change`} across ${signal.observations.length} analyses. Automated estimate only.`}
                            >
                              {signal.label} {delta === null
                                ? `${signal.deltaPercentagePoints > 0 ? "+" : ""}${signal.deltaPercentagePoints.toFixed(1)} pp`
                                : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
                            </span>
                          );
                        })}
                        <span className="self-center font-sans text-[10px] text-vestige-stone">
                          trajectory from first analysis
                        </span>
                      </div>
                    )}

                    {/* Colour trace — the outfit's palette shown as a row of dots */}
                    {outfit?.colorPalette && outfit.colorPalette.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        {outfit.colorPalette.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-full"
                            style={{ backgroundColor: c, width: 10, height: 10, opacity: 0.9 - i * 0.1 }}
                            title={c}
                          />
                        ))}
                        {outfit.description && (
                          <span
                            className="font-sans text-vestige-stone ml-2"
                            style={{ fontSize: "0.75rem" }}
                          >
                            — {outfit.description.slice(0, 60)}{outfit.description.length > 60 ? "…" : ""}
                          </span>
                        )}
                      </div>
                    )}

                    {/* User's own feedback note — their words, not a system label */}
                    {fb?.detail && (
                      <p
                        className="font-serif text-vestige-stone"
                        style={{ fontSize: "0.9375rem", fontStyle: "italic", lineHeight: 1.55, maxWidth: "44ch" }}
                      >
                        &ldquo;{fb.detail}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}

              {/* "Add the next trace" — end of the timeline */}
              <div className="relative">
                <div
                  className="absolute rounded-full border border-dashed"
                  style={{
                    width: 8, height: 8,
                    left: "-33px", top: "4px",
                    borderColor: "var(--c-stone)",
                    backgroundColor: "transparent",
                  }}
                />
                <Link
                  href="/session/new"
                  className="flex items-center gap-2 font-sans text-vestige-bark hover:text-vestige-ink transition-colors"
                  style={{ fontSize: "0.875rem" }}
                >
                  Add the next trace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>


        {/* ─────────────────────────────────────────────────────
            EVOLUTION SIDEBAR — style arc over time
            These are written by the AI as one-sentence summaries.
            They appear as the user's style voice, not system output.
        ───────────────────────────────────────────────────────── */}
        <div className="border-t lg:border-t-0 lg:border-l border-vestige-sand pt-10 lg:pt-0 lg:pl-10">
          <p className="t-label text-vestige-stone mb-10">Style evolution</p>

          {evolution.length === 0 ? (
            <p className="font-sans text-vestige-stone" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
              Evolution snapshots are created every 5 sessions.
              Complete more sessions to unlock your style arc.
            </p>
          ) : (
            <div className="relative pl-5 space-y-8">
              {/* Vertical trace line */}
              <div
                className="absolute left-0 top-2 bottom-0 w-px"
                style={{ backgroundColor: "var(--c-sand)" }}
              />

              {evolution.map((entry) => (
                <div key={entry.id} className="relative">
                  <div
                    className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2"
                    style={{ backgroundColor: "var(--c-cream)", borderColor: "var(--c-accent)" }}
                  />
                  <p className="t-label-sm text-vestige-stone mb-2">{formatDate(entry.snapshotAt)}</p>
                  <p
                    className="font-serif text-vestige-bark"
                    style={{ fontSize: "1rem", fontStyle: "italic", lineHeight: 1.55 }}
                  >
                    &ldquo;{entry.summary}&rdquo;
                  </p>
                </div>
              ))}

              {/* Now */}
              <div className="relative">
                <div
                  className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--c-ink)" }}
                />
                <p className="t-label-sm text-vestige-stone mb-2">Now</p>
                <p
                  className="font-serif text-vestige-ink"
                  style={{ fontSize: "1rem", fontStyle: "italic", lineHeight: 1.55 }}
                >
                  &ldquo;{profile?.styleSummary ?? "Still writing your story."}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Colour palette trace — cumulative colours over time */}
          {profile && profile.colorPalette.length > 0 && (
            <div className="mt-12 pt-8 border-t border-vestige-sand">
              <p className="t-label text-vestige-stone mb-5">Accumulated palette</p>
              <div className="flex flex-wrap gap-2">
                {profile.colorPalette.map((c, i) => (
                  <div
                    key={i}
                    title={c}
                    className="rounded-full border border-black/[0.05]"
                    style={{
                      backgroundColor: c,
                      width:  16,
                      height: 16,
                      opacity: 0.55 + (i / profile.colorPalette.length) * 0.45,
                    }}
                  />
                ))}
              </div>
              <p className="t-label-sm text-vestige-stone mt-3">
                {profile.colorPalette.length} colours across {profile.sessionCount} sessions
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
