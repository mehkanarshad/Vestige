import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Footer } from "@/components/layout/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";
import { Tag } from "@/components/ui/tag";
import { ArrowRight, Camera, Check, Heart, Shirt, SlidersHorizontal, ThumbsDown, type LucideIcon } from "lucide-react";

type StepVisualKind = "photo" | "analysis" | "intention" | "catalog" | "tryon" | "feedback" | "profile";

const STEPS = [
  {
    n: "01",
    label: "Upload",
    title: "A photo. That's all it takes.",
    body: "Each clear, well-lit face-and-shoulders photo receives a fresh YouCam skin-concern analysis. Your first analysis also creates a saved Skin Passport with facial skin color for styling.",
    detail: "Vestige compares concern estimates with your previous analyzed session. Scores can vary with lighting and photo conditions; they are not a medical assessment.",
    tags: ["YouCam API", "Concern + color analysis"],
    visual: "photo" as StepVisualKind,
  },
  {
    n: "02",
    label: "Analyse",
    title: "Skin-aware colour intelligence.",
    body: "Each session stores fresh YouCam concern estimates. Vestige converts the facial skin-color result to CIELAB and estimates an undertone from its measured color direction; YouCam does not return an undertone label.",
    detail: "The undertone is a color-based styling estimate, not a YouCam or medical result. Lighting can affect it. Concern-score changes do not claim clinical improvement or decline.",
    tags: ["Skin color", "Concern scores"],
    visual: "analysis" as StepVisualKind,
  },
  {
    n: "03",
    label: "Intend",
    title: "How do you want to feel?",
    body: "Choose an intention — Confident, Calm, Bold, Professional, Playful, Minimal, or Experimental. Vestige includes it in product searches and scores available catalog style, silhouette, formality, and texture attributes against it.",
    detail: "Your intention history is remembered. If you consistently choose Calm, future sessions weight that preference automatically.",
    tags: ["7 intentions", "Remembered across sessions"],
    visual: "intention" as StepVisualKind,
  },
  {
    n: "04",
    label: "Recommend",
    title: "Catalog picks. Ranked, not invented.",
    body: "Vestige searches for real in-stock products based on your intention, then ranks those catalog picks using your skin-color analysis and saved garment preferences.",
    detail: "Each pick is a product in Vestige's garment catalog, with its own image, retailer, and available product attributes.",
    tags: ["Real products", "Personalized ranking"],
    visual: "catalog" as StepVisualKind,
  },
  {
    n: "05",
    label: "Try On",
    title: "See it on yourself.",
    body: "Try on one catalog pick or upload another garment photo. YouCam Clothes Virtual Try-On renders one garment at a time on your photo.",
    detail: "Save the tried-on piece with your session, revisit it later, and use your feedback to rank future catalog picks.",
    tags: ["YouCam Clothes VTO", "One garment at a time"],
    visual: "tryon" as StepVisualKind,
  },
  {
    n: "06",
    label: "React",
    title: "Love it. Adjust it. Reject it.",
    body: "Your reaction is the signal that matters most. A like reinforces the style direction. A rejection teaches Vestige what to avoid. A note — 'too formal', 'wrong palette' — is stored verbatim and fed back into your next session.",
    detail: "Feedback is weighted, not discarded. Multiple rejections of the same pattern eventually remove it from future suggestions.",
    tags: ["Liked", "Adjusted", "Rejected"],
    visual: "feedback" as StepVisualKind,
  },
  {
    n: "07",
    label: "Compound",
    title: "The profile that grows with you.",
    body: "After each session, Vestige updates your Style Profile. Every five distinct sessions with feedback, it compares stored skin analyses, feedback outcomes, intentions, and catalog-attribute preferences to create a measured evolution snapshot.",
    detail: "Snapshots are calculated from the session history rather than copied from the accumulated profile. Skin concern values are automated estimates and can vary with photo conditions.",
    tags: ["Style Profile", "Evolution timeline"],
    visual: "profile" as StepVisualKind,
  },
];

