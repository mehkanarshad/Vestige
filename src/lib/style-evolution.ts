import { calculateSkinTrajectory } from "@/lib/skin-trends";
import type { SkinAnalysisObservation } from "@/lib/skin-trends";
import { ratingForAction } from "@/lib/collaborative-filter";
import { parseJson } from "@/lib/utils";
import type { StyleEvolutionSignals, StyleProfileData } from "@/types";

export interface StyleEvolutionInteraction {
  action: "liked" | "rejected" | "more_like_this" | "unknown";
  attributes: Record<string, string | null | undefined>;
}

export interface StyleEvolutionSession {
  id: string;
  capturedAt: Date | string;
  intention: string | null;
  feedback: string[];
  interactions: StyleEvolutionInteraction[];
}

export function isStyleEvolutionSignals(value: unknown): value is StyleEvolutionSignals {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StyleEvolutionSignals>;
  return candidate.version === 1
    && typeof candidate.throughSessionId === "string"
    && typeof candidate.sessionCount === "number"
    && Array.isArray(candidate.skin)
    && typeof candidate.style === "object"
    && candidate.style !== null;
}

export function parseEvolutionSnapshot(traitsJson: string): {
  traits: StyleProfileData | null;
  signals?: StyleEvolutionSignals;
} {
  const value = parseJson<unknown>(traitsJson);
  if (isStyleEvolutionSignals(value)) return { traits: null, signals: value };
  if (!value || typeof value !== "object") return { traits: null };

  const candidate = value as Partial<StyleProfileData>;
  if (
    Array.isArray(candidate.preferredStyles) &&
    Array.isArray(candidate.avoidedStyles) &&
    candidate.intentions !== null &&
    typeof candidate.intentions === "object" &&
    Array.isArray(candidate.colorPalette) &&
    typeof candidate.styleSummary === "string" &&
    typeof candidate.sessionCount === "number"
  ) {
    return { traits: candidate as StyleProfileData };
  }
  return { traits: null };
}

const WINDOW_SIZE = 5;
const FACETS = ["category", "tone", "silhouette", "formality", "style", "texture"];

function feedbackAcceptance(sessions: StyleEvolutionSession[]): {
  value: number | null;
  responses: number;
} {
  const feedback = sessions.flatMap((session) => session.feedback);
  const accepted = feedback.filter((type) => type === "liked").length;
  const rejected = feedback.filter((type) => type === "rejected").length;
  const responses = accepted + rejected;
  return { value: responses ? accepted / responses : null, responses };
}

function intentionShares(sessions: StyleEvolutionSession[]): Map<string, number> {
  const intentions = sessions.flatMap(({ intention }) => intention ? [intention] : []);
  const counts = new Map<string, number>();
  for (const intention of intentions) {
    counts.set(intention, (counts.get(intention) ?? 0) + 1);
  }
  return new Map([...counts].map(([key, count]) => [key, count / intentions.length]));
}

function preferenceScores(
  sessions: StyleEvolutionSession[]
): Map<string, { score: number; responses: number }> {
  const scores = new Map<string, number[]>();
  for (const session of sessions) {
    for (const interaction of session.interactions) {
      const weight = interaction.action === "unknown"
        ? 0
        : ratingForAction(interaction.action);
      if (!weight) continue;
      for (const facet of FACETS) {
        const value = interaction.attributes[facet]?.trim().toLowerCase();
        if (!value) continue;
        const key = `${facet}:${value}`;
        const observations = scores.get(key) ?? [];
        observations.push(weight);
        scores.set(key, observations);
      }
    }
  }
  return new Map(
    [...scores].map(([key, values]) => [
      key,
      {
        score: values.reduce((sum, value) => sum + value, 0) / values.length,
        responses: values.length,
      },
    ])
  );
}

