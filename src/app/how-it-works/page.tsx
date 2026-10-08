import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Footer } from "@/components/layout/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { Tag } from "@/components/ui/tag";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "01",
    label: "Upload",
    title: "A photo. That's all it takes.",
    body: "Your first clear, well-lit face-and-shoulders photo creates a Skin Passport from YouCam's concern scores and facial skin color.",
    detail: "The passport is saved once. Later sessions reuse it; the current portrait is sent to YouCam only when analysis is first created or a try-on is rendered. It is never sold.",
    tags: ["YouCam API", "Concern + color analysis"],
    index: 0,
  },
  {
    n: "02",
    label: "Analyse",
    title: "Skin-aware colour intelligence.",
    body: "YouCam returns concern scores and facial skin color once. Vestige converts that color to CIELAB coordinates and stores both coordinates and concerns in your Skin Passport; YouCam does not return an undertone label.",
    detail: "The analysis informs complexion-aware color suggestions without assigning a warm, cool, or neutral undertone.",
    tags: ["Skin color", "Concern scores"],
    index: 1,
  },
  {
    n: "03",
    label: "Intend",
    title: "How do you want to feel?",
    body: "Choose an intention — Confident, Calm, Bold, Professional, Playful, Minimal, or Experimental. This is not a mood board filter. It shapes every silhouette, colour, and proportion decision the stylist makes.",
    detail: "Your intention history is remembered. If you consistently choose Calm, future sessions weight that preference automatically.",
    tags: ["7 intentions", "Remembered across sessions"],
    index: 2,
  },
  {
    n: "04",
    label: "Recommend",
    title: "Catalog picks. Ranked, not invented.",
    body: "Vestige searches for real in-stock products based on your intention, then ranks those catalog picks using your skin-color analysis and saved garment preferences.",
    detail: "Each pick is a product in Vestige's garment catalog, with its own image, retailer, and available product attributes.",
    tags: ["Real products", "Personalized ranking"],
    index: 3,
  },
  {
    n: "05",
    label: "Try On",
    title: "See it on yourself.",
    body: "Try on one catalog pick or upload another garment photo. YouCam Clothes Virtual Try-On renders one garment at a time on your photo.",
    detail: "Save the tried-on piece with your session, revisit it later, and use your feedback to rank future catalog picks.",
    tags: ["YouCam Clothes VTO", "One garment at a time"],
    index: 0,
  },
  {
    n: "06",
    label: "React",
    title: "Love it. Adjust it. Reject it.",
    body: "Your reaction is the signal that matters most. A like reinforces the style direction. A rejection teaches Vestige what to avoid. A note — 'too formal', 'wrong palette' — is stored verbatim and fed back into your next session.",
    detail: "Feedback is weighted, not discarded. Multiple rejections of the same pattern eventually remove it from future suggestions.",
    tags: ["Liked", "Adjusted", "Rejected"],
    index: 1,
  },
  {
    n: "07",
    label: "Compound",
    title: "The profile that grows with you.",
    body: "After each session, Vestige updates your Style Profile — preferred aesthetics, avoided patterns, colour palette, skin history, and intention frequency. Every fifth session creates a Style Evolution snapshot.",
    detail: "The profile is additive, not destructive. A single outlier session cannot overwrite a well-established pattern.",
    tags: ["Style Profile", "Evolution timeline"],
    index: 2,
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      {/* ── Hero ── */}
      <section className="py-section container-lg">
        <SectionLabel className="mb-8">The process</SectionLabel>
        <h1 className="t-display-xl text-vestige-ink max-w-2xl text-balance mb-6">
          How Vestige works.
        </h1>
        <p className="t-body-xl text-vestige-umber max-w-xl text-balance">
          Seven steps. One loop that gets smarter every time you use it.
        </p>
      </section>

      <Divider className="container-xl" />

      {/* ── Steps ── */}
      <section className="py-section container-lg space-y-24">
        {STEPS.map((step, i) => {
          const flip = i % 2 === 1;
          return (
            <div
              key={step.n}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Text */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif text-[3rem] text-vestige-sand leading-none select-none">
                    {step.n}
                  </span>
                  <div>
                    <p className="t-label text-vestige-gold mb-0.5">{step.label}</p>
                    <div className="gold-line" />
                  </div>
                </div>

                <h2 className="t-display-sm text-vestige-ink mb-4 text-balance">
                  {step.title}
                </h2>
                <p className="t-body-lg text-vestige-umber mb-4 text-balance">
                  {step.body}
                </p>
                <p className="t-body-sm text-vestige-bark border-l-2 border-vestige-sand pl-4 italic">
                  {step.detail}
                </p>

                <div className="flex flex-wrap gap-2 mt-6">
                  {step.tags.map((t) => (
                    <Tag key={t} variant="muted">{t}</Tag>
                  ))}
                </div>
              </div>

              {/* Visual */}
              <PhotoPlaceholder
                aspect="landscape"
                index={step.index}
                label={`Step ${step.n} — ${step.label}`}
              />
            </div>
          );
        })}
      </section>

      <Divider className="container-xl" />

      {/* ── Memory section ── */}
      <section className="py-section bg-vestige-espresso noise-overlay relative overflow-hidden">
        <div className="container-md text-center relative z-10">
          <SectionLabel gold className="mb-8 justify-center">The differentiator</SectionLabel>
          <h2 className="t-display-lg text-vestige-cream text-balance mb-6">
            Persistent personalisation.
          </h2>
          <p className="t-body-lg text-vestige-stone max-w-lg mx-auto mb-10 text-balance">
            Most styling tools treat every session as the first. Vestige builds
            a model of you that compounds. The more you use it, the more
            precisely it knows what works.
          </p>
          <Link href="/signup" className="btn-gold btn-xl gap-2">
            Start your style story
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </PublicShell>
  );
}