function StepVisual({ kind }: { kind: StepVisualKind }) {
  const panel = "relative flex min-h-[280px] aspect-[3/2] flex-col justify-between overflow-hidden border border-vestige-sand bg-vestige-parchment p-6 sm:p-8";

  if (kind === "photo") {
    return (
      <div className={panel} aria-hidden="true">
        <p className="t-label text-vestige-stone">New styling session</p>
        <div className="mx-auto flex w-full max-w-xs flex-1 flex-col items-center justify-center border border-dashed border-vestige-stone/70 bg-vestige-cream/70 my-5">
          <Camera className="h-7 w-7 text-vestige-umber mb-3" strokeWidth={1.4} />
          <p className="font-serif text-vestige-ink">Add a clear portrait</p>
          <p className="t-label-sm text-vestige-stone mt-1">Face and shoulders in frame</p>
        </div>
        <div className="flex items-center justify-between border-t border-vestige-sand pt-4">
          <span className="t-body-sm">Your photo stays with this session</span>
          <span className="flex h-7 w-7 items-center justify-center bg-vestige-ink text-vestige-cream"><ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    );
  }

  if (kind === "analysis") {
    return (
      <div className={panel} aria-hidden="true">
        <p className="t-label text-vestige-stone">Photo analysis</p>
        <div className="space-y-3 my-auto">
          {[
            ["Facial skin color", "Color compatibility"],
            ["Concern estimates", "For information"],
            ["Saved reference", "Skin Passport"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-vestige-sand pb-3">
              <span className="font-serif text-vestige-ink">{label}</span>
              <span className="t-label-sm text-vestige-bark">{value}</span>
            </div>
          ))}
        </div>
        <p className="t-label-sm text-vestige-stone">Styling context, not a medical result</p>
      </div>
    );
  }

  if (kind === "intention") {
    return (
      <div className={panel} aria-hidden="true">
        <p className="t-label text-vestige-stone">Today’s intention</p>
        <div className="my-auto">
          <p className="font-serif text-2xl text-vestige-ink mb-5">How do you want to feel?</p>
          <div className="flex flex-wrap gap-2">
            {["Confident", "Calm", "Bold", "Professional", "Playful", "Minimal", "Experimental"].map((label) => (
              <span key={label} className="border border-vestige-sand bg-vestige-cream px-3 py-1.5 t-body-sm">{label}</span>
            ))}
          </div>
        </div>
        <p className="t-label-sm text-vestige-stone">One choice guides the product search</p>
      </div>
    );
  }

  if (kind === "catalog") {
    return (
      <div className={panel} aria-hidden="true">
        <div className="flex items-center justify-between">
          <p className="t-label text-vestige-stone">Catalog search</p>
          <span className="t-label-sm text-vestige-sage">In-stock items</span>
        </div>
        <div className="grid grid-cols-2 gap-2 my-auto">
          {["Tops", "Bottoms", "Dresses", "Outerwear"].map((label, index) => (
            <div key={label} className="flex items-center justify-between border border-vestige-sand bg-vestige-cream px-4 py-3">
              <span className="font-serif text-vestige-ink">{label}</span>
              <span className="t-label-sm text-vestige-gold">0{index + 1}</span>
            </div>
          ))}
        </div>
        <p className="t-label-sm text-vestige-stone">Products come from live retailer search</p>
      </div>
    );
  }

  if (kind === "tryon") {
    return (
      <div className={panel} aria-hidden="true">
        <p className="t-label text-vestige-stone">One-piece virtual try-on</p>
        <div className="my-auto border border-vestige-sand bg-vestige-cream p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-vestige-sand bg-vestige-parchment text-vestige-bark">
              <Shirt className="h-8 w-8" strokeWidth={1.3} />
            </div>
            <div>
              <p className="font-serif text-vestige-ink">Choose one garment</p>
              <p className="t-body-sm mt-1">Select a catalog pick or upload a piece.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-vestige-sand pt-4">
            <span className="t-label-sm text-vestige-stone">Rendered on your session photo</span>
            <ArrowRight className="h-4 w-4 text-vestige-gold" />
          </div>
        </div>
        <p className="t-label-sm text-vestige-stone">YouCam renders one selected piece at a time</p>
      </div>
    );
  }

  if (kind === "feedback") {
    const actions: { Icon: LucideIcon; label: string }[] = [
      { Icon: Heart, label: "Like" },
      { Icon: SlidersHorizontal, label: "Adjust" },
      { Icon: ThumbsDown, label: "Reject" },
    ];

    return (
      <div className={panel} aria-hidden="true">
        <p className="t-label text-vestige-stone">Your response shapes future picks</p>
        <div className="grid grid-cols-3 gap-2 my-auto">
          {actions.map(({ Icon, label }) => (
            <div key={label} className="flex min-h-24 flex-col items-center justify-center gap-2 border border-vestige-sand bg-vestige-cream text-vestige-umber">
              <Icon className="h-5 w-5" strokeWidth={1.4} />
              <span className="t-label-sm">{label}</span>
            </div>
          ))}
        </div>
        <p className="t-label-sm text-vestige-stone">Saved to your garment preferences</p>
      </div>
    );
  }

  return (
    <div className={panel} aria-hidden="true">
      <p className="t-label text-vestige-stone">Signals remembered</p>
      <div className="my-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="space-y-2">
          {["Skin color", "Intention", "Garment feedback"].map((label) => (
            <div key={label} className="border border-vestige-sand bg-vestige-cream px-3 py-2 t-label-sm text-vestige-bark">{label}</div>
          ))}
        </div>
        <ArrowRight className="h-4 w-4 text-vestige-gold" />
        <div className="border border-vestige-sand bg-vestige-ink px-4 py-5 text-center text-vestige-cream">
          <Check className="h-5 w-5 mx-auto mb-2 text-vestige-accent-lt" />
          <span className="t-label-sm">Future ranking</span>
        </div>
      </div>
      <p className="t-label-sm text-vestige-stone">Built from session history</p>
    </div>
  );
}

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

              <StepVisual kind={step.visual} />
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
