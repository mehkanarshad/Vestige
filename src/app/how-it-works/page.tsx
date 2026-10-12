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
    body: "Each clear, well-lit face-and-shoulders photo receives a fresh YouCam skin-concern analysis. Your first analysis also creates a saved Skin Passport with facial skin color for styling.",
    detail: "Vestige compares concern estimates with your previous analyzed session. Scores can vary with lighting and photo conditions; they are not a medical assessment.",
    tags: ["YouCam API", "Concern + color analysis"],
    index: 0,
  },
  {
    n: "02",
    label: "Analyse",
    title: "Skin-aware colour intelligence.",
    body: "Each session stores fresh YouCam concern estimates. Vestige converts the facial skin-color result to CIELAB and estimates an undertone from its measured color direction; YouCam does not return an undertone label.",
    detail: "The undertone is a color-based styling estimate, not a YouCam or medical result. Lighting can affect it. Concern-score changes do not claim clinical improvement or decline.",
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
    body: "After each session, Vestige updates your Style Profile. Every five distinct sessions with feedback, it compares stored skin analyses, feedback outcomes, intentions, and catalog-attribute preferences to create a measured evolution snapshot.",
    detail: "Snapshots are calculated from the session history rather than copied from the accumulated profile. Skin concern values are automated estimates and can vary with photo conditions.",
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
