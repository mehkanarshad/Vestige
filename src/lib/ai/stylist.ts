/**
 * AI Stylist — calls GPT-4o with structured output to generate outfit recommendations.
 */

import OpenAI from "openai";
import { z } from "zod";
import { OutfitRecommendation, StyleIntention, StyleProfileData } from "@/types";
import {
  buildStylistSystemPrompt,
  buildStylistUserPrompt,
  RecentSessionContext,
  StylistPromptInput,
} from "./prompt-builder";
import { SkinSummary } from "@/types";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";

// ── Zod schema for structured output validation ───────────────────────────────

const GarmentItemSchema = z.object({
  category: z.enum(["top", "bottom", "dress", "outerwear", "shoes", "accessory"]),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  imageSearchQuery: z.string(),
  garmentImageUrl: z.string().optional(),
});

const OutfitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  items: z.array(GarmentItemSchema).min(2).max(6),
  colorPalette: z.array(z.string()).min(2).max(5),
  intention: z.string(),
  personalizedReason: z.string(),
  confidence: z.number().min(0).max(1),
});

const RecommendationsSchema = z.array(OutfitSchema).length(3);

// ── Main entry point ──────────────────────────────────────────────────────────

export async function generateRecommendations(
  userId: string,
  skinSummary: SkinSummary,
  intention: StyleIntention
): Promise<OutfitRecommendation[]> {
  // Load style profile
  const profileRow = await prisma.styleProfile.findUnique({
    where: { userId },
  });

  const styleProfile: StyleProfileData | null = profileRow
    ? {
        skinTraits: parseJson(profileRow.skinTraits),
        preferredStyles: parseJson<string[]>(profileRow.preferredStyles) ?? [],
        avoidedStyles: parseJson<string[]>(profileRow.avoidedStyles) ?? [],
        intentions: parseJson<Record<string, number>>(profileRow.intentions) ?? {},
        colorPalette: parseJson<string[]>(profileRow.colorPalette) ?? [],
        styleSummary: profileRow.styleSummary ?? "",
        sessionCount: profileRow.sessionCount,
      }
    : null;

  // Load recent sessions for history
  const recentSessions = await loadRecentSessions(userId, 5);

  const isFirstSession =
    !styleProfile || styleProfile.sessionCount === 0;

  const promptInput: StylistPromptInput = {
    skinSummary,
    intention,
    styleProfile,
    recentSessions,
    isFirstSession,
  };

  // Try real OpenAI call; fall back to mock if key missing
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-...") {
    return mockRecommendations(intention, skinSummary);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildStylistSystemPrompt() },
      {
        role: "user",
        content:
          buildStylistUserPrompt(promptInput) +
          '\n\nReturn your response as: {"recommendations": [...]}',
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const validated = RecommendationsSchema.parse(
    parsed.recommendations ?? parsed
  );

  return validated as OutfitRecommendation[];
}

// ── Style Profile update (called after feedback) ──────────────────────────────

