import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { SkinSummary, OutfitRecommendation } from "@/types";
import { ArrowRight } from "lucide-react";
import { classifySkinUndertone } from "@/lib/color-science";

export const dynamic = "force-dynamic";

/* ─── Intention definitions ──────────────────────────────────────────────── */
const INTENTIONS = [
  { value: "confident",    label: "Confident",    swatch: "#58463A" },
  { value: "calm",         label: "Calm",         swatch: "#7A8C76" },
  { value: "bold",         label: "Bold",         swatch: "#B8924A" },
  { value: "playful",      label: "Playful",      swatch: "#D4AF72" },
  { value: "professional", label: "Professional", swatch: "#2A1F18" },
  { value: "minimal",      label: "Minimal",      swatch: "#B0A090" },
  { value: "experimental", label: "Experimental", swatch: "#857060" },
];

/* ─── Data ───────────────────────────────────────────────────────────────── */
async function getHomeData(userId: string) {
  const [profile, recentSessions] = await Promise.all([
    prisma.styleProfile.findUnique({ where: { userId } }),
    prisma.session.findMany({
      where: { userId, completedStep: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { feedback: { take: 1, orderBy: { createdAt: "desc" } } },
    }),
  ]);
  return { profile, recentSessions };
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { profile, recentSessions } = await getHomeData(session.user.id);
  const firstName    = session.user.name?.split(" ")[0] ?? "there";
  const sessionCount = profile?.sessionCount ?? 0;
  const summary      = profile?.styleSummary ?? null;
  const palette      = parseJson<string[]>(profile?.colorPalette ?? null) ?? [];

  const hour     = new Date().getHours();
  const greeting = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ paddingTop: "clamp(3.5rem, 6vw, 5.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>

      {/* ─────────────────────────────────────────────────────────
          GREETING + STYLE SUMMARY
          Quiet, personal. The first thing you read is about you.
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mb-16">
        <p className="t-label text-vestige-stone mb-5">{greeting}, {firstName}</p>

        {summary ? (
          <>
            <p
              className="font-serif text-vestige-ink text-balance"
              style={{ fontSize: "clamp(1.625rem, 3vw, 2.5rem)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.015em", maxWidth: "28ch" }}
            >
              {summary}
            </p>
            {/* Palette trace — the user's known colours shown as a silent indicator */}
            {palette.length > 0 && (
              <div className="flex items-center gap-2 mt-5">
                {palette.slice(0, 8).map((c, i) => (
                  <div
                    key={i}
                    className="rounded-full border border-black/[0.06]"
                    style={{ backgroundColor: c, width: i === 0 ? 28 : 20, height: i === 0 ? 28 : 20, opacity: 1 - i * 0.09 }}
                    title={c}
                  />
                ))}
                <span className="t-label-sm text-vestige-stone ml-1">Your palette</span>
              </div>
            )}
          </>
        ) : (
          <p
            className="font-serif text-vestige-ink text-balance"
            style={{ fontSize: "clamp(1.625rem, 3vw, 2.5rem)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, maxWidth: "28ch" }}
          >
            Your style story is waiting to begin.
          </p>
        )}
      </div>


      {/* ─────────────────────────────────────────────────────────
          INTENTION SELECTOR — the emotional centre of the home page
          "What are you feeling today?"
          This is the primary action, not a section header.
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-vestige-parchment py-section">
        <div className="container-lg">
          <p
            className="font-serif text-vestige-ink mb-10 text-balance"
            style={{ fontSize: "clamp(1.375rem, 2.5vw, 2rem)", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.01em" }}
          >
            What are you feeling today?
          </p>

          {/* Seven intentions — full-width divided rows on mobile, 
              flowing horizontal list on desktop. Each is a link. */}
          <div className="divide-y divide-vestige-sand">
            {INTENTIONS.map(({ value, label, swatch }, i) => (
              <Link
                key={value}
                href={`/session/new?intention=${value}`}
                className="group flex items-center justify-between gap-6 py-5 px-1 hover:bg-vestige-cream/70 transition-colors duration-150"
              >
                <div className="flex items-center gap-5">
                  <span
                    className="font-sans text-vestige-stone w-5 flex-shrink-0"
                    style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="font-serif text-vestige-ink group-hover:text-vestige-charcoal transition-colors"
                    style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 500, letterSpacing: "-0.005em" }}
                  >
                    {label}
                  </h3>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div
                    className="h-5 w-5 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: swatch }}
                  />
                  <ArrowRight
                    className="h-4 w-4 text-vestige-stone opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </Link>
            ))}
          </div>

          {/* CTA below the intentions */}
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/session/new" className="btn-accent">
              Begin Styling
            </Link>
            {sessionCount > 0 && (
              <p className="font-sans text-vestige-stone" style={{ fontSize: "0.8125rem" }}>
                Session {sessionCount + 1} will draw on everything Vestige has learned.
              </p>
            )}
          </div>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────
          RECENT SESSIONS — below the fold, secondary
          No stat boxes. Outfit name, intention, date, feedback.
      ───────────────────────────────────────────────────────────── */}
      {recentSessions.length > 0 && (
        <div className="container-lg mt-section">
          <div className="flex items-baseline justify-between mb-10">
            <p className="t-label text-vestige-stone">Recent sessions</p>
            <Link
              href="/journey"
              className="font-sans text-vestige-bark hover:text-vestige-ink transition-colors flex items-center gap-1"
              style={{ fontSize: "0.8125rem" }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-0 divide-y divide-vestige-sand">
            {recentSessions.map((s) => {
              const outfit = parseJson<OutfitRecommendation>(s.selectedOutfit ?? null);
              const skin   = parseJson<SkinSummary>(s.skinSummary ?? null);
              const fb     = s.feedback[0];
              const date   = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

              return (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-6 py-5"
                >
                  <div>
                    {/* Outfit name — the editorial moment */}
                    <p
                      className="font-serif text-vestige-ink mb-1"
                      style={{ fontSize: "1.125rem", fontWeight: 500 }}
                    >
                      {outfit?.name ?? "Session complete"}
                    </p>

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {s.intention && (
                        <span className="t-label-sm text-vestige-stone capitalize">{s.intention}</span>
                      )}
                      {skin && (
                        <span className="t-label-sm text-vestige-stone capitalize">
                          {skin.tone} · {skin.skinLab
                            ? classifySkinUndertone(skin.skinLab)
                            : skin.undertone}
                        </span>
                      )}
                      {outfit?.colorPalette && (
                        <div className="flex items-center gap-1">
                          {outfit.colorPalette.slice(0, 4).map((c, i) => (
                            <div
                              key={i}
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User's own words */}
                    {fb?.detail && (
                      <p
                        className="font-serif text-vestige-stone mt-2"
                        style={{ fontSize: "0.875rem", fontStyle: "italic", lineHeight: 1.5 }}
                      >
                        &ldquo;{fb.detail}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Right — date + feedback */}
                  <div className="text-right flex-shrink-0">
                    <p className="t-label-sm text-vestige-stone">{date}</p>
                    {fb && (
                      <p
                        className="font-sans mt-1 capitalize"
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          color: fb.type === "liked" ? "#7A8C76" : fb.type === "adjusted" ? "#B8924A" : "#B0A090",
                        }}
                      >
                        {fb.type}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────
          STATS — last. Numbers support the story, not lead it.
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mt-section">
        <div className="flex items-center gap-12 sm:gap-16 pt-10 border-t border-vestige-sand">
          {[
            { value: sessionCount,                                                               label: "Sessions" },
            { value: parseJson<string[]>(profile?.preferredStyles ?? null)?.length ?? 0,        label: "Style signals" },
            { value: parseJson<string[]>(profile?.colorPalette   ?? null)?.length ?? 0,        label: "Palette colours" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="font-serif text-vestige-ink"
                style={{ fontSize: "2.75rem", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}
              >
                {value}
              </p>
              <p className="t-label text-vestige-stone mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
