import { SkinAnalysisComparison, SkinConcernChange, SkinSummary } from "@/types";

const CONCERNS = [
  ["dark_circle_v2", "Dark circles"],
  ["age_spot", "Dark spots"],
  ["wrinkle", "Fine lines"],
  ["redness", "Redness"],
  ["texture", "Texture"],
  ["acne", "Acne"],
  ["pore", "Pores"],
] as const;

function concernAverages(summary: SkinSummary): Map<string, number> {
  const values = new Map<string, number[]>();

  for (const [rawKey, score] of Object.entries(summary.concernScores ?? {})) {
    if (!Number.isFinite(score) || score < 0 || score > 1) continue;
    const key = rawKey.toLowerCase();
    const concern = CONCERNS.find(([name]) => key === name || key.startsWith(`${name}_`));
    if (!concern) continue;
    const entries = values.get(concern[0]) ?? [];
    entries.push(score);
    values.set(concern[0], entries);
  }

  return new Map(
    [...values].map(([key, scores]) => [
      key,
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    ])
  );
}

export function compareSkinAnalyses(
  current: SkinSummary,
  previous: SkinSummary,
  previousCapturedAt: Date | string
): SkinAnalysisComparison {
  const currentScores = concernAverages(current);
  const previousScores = concernAverages(previous);
  const changes = CONCERNS.flatMap(([key, label]) => {
    const currentScore = currentScores.get(key);
    const previousScore = previousScores.get(key);
    if (currentScore === undefined || previousScore === undefined) return [];
    return [{
      key,
      label,
      previousScore,
      currentScore,
      deltaPercentagePoints: Math.round((currentScore - previousScore) * 1000) / 10,
    }];
  });

  return {
    previousCapturedAt: new Date(previousCapturedAt).toISOString(),
    changes,
  };
}

export function hasFreshSkinAnalysis(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as {
      skinAnalysis?: {
        source?: unknown;
        results?: { output?: unknown };
      };
    };
    return parsed.skinAnalysis?.source !== "stored_skin_passport"
      && Array.isArray(parsed.skinAnalysis?.results?.output);
  } catch {
    return false;
  }
}
