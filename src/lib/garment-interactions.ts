import { prisma } from "@/lib/db/client";
import {
  buildPreferenceVector,
  GARMENT_ATTRIBUTE_VERSION,
  GarmentFeedbackSignal,
} from "@/lib/collaborative-filter";
import { LabColor } from "@/types";

export async function recomputeGarmentPreferences(userId: string) {
  const interactions = await prisma.garmentInteraction.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      action: true,
      createdAt: true,
      garment: { select: { category: true, colorLab: true } },
    },
  });

  const signals: GarmentFeedbackSignal[] = interactions.flatMap((interaction) => {
    if (
      interaction.action !== "liked" &&
      interaction.action !== "rejected" &&
      interaction.action !== "more_like_this"
    ) {
      return [];
    }
    try {
      const lab = JSON.parse(interaction.garment.colorLab) as LabColor;
      return [{
        action: interaction.action,
        attributes: { category: interaction.garment.category, lab },
        createdAt: interaction.createdAt,
      }];
    } catch {
      return [];
    }
  });

  const preferences = buildPreferenceVector(signals);
  await prisma.styleProfile.upsert({
    where: { userId },
    create: {
      userId,
      garmentPreferences: JSON.stringify(preferences),
      garmentInteractionCount: preferences.interactionCount,
      preferenceRevision: 1,
    },
    update: {
      garmentPreferences: JSON.stringify(preferences),
      garmentInteractionCount: preferences.interactionCount,
      preferenceRevision: { increment: 1 },
    },
  });

  return preferences;
}

export function parsePreferenceVector(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      parsed?.version === GARMENT_ATTRIBUTE_VERSION &&
      Array.isArray(parsed.values) &&
      parsed.values.length === 9 &&
      parsed.values.every((item: unknown) => typeof item === "number" && Number.isFinite(item))
    ) {
      return parsed as ReturnType<typeof buildPreferenceVector>;
    }
  } catch {
    return null;
  }
  return null;
}