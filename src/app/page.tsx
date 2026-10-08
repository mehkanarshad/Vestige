import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PublicShell } from "@/components/layout/public-shell";
import { Footer } from "@/components/layout/footer";
import { EditorialImage } from "@/components/ui/photo-placeholder";
import { ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const authed  = !!session?.user;

  return (
    <PublicShell noTopPad>

      {/* ─────────────────────────────────────────────────────────
          HERO
          Full-viewport split: left = type, right = image composition.
          The headline dominates at 900 weight — nothing else competes.
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen grid lg:grid-cols-[1fr_44%] overflow-hidden bg-vestige-cream">

        {/* Left — copy */}
        <div className="flex flex-col justify-end pb-16 pt-32 px-fluid lg:pl-[clamp(2.5rem,6vw,7rem)] lg:pr-16 animate-fade-up">

          {/* Overline */}
          <p className="t-label text-vestige-stone mb-7">
            AI Personal Stylist
          </p>

          {/* Hero headline — Playfair 900, very large */}
          <h1
            className="font-serif text-vestige-ink text-balance"
            style={{
              fontSize: "clamp(3.25rem, 6.5vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 1.03,
              letterSpacing: "-0.025em",
            }}
          >
            Your style<br />
            <span style={{ fontWeight: 400, fontStyle: "italic" }}>
              leaves a trace.
            </span>
          </h1>

          {/* Lead copy — DM Sans light */}
          <p
            className="font-sans text-vestige-umber text-balance mt-7 mb-11"
            style={{ fontSize: "1.0625rem", fontWeight: 300, lineHeight: 1.75, maxWidth: "38ch" }}
          >
            Vestige is the stylist that remembers. Every session deepens
            your profile — so recommendations feel less like guesswork
            and more like genuine understanding.
          </p>

          {/* CTA row — one gold, one plain */}
          <div className="flex flex-wrap items-center gap-4">
            {authed ? (
              <Link href="/session/new" className="btn-accent btn-lg">
                Begin Styling
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-accent btn-lg">
                  Begin your style story
                </Link>
                <Link href="/login" className="btn-ghost text-vestige-bark" style={{ fontSize: "0.875rem" }}>
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Technology trust line */}
          <div className="flex items-center gap-7 mt-14 mb-4">
            {[
              { label: "YouCam Skin AI", sub: "Complexion analysis" },
              { label: "Virtual Try-On", sub: "See it on you" },
              { label: "Personal stylist", sub: "Persistent memory" },
            ].map(({ label, sub }) => (
              <div key={label}>
                <p className="font-sans text-vestige-ink" style={{ fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "0.01em" }}>
                  {label}
                </p>
                <p className="t-label-sm text-vestige-stone mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image composition (hidden on mobile) */}
        <div className="hidden lg:grid grid-rows-[1fr_1fr] gap-2.5 p-4 pt-[60px] bg-vestige-parchment">
          <EditorialImage aspect="landscape" variant={0} className="w-full h-full" overlayText="Look" />
          <div className="grid grid-cols-2 gap-2.5">
            <EditorialImage aspect="square" variant={5} className="w-full h-full" />
            <EditorialImage aspect="square" variant={3} className="w-full h-full" />
          </div>
        </div>

        {/* Mobile image strip */}
        <div className="lg:hidden px-5 pb-12">
          <EditorialImage aspect="wide" variant={0} className="w-full" />
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────
          PULL QUOTE — full-width dark bar
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-vestige-ink py-12 px-fluid">
        <p
          className="font-serif text-vestige-cream text-center text-balance mx-auto"
          style={{
            fontSize: "clamp(1.25rem, 2.75vw, 1.875rem)",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.45,
            maxWidth: "58ch",
          }}
        >
          &ldquo;Every interaction leaves a trace that contributes to
          your evolving style profile.&rdquo;
        </p>
      </div>


      {/* ─────────────────────────────────────────────────────────
          THE LOOP — numbered steps, full width, sparse
      ───────────────────────────────────────────────────────────── */}
      <section className="py-section container-xl">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <p className="t-label text-vestige-stone mb-5">The system</p>
            <h2
              className="font-serif text-vestige-ink"
              style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.875rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              Style, remembered<br />and compounded.
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="flex-shrink-0 flex items-center gap-1.5 font-sans text-vestige-bark hover:text-vestige-ink transition-colors"
            style={{ fontSize: "0.8125rem" }}
          >
            Full walkthrough <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
          {[
            { n: "01", title: "Skin-aware analysis",     body: "YouCam returns facial skin color and concern scores for complexion-aware styling." },
            { n: "02", title: "Intention-driven styling", body: "Choose how you want to feel. Three curated outfits built around your complexion and that intention." },
            { n: "03", title: "Virtual try-on",           body: "Try on a ranked catalog garment or upload another piece. YouCam renders one garment at a time on your photo." },
            { n: "04", title: "Memory that compounds",    body: "Every like, rejection, and note is stored. Session five looks nothing like session one." },
          ].map(({ n, title, body }) => (
            <div key={n}>
              <p
                className="font-serif text-vestige-sand select-none mb-5"
                style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1 }}
              >
                {n}
              </p>
              <div className="accent-mark mb-4" />
              <h3
                className="font-serif text-vestige-ink mb-3"
                style={{ fontSize: "1.1875rem", fontWeight: 500, lineHeight: 1.3 }}
              >
                {title}
              </h3>
              <p className="font-sans text-vestige-bark" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────
          SPLIT — personalization story
          Large image left, narrative right. Asymmetric on purpose.
      ───────────────────────────────────────────────────────────── */}
      <section className="py-section bg-vestige-parchment">
        <div className="container-xl grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-12 lg:gap-20 items-center">

          {/* Image — dominant */}
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <EditorialImage aspect="portrait" variant={1} className="w-full" />
            <div className="flex flex-col gap-3 pt-10">
              <EditorialImage aspect="square"   variant={5} className="w-full" />
              <EditorialImage aspect="landscape" variant={2} className="w-full" />
            </div>
          </div>

          {/* Copy */}
          <div>
            <p className="t-label text-vestige-stone mb-7">The memory</p>
            <h2
              className="font-serif text-vestige-ink mb-6 text-balance"
              style={{ fontSize: "clamp(1.875rem, 3vw, 2.75rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              A stylist that gets<br />better over time.
            </h2>
            <p className="font-sans text-vestige-umber mb-5 text-balance" style={{ fontSize: "1.0625rem", fontWeight: 300, lineHeight: 1.75 }}>
              Most styling tools treat every session as the first.
              Vestige builds a persistent profile from your skin analysis,
              your choices, and your feedback.
            </p>
            <p className="font-sans text-vestige-bark mb-10" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
              By your fifth session, Vestige knows you prefer muted earth
              tones over saturated colour, relaxed silhouettes over
              structure, and that you always reject anything too formal.
            </p>
            <Link
              href={authed ? "/style-profile" : "/signup"}
              className="btn-primary"
            >
              {authed ? "View your profile" : "Start building yours"}
            </Link>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────
          INTENTIONS — horizontal strip
          Not cards. Seven mood words with a colour accent.
      ───────────────────────────────────────────────────────────── */}
      <section className="py-section container-xl">
        <p className="t-label text-vestige-stone mb-6">How do you want to feel?</p>
        <h2
          className="font-serif text-vestige-ink mb-14 text-balance"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.015em", maxWidth: "24ch" }}
        >
          Choose an intention. Every recommendation starts here.
        </h2>

        {/* Horizontal list — no cards, just type and a colour swatch */}
        <div className="divide-y divide-vestige-sand">
          {[
            { mood: "Confident",    desc: "Strong silhouettes. Deliberate colour. An outfit that arrives before you do.",     swatch: "#58463A" },
            { mood: "Calm",         desc: "Soft fabrications, unhurried lines. Clothes that feel like breathing.",             swatch: "#8C9E88" },
            { mood: "Bold",         desc: "Colour, contrast, proportion. Deliberately and unapologetically striking.",        swatch: "#C07060" },
            { mood: "Professional", desc: "Polished without being stiff. Precision, quality, and the right impression.",      swatch: "#3A3028" },
            { mood: "Playful",      desc: "Pattern, texture, joy. The outfit communicates before you speak.",                 swatch: "#B89060" },
            { mood: "Minimal",      desc: "Nothing excess. Every piece earns its place. Restraint as a statement.",           swatch: "#A09080" },
            { mood: "Experimental", desc: "Conventional rules treated as suggestions. Vestige shows you the unexpected.",     swatch: "#607080" },
          ].map(({ mood, desc, swatch }, i) => (
            <div
              key={mood}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5 hover:bg-vestige-parchment/60 transition-colors duration-150 px-1"
            >
              {/* Index */}
              <span className="font-sans text-vestige-stone w-6 text-right" style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10">
                <h3
                  className="font-serif text-vestige-ink flex-shrink-0"
                  style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 500, minWidth: "8.5rem" }}
                >
                  {mood}
                </h3>
                <p className="font-sans text-vestige-bark" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>

              {/* Colour swatch */}
              <div
                className="h-6 w-6 rounded-full flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: swatch }}
              />
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────
          CLOSING CTA — dark, generous space, single action
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-vestige-ink noise-overlay py-section">
        <div className="container-md text-center">
          <p className="t-label text-vestige-stone mb-8">Begin</p>
          <h2
            className="font-serif text-vestige-cream text-balance mx-auto mb-7"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.25rem)",
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              maxWidth: "18ch",
            }}
          >
            Ready to leave<br />a trace?
          </h2>
          <p
            className="font-sans text-vestige-stone text-balance mx-auto mb-12"
            style={{ fontSize: "1.0625rem", fontWeight: 300, lineHeight: 1.7, maxWidth: "36ch" }}
          >
            Your first session is where it begins. Every interaction
            after that makes Vestige yours.
          </p>
          {authed ? (
            <Link href="/session/new" className="btn-accent btn-xl">
              Begin Styling
            </Link>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup" className="btn-accent btn-xl">
                Create your profile
              </Link>
              <Link
                href="/login"
                className="btn-ghost text-vestige-stone hover:text-vestige-cream"
                style={{ fontSize: "0.9375rem", padding: "1.125rem 1.5rem" }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </PublicShell>
  );
}
