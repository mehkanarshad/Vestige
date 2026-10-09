import {
  SkinAnalysisComparison,
  SkinConcernChange,
  SkinSummary,
  SkinTrendObservation,
  SkinTrendSignal,
} from "@/types";

const CONCERNS = [
  ["dark_circle_v2", "Dark circles"],
  ["age_spot", "Dark spots"],
  ["wrinkle", "Fine lines"],
  ["redness", "Redness"],
  ["texture", "Texture"],
  ["acne", "Acne"],
  ["pore", "Pores"],
] as const;

export interface SkinAnalysisObservation {
  summary: SkinSummary;
  capturedAt: Date | string;
}

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

function relativeChange(previous: number, current: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function trendSignal(
  key: string,
  label: string,
  observations: SkinTrendObservation[]
): SkinTrendSignal {
  const firstScore = observations[0].score;
  const previousScore = observations[observations.length - 2]?.score ?? firstScore;
  const currentScore = observations[observations.length - 1].score;
  return {
    key,
    label,
    firstScore,
    previousScore,
    currentScore,
    deltaPercentagePoints: Math.round((currentScore - firstScore) * 1000) / 10,
    relativePercentageChange: relativeChange(firstScore, currentScore),
    observations,
  };
}

export function calculateSkinTrajectory(
  analyses: SkinAnalysisObservation[]
): SkinTrendSignal[] {
  const scoresByConcern = new Map<string, SkinTrendObservation[]>();
  for (const analysis of analyses) {
    const capturedAt = new Date(analysis.capturedAt);
    if (!Number.isFinite(capturedAt.getTime())) continue;
    const scores = concernAverages(analysis.summary);
    for (const [key, score] of scores) {
      const observations = scoresByConcern.get(key) ?? [];
      observations.push({ capturedAt: capturedAt.toISOString(), score });
      scoresByConcern.set(key, observations);
    }
  }

  return CONCERNS.flatMap(([key, label]) => {
    const observations = scoresByConcern.get(key);
    return observations && observations.length >= 2
      ? [trendSignal(key, label, observations)]
      : [];
  });
}

export function compareSkinAnalyses(
  current: SkinSummary,
  previous: SkinSummary,
  previousCapturedAt: Date | string,
  currentCapturedAt: Date | string
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
      relativePercentageChange: relativeChange(previousScore, currentScore),
    }];
  });

  return {
    previousCapturedAt: new Date(previousCapturedAt).toISOString(),
    changes,
    trajectory: calculateSkinTrajectory([
      { summary: previous, capturedAt: previousCapturedAt },
      { summary: current, capturedAt: currentCapturedAt },
    ]),
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
