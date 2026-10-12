import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { SkinPassport, SkinTraits, StyleProfileData } from "@/types";
import { ArrowRight } from "lucide-react";
import { classifySkinUndertone } from "@/lib/color-science";

export const dynamic = "force-dynamic";

export default async function StyleProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [profileRow, totalSessions] = await Promise.all([
    prisma.styleProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.session.count({ where: { userId: session.user.id, completedStep: { gte: 4 } } }),
  ]);

  const skinPassport = parseJson<SkinPassport>(profileRow?.skinPassport ?? null);
  const storedSkinTraits = parseJson<SkinTraits>(profileRow?.skinTraits);
  const passportUndertone = skinPassport
    ? classifySkinUndertone(skinPassport.skinLab)
    : null;
  const skinTraits = storedSkinTraits
    ? {
        ...storedSkinTraits,
        undertone: storedSkinTraits.undertone === "not assessed" && passportUndertone
          ? passportUndertone
          : storedSkinTraits.undertone,
      }
    : null;
  const profile: StyleProfileData = profileRow ? {
    skinTraits,
    preferredStyles: parseJson<string[]>(profileRow.preferredStyles) ?? [],
    avoidedStyles:   parseJson<string[]>(profileRow.avoidedStyles)   ?? [],
    intentions:      parseJson<Record<string, number>>(profileRow.intentions) ?? {},
    colorPalette:    parseJson<string[]>(profileRow.colorPalette)    ?? [],
    styleSummary:    profileRow.styleSummary ?? "",
    sessionCount:    profileRow.sessionCount,
  } : {
    skinTraits: null, preferredStyles: [], avoidedStyles: [],
    intentions: {}, colorPalette: [], styleSummary: "", sessionCount: 0,
  };
  const topIntentions = Object.entries(profile.intentions).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxCount      = topIntentions[0]?.[1] ?? 1;
  const name          = session.user.name?.split(" ")[0] ?? "Your";
  const isEmpty       = totalSessions === 0;

  return (
    <div style={{ paddingTop: "clamp(3.5rem, 6vw, 5.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>

      {/* ─────────────────────────────────────────────────────────
          HEADER — editorial, not a dashboard title
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mb-16">
        <p className="t-label text-vestige-stone mb-6">My Style</p>

        {profile.styleSummary ? (
          <>
            <h1
              className="font-serif text-vestige-ink text-balance"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: "24ch" }}
            >
              {profile.styleSummary}
            </h1>
            <p
              className="font-sans text-vestige-stone mt-4"
              style={{ fontSize: "0.8125rem" }}
            >
              {name}&rsquo;s style profile &nbsp;·&nbsp; {totalSessions} session{totalSessions !== 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <>
            <h1
              className="font-serif text-vestige-ink text-balance"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, maxWidth: "24ch" }}
            >
              Your profile is forming.
            </h1>
            <p className="font-sans text-vestige-bark mt-4" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>
              Each session adds signals. After a few interactions, Vestige will
              know your preferences well enough to describe your style in a sentence.
            </p>
            <Link href="/session/new" className="btn-accent mt-8 inline-flex">
              Start a session
            </Link>
          </>
        )}
      </div>


      {isEmpty ? null : (
        <>
          {/* ───────────────────────────────────────────────────────
              COLOUR PALETTE — the most visual section, shown first.
              Large swatches, not small circles. The colour IS the story.
          ─────────────────────────────────────────────────────────── */}
          {profile.colorPalette.length > 0 && (
            <div className="bg-vestige-parchment py-section">
              <div className="container-lg">
                <p className="t-label text-vestige-stone mb-10">Your palette</p>

                {/* Large colour bar */}
                <div className="flex gap-1 mb-8" style={{ height: 72 }}>
                  {profile.colorPalette.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 first:rounded-l-sm last:rounded-r-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Colour names */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {profile.colorPalette.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full border border-black/[0.06]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="t-label-sm text-vestige-stone capitalize">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ───────────────────────────────────────────────────────
              SKIN SIGNATURE — your complexion data, visually shown
          ─────────────────────────────────────────────────────────── */}
          {profile.skinTraits && (
            <div className="container-lg py-section border-b border-vestige-sand">
              <p className="t-label text-vestige-stone mb-10">Skin signature</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                  { label: "Tone",      value: profile.skinTraits.tone },
                  { label: "Estimated undertone", value: profile.skinTraits.undertone },
                  { label: "Skin type", value: profile.skinTraits.skinType },
                  {
                    label: "Concerns",
                    value: profile.skinTraits.concerns.length > 0
                      ? profile.skinTraits.concerns.slice(0, 2).join(", ")
                      : "None noted",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="t-label text-vestige-stone mb-3">{label}</p>
                    <p
                      className="font-serif text-vestige-ink capitalize"
                      style={{ fontSize: "1.375rem", fontWeight: 500, letterSpacing: "-0.005em" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skinPassport && (
            <div className="container-lg py-section border-b border-vestige-sand">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
                <div>
                  <p className="t-label text-vestige-stone mb-3">Skin Passport</p>
                  <p className="font-sans text-sm text-vestige-bark">
                    Stored from your first analysis as a baseline. Fresh session color readings are used for garment scores when available.
                  </p>
                </div>
                <p className="t-label-sm text-vestige-stone">
                  Captured {new Date(skinPassport.capturedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 items-end">
                <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div
                    className="h-12 w-12 border border-vestige-sand"
                    style={{ backgroundColor: skinPassport.toneColor }}
                    aria-label={`Measured skin color ${skinPassport.toneColor}`}
                  />
                  <div>
                    <p className="t-label-sm text-vestige-stone">Measured color</p>
                    <p className="font-mono text-xs text-vestige-ink">{skinPassport.toneColor}</p>
                  </div>
                </div>
                <div>
                  <p className="t-label-sm text-vestige-stone mb-2">Estimated undertone</p>
                  <p className="font-serif text-vestige-ink capitalize" style={{ fontSize: "1.5rem" }}>
                    {classifySkinUndertone(skinPassport.skinLab)}
                  </p>
                </div>
                {[
                  { label: "L* · lightness", value: skinPassport.skinLab.l },
                  { label: "a* · green/red", value: skinPassport.skinLab.a },
                  { label: "b* · blue/yellow", value: skinPassport.skinLab.b },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="t-label-sm text-vestige-stone mb-2">{label}</p>
                    <p className="font-serif text-vestige-ink" style={{ fontSize: "1.5rem" }}>
                      {value.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>

              {Object.keys(skinPassport.concerns).length > 0 && (
                <div className="mt-8 max-w-xl">
                  <p className="t-label-sm text-vestige-stone mb-3">Concern severity · stored 0–100</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {Object.entries(skinPassport.concerns)
                      .sort(([, left], [, right]) => right - left)
                      .map(([concern, severity]) => (
                        <span key={concern} className="font-sans text-xs text-vestige-bark capitalize">
                          {concern.replaceAll("_", " ")} {Math.round(severity * 100)}%
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ───────────────────────────────────────────────────────
              STYLE SIGNALS — preferences and avoidances
              Not tag badges. Larger type, visual contrast.
          ─────────────────────────────────────────────────────────── */}
          {(profile.preferredStyles.length > 0 || profile.avoidedStyles.length > 0) && (
            <div className="container-lg py-section border-b border-vestige-sand">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">

                {profile.preferredStyles.length > 0 && (
                  <div>
                    <p className="t-label text-vestige-stone mb-8">Gravitates toward</p>
                    <div className="space-y-4">
                      {profile.preferredStyles.map((s) => (
                        <p
                          key={s}
                          className="font-serif text-vestige-ink capitalize border-b border-vestige-sand pb-4 last:border-0"
                          style={{ fontSize: "1.25rem", fontWeight: 400 }}
                        >
                          {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {profile.avoidedStyles.length > 0 && (
                  <div>
                    <p className="t-label text-vestige-stone mb-8">Moves away from</p>
                    <div className="space-y-4">
                      {profile.avoidedStyles.map((s) => (
                        <p
                          key={s}
                          className="font-serif text-vestige-stone capitalize border-b border-vestige-sand pb-4 last:border-0 line-through decoration-vestige-sand"
                          style={{ fontSize: "1.25rem", fontWeight: 400 }}
                        >
                          {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ───────────────────────────────────────────────────────
              INTENTION FREQUENCY — horizontal bar chart, typographic
              Not coloured pill charts. Just proportion shown in text size.
          ─────────────────────────────────────────────────────────── */}
          {topIntentions.length > 0 && (
            <div className="container-lg py-section border-b border-vestige-sand">
              <p className="t-label text-vestige-stone mb-10">How you like to feel</p>

              <div className="space-y-6 max-w-lg">
                {topIntentions.map(([key, count]) => {
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <p
                          className="font-serif text-vestige-ink capitalize"
                          style={{ fontSize: "1.0625rem", fontWeight: 500 }}
                        >
                          {key}
                        </p>
                        <span className="t-label-sm text-vestige-stone">{count}×</span>
                      </div>
                      <div className="h-px bg-vestige-sand overflow-hidden">
                        <div
                          className="h-full bg-vestige-ink transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ───────────────────────────────────────────────────────
              FOOTER CTA
          ─────────────────────────────────────────────────────────── */}
          <div className="container-lg pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="font-sans text-vestige-stone" style={{ fontSize: "0.8125rem" }}>
              Built across {totalSessions} session{totalSessions !== 1 ? "s" : ""}.
              Every new session refines this profile.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/journey" className="btn-outline btn-sm">
                Style Journey
              </Link>
              <Link href="/session/new" className="btn-primary btn-sm">
                New session
              </Link>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