export async function updateStyleProfile(
  userId: string,
  sessionId: string
): Promise<void> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const feedbacks = await prisma.feedback.findMany({
    where: { sessionId },
  });

  const profileRow = await prisma.styleProfile.findUnique({
    where: { userId },
  });

  const currentProfile: StyleProfileData = profileRow
    ? {
        skinTraits: parseJson(profileRow.skinTraits),
        preferredStyles: parseJson<string[]>(profileRow.preferredStyles) ?? [],
        avoidedStyles: parseJson<string[]>(profileRow.avoidedStyles) ?? [],
        intentions: parseJson<Record<string, number>>(profileRow.intentions) ?? {},
        colorPalette: parseJson<string[]>(profileRow.colorPalette) ?? [],
        styleSummary: profileRow.styleSummary ?? "",
        sessionCount: profileRow.sessionCount,
      }
    : {
        skinTraits: null,
        preferredStyles: [],
        avoidedStyles: [],
        intentions: {},
        colorPalette: [],
        styleSummary: "",
        sessionCount: 0,
      };

  // Update intentions frequency map
  if (session.intention) {
    const intentions = { ...currentProfile.intentions };
    intentions[session.intention] = (intentions[session.intention] ?? 0) + 1;
    currentProfile.intentions = intentions;
  }

  // Update skin traits (running merge — latest wins for tone/undertone)
  const skinSummary = parseJson<SkinSummary>(session.skinSummary);
  if (skinSummary) {
    currentProfile.skinTraits = {
      tone: skinSummary.tone,
      undertone: skinSummary.undertone,
      skinType: skinSummary.skinType,
      concerns: skinSummary.concerns,
    };
  }

  // Extract liked / rejected styles from feedback
  for (const fb of feedbacks) {
    const outfit = parseJson<OutfitRecommendation>(fb.outfit ?? null);
    if (!outfit) continue;

    if (fb.type === "liked") {
      // Add outfit's inferred style traits to preferred
      const inferred = inferStyleTraits(outfit);
      for (const trait of inferred) {
        if (!currentProfile.preferredStyles.includes(trait)) {
          currentProfile.preferredStyles.push(trait);
        }
      }
      // Add colors
      for (const color of outfit.colorPalette ?? []) {
        if (!currentProfile.colorPalette.includes(color)) {
          currentProfile.colorPalette = [
            ...currentProfile.colorPalette,
            color,
          ].slice(-10); // keep last 10
        }
      }
    }

    if (fb.type === "rejected") {
      const inferred = inferStyleTraits(outfit);
      for (const trait of inferred) {
        if (!currentProfile.avoidedStyles.includes(trait)) {
          currentProfile.avoidedStyles.push(trait);
        }
      }
    }
  }

  // Remove contradictions (if something is in both preferred and avoided, drop from avoided)
  currentProfile.avoidedStyles = currentProfile.avoidedStyles.filter(
    (s) => !currentProfile.preferredStyles.includes(s)
  );

  // If OpenAI is available, generate a style summary sentence
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-...") {
    const summary = await generateStyleSummary(currentProfile);
    currentProfile.styleSummary = summary;
  } else {
    currentProfile.styleSummary = generateFallbackSummary(currentProfile);
  }

  // Persist
  await prisma.styleProfile.upsert({
    where: { userId },
    update: {
      skinTraits: JSON.stringify(currentProfile.skinTraits),
      preferredStyles: JSON.stringify(currentProfile.preferredStyles),
      avoidedStyles: JSON.stringify(currentProfile.avoidedStyles),
      intentions: JSON.stringify(currentProfile.intentions),
      colorPalette: JSON.stringify(currentProfile.colorPalette),
      styleSummary: currentProfile.styleSummary,
      sessionCount: { increment: 1 },
    },
    create: {
      userId,
      skinTraits: JSON.stringify(currentProfile.skinTraits),
      preferredStyles: JSON.stringify(currentProfile.preferredStyles),
      avoidedStyles: JSON.stringify(currentProfile.avoidedStyles),
      intentions: JSON.stringify(currentProfile.intentions),
      colorPalette: JSON.stringify(currentProfile.colorPalette),
      styleSummary: currentProfile.styleSummary,
      sessionCount: 1,
    },
  });

  // Snapshot evolution every 5 sessions
  const updatedProfile = await prisma.styleProfile.findUnique({ where: { userId } });
  if (updatedProfile && updatedProfile.sessionCount % 5 === 0) {
    await prisma.styleEvolution.create({
      data: {
        userId,
        summary: currentProfile.styleSummary,
        traits: JSON.stringify(currentProfile),
      },
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadRecentSessions(
  userId: string,
  limit: number
): Promise<RecentSessionContext[]> {
  const sessions = await prisma.session.findMany({
    where: { userId, completedStep: { gte: 6 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { feedback: true },
  });

  return sessions.map((s) => {
    const liked = s.feedback
      .filter((f) => f.type === "liked")
      .map((f) => {
        const o = parseJson<OutfitRecommendation>(f.outfit ?? null);
        return o?.name ?? "unnamed outfit";
      });

    const rejected = s.feedback
      .filter((f) => f.type === "rejected")
      .map((f) => {
        const o = parseJson<OutfitRecommendation>(f.outfit ?? null);
        return o?.name ?? "unnamed outfit";
      });

    const notes = s.feedback
      .filter((f) => f.detail)
      .map((f) => f.detail as string);

    return {
      sessionId: s.id,
      date: s.createdAt.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      intention: s.intention ?? "unspecified",
      likedOutfits: liked,
      rejectedOutfits: rejected,
      feedbackNotes: notes,
    };
  });
}

function inferStyleTraits(outfit: OutfitRecommendation): string[] {
  const traits: string[] = [];
  const desc = (outfit.description + " " + outfit.intention).toLowerCase();
  if (desc.includes("minimal") || desc.includes("clean")) traits.push("minimalist");
  if (desc.includes("bold") || desc.includes("bright")) traits.push("bold color");
  if (desc.includes("structured") || desc.includes("tailored")) traits.push("structured tailoring");
  if (desc.includes("flowing") || desc.includes("relaxed")) traits.push("relaxed silhouette");
  if (desc.includes("earth") || desc.includes("neutral")) traits.push("earth tones");
  if (desc.includes("monochromatic")) traits.push("monochromatic");
  if (desc.includes("pattern") || desc.includes("print")) traits.push("pattern/print");
  if (desc.includes("formal")) traits.push("formal");
  if (desc.includes("casual")) traits.push("casual");
  return traits;
}

async function generateStyleSummary(profile: StyleProfileData): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content:
          "You are a fashion editor. Write a single elegant sentence (max 25 words) summarizing this person's style profile. Be specific, not generic.",
      },
      {
        role: "user",
        content: `Preferred: ${profile.preferredStyles.join(", ") || "forming"}. Avoided: ${profile.avoidedStyles.join(", ") || "none"}. Intentions: ${Object.keys(profile.intentions).join(", ") || "varied"}. Colors: ${profile.colorPalette.join(", ") || "exploring"}.`,
      },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

function generateFallbackSummary(profile: StyleProfileData): string {
  if (profile.preferredStyles.length > 0) {
    return `Gravitates toward ${profile.preferredStyles.slice(0, 2).join(" and ")} aesthetics.`;
  }
  return "Style profile is forming — come back after a few more sessions.";
}

// ── Mock recommendations (dev / demo mode) ────────────────────────────────────

function mockRecommendations(
  intention: StyleIntention,
  skin: SkinSummary
): OutfitRecommendation[] {
  const undertoneNote =
    skin.undertone === "warm"
      ? "earthy warmth of camel and terracotta"
      : skin.undertone === "cool"
      ? "cool clarity of navy and white"
      : "balanced neutrals of sand and sage";

  return [
    {
      id: "mock-1",
      name: "The Considered Edit",
      description: `A pared-back look built on clean lines and tonal dressing. The ${undertoneNote} complements your undertone beautifully. Nothing competes; everything belongs.`,
      items: [
        { category: "top", name: "Relaxed linen shirt", description: "Oversized, unstructured", color: "warm ivory", imageSearchQuery: "relaxed linen shirt ivory women" },
        { category: "bottom", name: "Wide-leg trousers", description: "High-waisted, fluid", color: "camel", imageSearchQuery: "wide leg trousers camel women" },
        { category: "shoes", name: "Pointed mule", description: "Kitten heel", color: "tan leather", imageSearchQuery: "pointed kitten heel mule tan leather" },
      ],
      colorPalette: ["warm ivory", "camel", "tan"],
      intention: `Channels ${intention} through restraint and intentionality.`,
      personalizedReason: "A strong starting point for your style story — understated but unmistakably considered.",
      confidence: 0.88,
    },
    {
      id: "mock-2",
      name: "Soft Authority",
      description: "Structured silhouette softened by drape. The blazer gives weight and intention while the relaxed bottom balances the formality.",
      items: [
        { category: "outerwear", name: "Longline blazer", description: "Single button, structured shoulders", color: "chocolate brown", imageSearchQuery: "longline blazer chocolate brown women" },
        { category: "bottom", name: "Silk bias-cut skirt", description: "Midi length, fluid", color: "burnt sienna", imageSearchQuery: "silk midi bias cut skirt burnt sienna" },
        { category: "shoes", name: "Ankle boot", description: "Block heel, minimal hardware", color: "dark brown", imageSearchQuery: "block heel ankle boot dark brown women" },
      ],
      colorPalette: ["chocolate brown", "burnt sienna", "dark brown"],
      intention: `Delivers ${intention} through structure with a warm palette that works with your skin tone.`,
      personalizedReason: "The warm palette harmonizes with your undertone and skin analysis from this session.",
      confidence: 0.84,
    },
    {
      id: "mock-3",
      name: "The Unexpected Quiet",
      description: "Monochromatic sage from head to toe — a color that reads as sophisticated calm. The tone-on-tone approach makes the silhouette the statement.",
      items: [
        { category: "top", name: "Fitted jersey turtleneck", description: "Second-skin fit", color: "sage green", imageSearchQuery: "fitted turtleneck sage green women" },
        { category: "bottom", name: "Straight-cut trousers", description: "High-rise, structured", color: "sage green", imageSearchQuery: "straight trousers sage green women high waist" },
        { category: "shoes", name: "Loafer", description: "Chunky sole, minimal design", color: "white", imageSearchQuery: "chunky loafer white women minimal" },
        { category: "accessory", name: "Gold hoop earrings", description: "Medium diameter, clean", color: "gold", imageSearchQuery: "medium gold hoop earrings minimal" },
      ],
      colorPalette: ["sage green", "white", "gold"],
      intention: `Sage is a quietly powerful choice for ${intention} — it doesn't shout, it radiates.`,
      personalizedReason: "Sage is flattering across skin tones and works particularly well with your profile.",
      confidence: 0.81,
    },
  ];
}
