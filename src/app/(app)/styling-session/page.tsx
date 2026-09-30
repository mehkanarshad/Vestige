import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { StyleProfileData } from "@/types";
import { EditorialImage } from "@/components/ui/photo-placeholder";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const INTENTIONS = [
  { value: "confident",    label: "Confident",    desc: "Strong presence. An outfit that arrives first.",    swatch: "#58463A" },
  { value: "calm",         label: "Calm",          desc: "Soft. Unhurried. Clothes that feel like breathing.", swatch: "#8C9E88" },
  { value: "bold",         label: "Bold",          desc: "Colour, contrast, and deliberate impact.",           swatch: "#C07060" },
  { value: "professional", label: "Professional",  desc: "Polished, precise, and unmistakably considered.",    swatch: "#3A3028" },
  { value: "playful",      label: "Playful",       desc: "Joy in the details. Texture, pattern, lightness.",  swatch: "#B89060" },
  { value: "minimal",      label: "Minimal",       desc: "Nothing excess. Only what belongs.",                swatch: "#A09080" },
  { value: "experimental", label: "Experimental",  desc: "Rules as suggestions. Something unexpected.",        swatch: "#607080" },
];

export default async function StylingSessionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [profileRow, sessionCount] = await Promise.all([
    prisma.styleProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.session.count({ where: { userId: session.user.id, completedStep: { gte: 4 } } }),
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

  const topIntention = profile
    ? Object.entries(profile.intentions).sort(([, a], [, b]) => b - a)[0]?.[0]
    : null;
  const isReturning = sessionCount > 0;

  return (
    <div style={{ paddingTop: "clamp(3.5rem, 6vw, 5.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>

      {/* ─────────────────────────────────────────────────────────
          HEADER — sparse, direct
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mb-16">
        <p className="t-label text-vestige-stone mb-6">
          {isReturning ? `Session ${sessionCount + 1}` : "First session"}
        </p>
        <h1
          className="font-serif text-vestige-ink text-balance"
          style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.02em", maxWidth: "20ch" }}
        >
          {isReturning
            ? "Pick up where you left off."
            : "Let's understand your style."}
        </h1>

        {isReturning && profile?.styleSummary && (
          <p
            className="font-serif text-vestige-bark mt-5 text-balance"
            style={{ fontSize: "clamp(1.0625rem, 1.75vw, 1.25rem)", fontStyle: "italic", lineHeight: 1.55, maxWidth: "44ch" }}
          >
            &ldquo;{profile.styleSummary}&rdquo;
          </p>
        )}

        {isReturning && profile && profile.colorPalette.length > 0 && (
          <div className="flex items-center gap-2 mt-5">
            {profile.colorPalette.slice(0, 7).map((c, i) => (
              <div
                key={i}
                className="rounded-full border border-black/[0.06]"
                style={{ backgroundColor: c, width: 22, height: 22, opacity: 1 - i * 0.1 }}
              />
            ))}
            <span className="t-label-sm text-vestige-stone ml-2">
              {topIntention ? `Most frequent: ${topIntention}` : "Your palette"}
            </span>
          </div>
        )}
      </div>


      {/* ─────────────────────────────────────────────────────────
          INTENTION SELECTION — primary action, full section
          Each intention links directly to a new session.
          This replaces the "preview of features" approach entirely.
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-vestige-parchment py-section">
        <div className="container-lg">
          <p
            className="font-serif text-vestige-ink mb-10"
            style={{ fontSize: "clamp(1.25rem, 2vw, 1.625rem)", fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            How do you want to feel?
          </p>

          <div className="divide-y divide-vestige-sand">
            {INTENTIONS.map(({ value, label, desc, swatch }, i) => (
              <Link
                key={value}
                href={`/session/new?intention=${value}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-8 py-5 px-1 hover:bg-vestige-cream/70 transition-colors duration-150"
              >
                {/* Number */}
                <span
                  className="font-sans text-vestige-stone w-5"
                  style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-10">
                  <h3
                    className="font-serif text-vestige-ink"
                    style={{ fontSize: "clamp(1.125rem, 2vw, 1.5rem)", fontWeight: 500, minWidth: "9rem" }}
                  >
                    {label}
                  </h3>
                  <p
                    className="font-sans text-vestige-bark"
                    style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                  >
                    {desc}
                  </p>
                </div>

                {/* Swatch + arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div
                    className="h-5 w-5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: swatch }}
                  />
                  <ArrowRight className="h-4 w-4 text-vestige-stone opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-vestige-sand flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Link href="/session/new" className="btn-accent btn-lg">
              Begin Styling
            </Link>
            <p className="font-sans text-vestige-stone" style={{ fontSize: "0.8125rem" }}>
              {isReturning
                ? `Vestige will use ${sessionCount} session${sessionCount !== 1 ? "s" : ""} of context.`
                : "Your photo will be analysed. Your profile will begin."}
            </p>
          </div>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────
          WHAT HAPPENS — sequential, progressive disclosure
          Not a feature checklist. A narrative of the experience.
      ───────────────────────────────────────────────────────────── */}
      <div className="container-lg mt-section">
        <p className="t-label text-vestige-stone mb-12">In this session</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left — the sequence */}
          <div className="space-y-10">
            {[
              {
                step: "You",
                body: "Upload a photo. It takes seconds. Vestige passes it to YouCam Skin AI and reads your complexion — tone, undertone, and any concerns.",
              },
              {
                step: "Understand",
                body: "Your skin analysis is stored. Together with your intention and style history, it becomes the brief your AI stylist works from.",
              },
              {
                step: "Discover",
                body: "Three curated outfits. Each chosen because of your specific profile — not a model, not a trend, not a guess.",
              },
              {
                step: "Try",
                body: "Virtual try-on composites your selected outfit onto your photo. You see yourself in the look before deciding.",
              },
              {
                step: "Refine",
                body: "Like it, adjust it, or reject it. Your response is stored and shapes every session that follows.",
              },
            ].map(({ step, body }, i) => (
              <div key={step} className="grid grid-cols-[2rem_1fr] gap-4">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: i === 0 ? "var(--c-accent)" : "var(--c-sand)" }}
                  />
                  {i < 4 && <div className="w-px flex-1 mt-2" style={{ backgroundColor: "var(--c-sand)" }} />}
                </div>
                <div className={i < 4 ? "pb-10" : ""}>
                  <p
                    className="font-serif text-vestige-ink mb-2"
                    style={{ fontSize: "1.125rem", fontWeight: 500 }}
                  >
                    {step}
                  </p>
                  <p className="font-sans text-vestige-bark" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — editorial image */}
          <div className="hidden lg:block" style={{ maxHeight: "520px" }}>
            <EditorialImage aspect="portrait" variant={1} className="w-full h-full" />
          </div>
        </div>
      </div>

    </div>
  );
}
