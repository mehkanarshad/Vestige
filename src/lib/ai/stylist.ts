import OpenAI from "openai";
import { OutfitRecommendation, SkinSummary, StyleProfileData } from "@/types";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";
import {
  calculateStyleEvolutionSignals,
  StyleEvolutionSession,
  summarizeStyleEvolution,
} from "@/lib/style-evolution";

export async function updateStyleProfile(
  userId: string,
  sessionId: string
): Promise<void> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const [feedbacks, profileRow] = await Promise.all([
    prisma.feedback.findMany({ where: { sessionId } }),
    prisma.styleProfile.findUnique({ where: { userId } }),
  ]);

  const profile: StyleProfileData = profileRow
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

  if (session.intention) {
    profile.intentions[session.intention] = (profile.intentions[session.intention] ?? 0) + 1;
  }

  const skinSummary = parseJson<SkinSummary>(session.skinSummary);
  if (skinSummary) {
    profile.skinTraits = {
      tone: skinSummary.tone,
      undertone: skinSummary.undertone,
      skinType: skinSummary.skinType,
      concerns: skinSummary.concerns,
    };
  }

  for (const feedback of feedbacks) {
    const outfit = parseJson<OutfitRecommendation>(feedback.outfit ?? null);
    if (!outfit) continue;
    const itemFacets = outfit.items.flatMap((item) =>
      [
        item.attributes?.style,
        item.attributes?.silhouette,
        item.attributes?.formality,
        item.attributes?.texture,
      ].filter((value): value is string => Boolean(value))
    );

    if (feedback.type === "liked") {
      profile.preferredStyles = [...new Set([...profile.preferredStyles, ...itemFacets])];
      profile.colorPalette = [
        ...new Set([...profile.colorPalette, ...(outfit.colorPalette ?? [])]),
      ].slice(-10);
    } else if (feedback.type === "rejected") {
      profile.avoidedStyles = [...new Set([...profile.avoidedStyles, ...itemFacets])];
    }
  }

  profile.avoidedStyles = profile.avoidedStyles.filter(
    (style) => !profile.preferredStyles.includes(style)
  );
  profile.styleSummary =
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-..."
      ? await generateStyleSummary(profile)
      : generateFallbackSummary(profile);

  await prisma.styleProfile.upsert({
    where: { userId },
    update: {
      skinTraits: JSON.stringify(profile.skinTraits),
      preferredStyles: JSON.stringify(profile.preferredStyles),
      avoidedStyles: JSON.stringify(profile.avoidedStyles),
      intentions: JSON.stringify(profile.intentions),
      colorPalette: JSON.stringify(profile.colorPalette),
      styleSummary: profile.styleSummary,
      sessionCount: { increment: 1 },
    },
    create: {
      userId,
      skinTraits: JSON.stringify(profile.skinTraits),
      preferredStyles: JSON.stringify(profile.preferredStyles),
      avoidedStyles: JSON.stringify(profile.avoidedStyles),
      intentions: JSON.stringify(profile.intentions),
      colorPalette: JSON.stringify(profile.colorPalette),
      styleSummary: profile.styleSummary,
      sessionCount: 1,
    },
  });

}

export async function createStyleEvolutionSnapshot(userId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      completedStep: { gte: 6 },
      feedback: { some: {} },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      intention: true,
      feedback: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { type: true },
      },
      garmentInteractions: {
        select: {
          action: true,
          garment: {
            select: { category: true, catalogAttributes: true },
          },
        },
      },
    },
  });
  if (sessions.length === 0 || sessions.length % 5 !== 0) return;

  const latestEvolution = await prisma.styleEvolution.findFirst({
    where: { userId },
    orderBy: { snapshotAt: "desc" },
    select: { traits: true },
  });
  const previousSignals = parseJson<{ throughSessionId?: string }>(
    latestEvolution?.traits
  );
  const latestSession = sessions[sessions.length - 1];
  if (previousSignals?.throughSessionId === latestSession.id) return;

  const observations: StyleEvolutionSession[] = sessions.map((session) => ({
    id: session.id,
    capturedAt: session.createdAt,
    intention: session.intention,
    feedback: session.feedback.map(({ type }) => type),
    interactions: session.garmentInteractions.map((interaction) => {
      const catalogAttributes = parseJson<Record<string, unknown>>(
        interaction.garment.catalogAttributes
      );
      const attributes: Record<string, string | null> = {
        category: interaction.garment.category,
      };
      for (const facet of ["tone", "silhouette", "formality", "style", "texture"]) {
        const value = catalogAttributes?.[facet];
        attributes[facet] = typeof value === "string" ? value : null;
      }
      const action = interaction.action === "liked"
        || interaction.action === "rejected"
        || interaction.action === "more_like_this"
        ? interaction.action
        : "unknown";
      return { action, attributes };
    }),
  }));
  const skinHistory = await loadSkinAnalysisHistory(userId);
  const signals = calculateStyleEvolutionSignals(observations, skinHistory);
  if (!signals || signals.throughSessionId !== latestSession.id) return;

  await prisma.styleEvolution.create({
    data: {
      userId,
      summary: summarizeStyleEvolution(signals),
      traits: JSON.stringify(signals),
    },
  });
}

async function generateStyleSummary(profile: StyleProfileData): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content:
          "Write one specific, elegant sentence of at most 25 words summarizing this person's style profile.",
      },
      {
        role: "user",
        content: `Preferred: ${profile.preferredStyles.join(", ") || "forming"}. Avoided: ${profile.avoidedStyles.join(", ") || "none"}. Intentions: ${Object.keys(profile.intentions).join(", ") || "varied"}. Colors: ${profile.colorPalette.join(", ") || "exploring"}.`,
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

function generateFallbackSummary(profile: StyleProfileData): string {
  if (profile.preferredStyles.length > 0) {
    return `Gravitates toward ${profile.preferredStyles.slice(0, 2).join(" and ")} aesthetics.`;
  }
  return "Style profile is forming — come back after a few more sessions.";
}
