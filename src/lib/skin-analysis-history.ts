import { prisma } from "@/lib/db/client";
import { hasFreshSkinAnalysis } from "@/lib/skin-trends";
import { parseJson } from "@/lib/utils";
import { SkinSummary } from "@/types";

export interface StoredSkinAnalysis {
  sessionId: string;
  capturedAt: Date;
  summary: SkinSummary;
}

function isSkinSummary(value: SkinSummary | null): value is SkinSummary {
  return Boolean(
    value &&
    value.concernScores &&
    typeof value.concernScores === "object" &&
    (!value.skinLab || (
      Number.isFinite(value.skinLab.l) &&
      Number.isFinite(value.skinLab.a) &&
      Number.isFinite(value.skinLab.b)
    ))
  );
}

export async function loadSkinAnalysisHistory(
  userId: string,
  before?: Date
): Promise<StoredSkinAnalysis[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      completedStep: { gte: 2 },
      skinAnalysisRaw: { not: null },
      skinSummary: { not: null },
      ...(before ? { createdAt: { lt: before } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      skinAnalysisRaw: true,
      skinSummary: true,
    },
  });

  return sessions.flatMap((session) => {
    if (!hasFreshSkinAnalysis(session.skinAnalysisRaw)) return [];
    const summary = parseJson<SkinSummary>(session.skinSummary);
    if (!isSkinSummary(summary)) return [];
    return [{
      sessionId: session.id,
      capturedAt: session.createdAt,
      summary,
    }];
  });
}
