import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";
import { Tag } from "@/components/ui/tag";
import { EditorialImage } from "@/components/ui/photo-placeholder";
import { ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const EDITORIAL_PICKS = [
  {
    label: "Photo",
    title: "Fresh context for each session.",
    body: "A new YouCam skin-color analysis contributes to color compatibility. Photo conditions can affect the estimate.",
    tags: ["Session photo", "Styling context"],
  },
  {
    label: "Intention",
    title: "Start with how you want to feel.",
    body: "Your selected intention is included in apparel searches and in the match score for available catalog items.",
    tags: ["Seven intentions", "Search context"],
  },
  {
    label: "Catalog",
    title: "Products come from live retailer search.",
    body: "Vestige searches for in-stock apparel and stores usable product images, categories, colors, and retailer offers.",
    tags: ["Channel3", "Retail listings"],
  },
  {
    label: "Ranking",
    title: "See why a piece ranked.",
    body: "Recommendations combine color compatibility, intention fit, saved preferences, and collaborative signals when available.",
    tags: ["Match factors", "Explainable scores"],
  },
  {
    label: "Try-on",
    title: "Preview one garment at a time.",
    body: "YouCam Clothes Virtual Try-On renders one selected catalog piece or uploaded garment on your session photo.",
    tags: ["Virtual try-on", "One garment"],
  },
  {
    label: "Feedback",
    title: "Your reactions guide later picks.",
    body: "Likes, rejections, and garment reactions update preference signals used in future catalog ranking.",
    tags: ["Saved preferences", "Style history"],
  },
];

const STYLE_MOODS = [
  { mood: "Minimal",       desc: "Nothing excess. Only what belongs.",           color: "#B0A090" },
  { mood: "Confident",     desc: "Strong lines. An outfit that walks in first.", color: "#58463A" },
  { mood: "Calm",          desc: "Soft, unhurried. Clothes that breathe.",        color: "#7A8C76" },
  { mood: "Experimental",  desc: "Rules as suggestions.",                         color: "#B8924A" },
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
          <EditorialImage subject="wardrobe-edit" className="rounded-none h-full min-h-[280px]" caption="A considered edit of wearable pieces" />
          <div className="p-8 sm:p-12 flex flex-col justify-center bg-white/40">
            <SectionLabel className="mb-5">Featured</SectionLabel>
            <h2 className="t-display-md text-vestige-ink mb-4 text-balance">
              Individual catalog pieces, chosen with context.
            </h2>
            <p className="t-body-md text-vestige-umber mb-6 text-balance">
              Vestige searches real apparel listings, then ranks single products using
              your skin-color compatibility, selected intention, and saved preferences.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <Tag variant="gold">Skin color</Tag>
              <Tag variant="muted">Styling intention</Tag>
              <Tag variant="muted">Garment feedback</Tag>
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] items-center gap-8 lg:gap-14 mb-10">
          <div>
            <SectionLabel className="mb-5">What shapes your picks</SectionLabel>
            <h2 className="font-serif text-vestige-ink text-2xl sm:text-3xl leading-tight text-balance max-w-lg">
              A real catalog, ranked with your context.
            </h2>
            <p className="t-body-sm text-vestige-bark mt-3 max-w-lg">
              Photos here set an editorial mood; products shown in a session come from live retailer search.
            </p>
          </div>
          <EditorialImage subject="catalog-context" caption="Retail context for the live apparel catalog" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EDITORIAL_PICKS.map((item, index) => (
            <div
              key={item.title}
              className="group border border-vestige-sand rounded-sm overflow-hidden hover:border-vestige-bark hover:shadow-lifted transition-all duration-200"
            >
              <div className="flex min-h-[5.5rem] items-end justify-between border-b border-vestige-sand bg-vestige-parchment px-5 py-4">
                <p className="t-label text-vestige-gold">{item.label}</p>
                <span className="font-serif text-3xl leading-none text-vestige-sand" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] mb-8 border border-vestige-sand bg-vestige-parchment">
          <div className="flex flex-col justify-center p-7 sm:p-9">
            <SectionLabel className="mb-4">Style moods</SectionLabel>
            <h2 className="font-serif text-vestige-ink text-2xl sm:text-3xl leading-tight text-balance">
              Start with the feeling. Find the pieces.
            </h2>
            <p className="t-body-sm text-vestige-bark mt-3 max-w-md">
              Choose an intention to shape the product search, then explore the live catalog picks Vestige can actually rank for you.
            </p>
          </div>
          <div className="relative aspect-[3/2] lg:aspect-auto lg:min-h-[250px] overflow-hidden">
            <Image
              src="/images/editorial/style-mood.jpg"
              alt="Autumn-toned garments arranged together as a fashion color story"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-vestige-parchment/30 via-transparent to-transparent" aria-hidden="true" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STYLE_MOODS.map(({ mood, desc, color }) => (
            <Link
              key={mood}
              href="/styling-session"
              className="group relative flex min-h-[190px] flex-col justify-between rounded-sm overflow-hidden border border-vestige-sand p-5 transition-colors duration-200 hover:border-vestige-bark"
            >
              <div aria-hidden="true" className="absolute inset-0 opacity-[0.09] transition-opacity group-hover:opacity-[0.16]" style={{ background: `radial-gradient(ellipse at 85% 15%, ${color} 0%, transparent 65%)` }} />
              <span className="relative h-1 w-12 rounded-full" style={{ backgroundColor: color }} />
              <div className="relative">
                <p className="font-serif text-vestige-ink text-[1.1rem] leading-tight">{mood}</p>
                <p className="t-body-sm text-vestige-bark mt-1 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
