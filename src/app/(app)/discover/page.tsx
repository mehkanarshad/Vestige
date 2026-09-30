import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";
import { Tag } from "@/components/ui/tag";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const EDITORIAL_PICKS = [
  {
    label: "The edit",
    title: "Earth-tone dressing for autumn",
    body: "Why warm neutrals are the smartest wardrobe investment you can make this season.",
    tags: ["Minimal", "Earth tones", "Autumn"],
    index: 0,
  },
  {
    label: "Skin × colour",
    title: "Colour theory for warm undertones",
    body: "A practical guide to which palettes flatter golden, peachy, and olive complexions.",
    tags: ["Warm undertone", "Colour theory"],
    index: 1,
  },
  {
    label: "Intention",
    title: "Dressing professionally without dressing boringly",
    body: "Structure, texture, and restraint — three principles that make professional dressing compelling.",
    tags: ["Professional", "Tailoring"],
    index: 2,
  },
  {
    label: "Silhouette",
    title: "The case for wide-leg trousers",
    body: "A silhouette that flatters most body types and anchors an outfit with effortless ease.",
    tags: ["Relaxed silhouette", "Bottoms"],
    index: 3,
  },
  {
    label: "Texture",
    title: "Mixing textures without chaos",
    body: "How to layer linen, wool, and leather in a way that reads as intentional, not accidental.",
    tags: ["Layering", "Texture"],
    index: 0,
  },
  {
    label: "Palette",
    title: "Monochromatic dressing: a masterclass",
    body: "From ivory head-to-toe to sage on sage — how tone-on-tone dressing creates quiet impact.",
    tags: ["Minimal", "Monochromatic"],
    index: 1,
  },
];

const STYLE_MOODS = [
  { mood: "Minimal",       desc: "Nothing excess. Only what belongs.",          index: 2 },
  { mood: "Confident",     desc: "Strong lines. An outfit that walks in first.", index: 3 },
  { mood: "Calm",          desc: "Soft, unhurried. Clothes that breathe.",       index: 0 },
  { mood: "Experimental",  desc: "Rules as suggestions.",                        index: 1 },
];

export default async function DiscoverPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="py-section">

      {/* ── Header ── */}
      <div className="container-lg mb-14">
        <SectionLabel className="mb-6">Discover</SectionLabel>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <h1 className="t-display-lg text-vestige-ink max-w-lg text-balance">
            Style intelligence,<br />curated for you.
          </h1>
          <Link href="/styling-session" className="btn-gold btn-sm gap-1.5 flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            Start a session
          </Link>
        </div>
      </div>

      {/* ── Featured editorial — large ── */}
      <div className="container-xl mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-sm overflow-hidden border border-vestige-sand">
          <PhotoPlaceholder aspect="landscape" index={2} className="rounded-none h-full min-h-[280px]" />
          <div className="p-8 sm:p-12 flex flex-col justify-center bg-white/40">
            <SectionLabel className="mb-5">Featured</SectionLabel>
            <h2 className="t-display-md text-vestige-ink mb-4 text-balance">
              Why your skin tone should drive your wardrobe — not follow it.
            </h2>
            <p className="t-body-md text-vestige-umber mb-6 text-balance">
              Most people choose clothes they like in isolation. Vestige starts from your
              complexion and builds outward — the difference is visible.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <Tag variant="gold">Skin analysis</Tag>
              <Tag variant="muted">Colour theory</Tag>
              <Tag variant="muted">Personalisation</Tag>
            </div>
            <Link href="/how-it-works" className="flex items-center gap-1.5 t-body-sm text-vestige-bark hover:text-vestige-espresso transition-colors">
              Read the methodology <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <Divider className="container-xl mb-16" />

      {/* ── Editorial picks grid ── */}
      <div className="container-xl mb-16">
        <SectionLabel className="mb-10">The Edit</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EDITORIAL_PICKS.map((item) => (
            <div
              key={item.title}
              className="group border border-vestige-sand rounded-sm overflow-hidden hover:border-vestige-bark hover:shadow-lifted transition-all duration-200"
            >
              <PhotoPlaceholder aspect="landscape" index={item.index} className="rounded-none" />
              <div className="p-5">
                <p className="t-label text-vestige-gold mb-2">{item.label}</p>
                <h3 className="font-serif text-[1.1rem] text-vestige-ink mb-2 leading-snug text-balance">
                  {item.title}
                </h3>
                <p className="t-body-sm text-vestige-bark leading-relaxed mb-4">
                  {item.body}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => <Tag key={t} variant="muted">{t}</Tag>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider className="container-xl mb-16" />

      {/* ── Style moods ── */}
      <div className="container-xl">
        <SectionLabel className="mb-10">Style moods</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STYLE_MOODS.map(({ mood, desc, index }) => (
            <Link
              key={mood}
              href="/styling-session"
              className="group relative rounded-sm overflow-hidden border border-vestige-sand hover:border-vestige-bark transition-colors duration-200"
            >
              <PhotoPlaceholder aspect="portrait" index={index} className="rounded-none opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-vestige-ink/70 via-vestige-ink/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4">
                <p className="font-serif text-vestige-cream text-[1.1rem] leading-tight">{mood}</p>
                <p className="t-body-sm text-vestige-stone/80 mt-1 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
