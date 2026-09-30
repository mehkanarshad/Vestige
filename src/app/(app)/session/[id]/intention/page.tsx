"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { StyleIntention } from "@/types";
import { cn } from "@/lib/utils";

const INTENTIONS: {
  value: StyleIntention;
  label: string;
  description: string;
  palette: string[];
}[] = [
  {
    value: "confident",
    label: "Confident",
    description: "Bold presence. Strong lines. An outfit that walks into a room.",
    palette: ["#3D2B1F", "#C9A96E", "#8C7B6B"],
  },
  {
    value: "calm",
    label: "Calm",
    description: "Soft, unhurried. Clothes that feel like breathing.",
    palette: ["#E8DDD0", "#C4B8A8", "#7A8C7B"],
  },
  {
    value: "bold",
    label: "Bold",
    description: "Colour, contrast, and intention. Deliberately striking.",
    palette: ["#C4897A", "#C9A96E", "#3D2B1F"],
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished and considered. The right impression, effortlessly.",
    palette: ["#3D2B1F", "#8C7B6B", "#E8DDD0"],
  },
  {
    value: "playful",
    label: "Playful",
    description: "Joy in the details. Prints, texture, and lightness.",
    palette: ["#C4897A", "#7A8C7B", "#C9A96E"],
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Nothing excess. Only what belongs. A quiet confidence.",
    palette: ["#F5F0E8", "#C4B8A8", "#3D2B1F"],
  },
  {
    value: "experimental",
    label: "Experimental",
    description: "Rules as suggestions. Vestige shows you the unexpected.",
    palette: ["#7A8C7B", "#C4897A", "#C9A96E"],
  },
];

export default function IntentionStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { setIntention, intention: savedIntention } = useSessionStore();
  const [selected, setSelected] = useState<StyleIntention | null>(
    savedIntention
  );
  const [loading, setLoading] = useState(false);

  async function proceed() {
    if (!selected) return;
    setLoading(true);
    setIntention(selected);

    // Persist intention to session
    await fetch(`/api/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention: selected, completedStep: 3 }),
    });

    router.push(`/session/${id}/recommend`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <StepIndicator current={3} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          How do you want to feel?
        </h1>
        <p className="body-lg text-sm">
          Your intention shapes everything. Choose the energy you&apos;re
          dressing for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTENTIONS.map(({ value, label, description, palette }) => (
          <button
            key={value}
            onClick={() => setSelected(value)}
            className={cn(
              "w-full text-left rounded-lg border p-4 transition-all duration-200",
              selected === value
                ? "border-vestige-espresso bg-white shadow-md ring-1 ring-vestige-espresso/20"
                : "border-vestige-sand bg-white/60 hover:border-vestige-bark hover:bg-white"
            )}
            aria-pressed={selected === value}
          >
            {/* Palette strip */}
            <div className="flex gap-1 mb-3">
              {palette.map((c, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="font-serif text-lg text-vestige-ink mb-1">{label}</p>
            <p className="font-sans text-xs text-vestige-bark leading-relaxed">
              {description}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={proceed}
        disabled={!selected || loading}
        className="mt-8 btn-primary w-full gap-2"
      >
        {loading ? "Generating outfits…" : "Generate my outfits"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
