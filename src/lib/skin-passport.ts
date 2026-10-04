import { prisma } from "@/lib/db/client";
import { SkinPassport, SkinSummary } from "@/types";

const CONCERN_LABELS: Record<string, string> = {
  acne: "acne",
  dark_circle_v2: "dark circles",
  wrinkle: "fine lines",
  pore: "enlarged pores",
  texture: "uneven texture",
  redness: "redness",
  age_spot: "dark spots",
};

export async function saveSkinPassport(
  userId: string,
  summary: SkinSummary
): Promise<void> {
  if (!summary.skinLab || !summary.toneColor) return;

  const capturedAt = new Date();
  const passport: SkinPassport = {
    version: 1,
    capturedAt: capturedAt.toISOString(),
    tone: summary.tone,
    toneColor: summary.toneColor,
    skinType: summary.skinType,
    skinLab: summary.skinLab,
    concerns: summary.concernScores,
  };

  await prisma.styleProfile.upsert({
    where: { userId },
    create: {
      userId,
      skinPassport: JSON.stringify(passport),
      skinPassportCapturedAt: capturedAt,
    },
    update: {},
  });

  await prisma.styleProfile.updateMany({
    where: { userId, skinPassportCapturedAt: null },
    data: {
      skinPassport: JSON.stringify(passport),
      skinPassportCapturedAt: capturedAt,
    },
  });
}

export function summaryFromSkinPassport(passport: SkinPassport): SkinSummary {
  const concerns = Object.entries(passport.concerns).reduce<string[]>((labels, [key, severity]) => {
    if (severity < 0.4) return labels;
    const match = Object.entries(CONCERN_LABELS).find(
      ([concern]) => key === concern || key.startsWith(`${concern}_`)
    );
    if (match && !labels.includes(match[1])) labels.push(match[1]);
    return labels;
  }, []);

  return {
    tone: passport.tone,
    toneColor: passport.toneColor,
    skinLab: passport.skinLab,
    undertone: "not assessed",
    skinType: passport.skinType,
    concerns,
    concernScores: passport.concerns,
    rawAttributes: Object.fromEntries(
      Object.entries(passport.concerns).map(([key, severity]) => [key, 100 * (1 - severity)])
    ),
  };
}