export function calculateStyleEvolutionSignals(
  sessions: StyleEvolutionSession[],
  skinAnalyses: SkinAnalysisObservation[]
): StyleEvolutionSignals | null {
  const orderedSessions = [...sessions].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );
  if (orderedSessions.length < WINDOW_SIZE) return null;

  const currentWindow = orderedSessions.slice(-WINDOW_SIZE);
  const previousWindow = orderedSessions.slice(-WINDOW_SIZE * 2, -WINDOW_SIZE);
  const currentFeedback = feedbackAcceptance(currentWindow);
  const previousFeedback = previousWindow.length
    ? feedbackAcceptance(previousWindow)
    : null;
  const currentIntentions = intentionShares(currentWindow);
  const previousIntentions = intentionShares(previousWindow);
  const currentPreferences = preferenceScores(currentWindow);
  const previousPreferences = preferenceScores(previousWindow);

  const currentDate = new Date(currentWindow.at(-1)!.capturedAt);
  const skinTrajectory = calculateSkinTrajectory(
    skinAnalyses.filter((analysis) =>
      new Date(analysis.capturedAt) <= currentDate
    )
  );

  const intentionNames = new Set([...currentIntentions.keys(), ...previousIntentions.keys()]);
  const intentions = [...intentionNames].map((intention) => {
    const currentShare = currentIntentions.get(intention) ?? 0;
    const previousShare = previousWindow.length
      ? previousIntentions.get(intention) ?? 0
      : null;
    return {
      intention,
      currentShare,
      previousShare,
      deltaPercentagePoints: previousShare === null
        ? null
        : Math.round((currentShare - previousShare) * 1000) / 10,
    };
  }).sort((a, b) => b.currentShare - a.currentShare);

  const preferenceKeys = new Set([...currentPreferences.keys(), ...previousPreferences.keys()]);
  const preferences = [...preferenceKeys].map((key) => {
    const [facet, value] = key.split(":");
    const current = currentPreferences.get(key);
    const previous = previousPreferences.get(key);
    return {
      facet,
      value,
      currentScore: current?.score ?? 0,
      previousScore: previousWindow.length ? previous?.score ?? 0 : null,
      delta: previousWindow.length
        ? Math.round(((current?.score ?? 0) - (previous?.score ?? 0)) * 100) / 100
        : null,
      responses: current?.responses ?? 0,
    };
  }).sort((a, b) => Math.abs(b.delta ?? b.currentScore) - Math.abs(a.delta ?? a.currentScore))
    .slice(0, 8);

  return {
    version: 1,
    throughSessionId: currentWindow.at(-1)!.id,
    sessionCount: orderedSessions.length,
    windowStartAt: new Date(currentWindow[0].capturedAt).toISOString(),
    windowEndAt: currentDate.toISOString(),
    skin: skinTrajectory.map((signal) => ({
      key: signal.key,
      label: signal.label,
      firstScore: signal.firstScore,
      currentScore: signal.currentScore,
      deltaPercentagePoints: signal.deltaPercentagePoints,
      observations: signal.observations.length,
    })),
    style: {
      feedbackAcceptance: {
        current: currentFeedback.value === null
          ? null
          : Math.round(currentFeedback.value * 1000) / 10,
        previous: previousFeedback?.value === null || previousFeedback === null
          ? null
          : Math.round(previousFeedback.value * 1000) / 10,
        deltaPercentagePoints: currentFeedback.value === null || previousFeedback?.value == null
          ? null
          : Math.round((currentFeedback.value - previousFeedback.value) * 1000) / 10,
        responses: currentFeedback.responses,
      },
      intentions,
      preferences,
    },
  };
}

export function summarizeStyleEvolution(signals: StyleEvolutionSignals): string {
  const acceptance = signals.style.feedbackAcceptance;
  const leadingIntention = signals.style.intentions[0];
  const leadingSkinChange = [...signals.skin]
    .sort((a, b) => Math.abs(b.deltaPercentagePoints) - Math.abs(a.deltaPercentagePoints))[0];

  const parts = [`Signals across ${signals.sessionCount} styled sessions`];
  if (acceptance.deltaPercentagePoints !== null) {
    parts.push(
      `feedback acceptance ${acceptance.deltaPercentagePoints > 0 ? "rose" : acceptance.deltaPercentagePoints < 0 ? "fell" : "held"} ${Math.abs(acceptance.deltaPercentagePoints).toFixed(1)} percentage points`
    );
  } else if (acceptance.current !== null) {
    parts.push(`feedback acceptance is ${acceptance.current.toFixed(1)}%`);
  }
  if (leadingIntention) {
    parts.push(`most common intention: ${leadingIntention.intention}`);
  }
  if (leadingSkinChange) {
    const direction = leadingSkinChange.deltaPercentagePoints < 0 ? "decreased" : "increased";
    parts.push(
      `${leadingSkinChange.label.toLowerCase()} estimate ${direction} ${Math.abs(leadingSkinChange.deltaPercentagePoints).toFixed(1)} points`
    );
  }
  return `${parts.join("; ")}.`;
}
