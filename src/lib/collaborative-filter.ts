import { LabColor } from "@/types";

export const GARMENT_ATTRIBUTE_VERSION = 1 as const;
const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
const ATTRIBUTE_COUNT = CATEGORIES.length + 3;
const RECENCY_HALF_LIFE_DAYS = 180;

export interface GarmentAttributes {
  category: string;
  lab: LabColor;
}

export interface GarmentFeedbackSignal {
  action: "liked" | "rejected" | "more_like_this";
  attributes: GarmentAttributes;
  createdAt: Date | string;
}

export interface UserPreferenceVector {
  version: typeof GARMENT_ATTRIBUTE_VERSION;
  values: number[];
  interactionCount: number;
  computedAt: string;
}

export interface CollaborativeUser {
  userId: string;
  preferences: UserPreferenceVector;
}

export interface GarmentCandidate {
  id: string;
  attributes: GarmentAttributes;
  skinColorScore: number;
}

export interface RankedGarment extends GarmentCandidate {
  predictedSatisfaction: number;
  skinColorScore: number;
  userPreferenceScore: number;
  collaborativeScore: number | null;
  neighborCount: number;
  neighborUserIds: string[];
}

export function encodeGarmentAttributes(attributes: GarmentAttributes): number[] {
  const normalizedCategory = attributes.category.toLowerCase();
  return [
    ...CATEGORIES.map((category) => (category === normalizedCategory ? 1 : 0)),
    clamp(attributes.lab.l / 100, 0),
    clamp((attributes.lab.a + 128) / 255, 0),
    clamp((attributes.lab.b + 128) / 255, 0),
  ];
}

export function ratingForAction(action: GarmentFeedbackSignal["action"]): number {
  if (action === "rejected") return -1;
  if (action === "more_like_this") return 1.25;
  return 1;
}

export function buildPreferenceVector(
  signals: GarmentFeedbackSignal[],
  now = new Date()
): UserPreferenceVector {
  const values = Array<number>(ATTRIBUTE_COUNT).fill(0);
  let totalWeight = 0;

  for (const signal of signals) {
    const ageMs = Math.max(0, now.getTime() - new Date(signal.createdAt).getTime());
    const ageDays = ageMs / 86_400_000;
    const recencyWeight = Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
    const actionRating = ratingForAction(signal.action);
    const centered = encodeGarmentAttributes(signal.attributes).map((value) => value - 0.5);

    for (let index = 0; index < values.length; index += 1) {
      values[index] += centered[index] * actionRating * recencyWeight;
    }
    totalWeight += recencyWeight;
  }

  if (totalWeight > 0) {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = round(values[index] / totalWeight);
    }
  }

  return {
    version: GARMENT_ATTRIBUTE_VERSION,
    values,
    interactionCount: signals.length,
    computedAt: now.toISOString(),
  };
}

export function pearsonCorrelation(first: number[], second: number[]): number {
  if (first.length !== second.length || first.length < 2) return 0;
  const meanFirst = first.reduce((sum, value) => sum + value, 0) / first.length;
  const meanSecond = second.reduce((sum, value) => sum + value, 0) / second.length;
  let covariance = 0;
  let varianceFirst = 0;
  let varianceSecond = 0;

  for (let index = 0; index < first.length; index += 1) {
    const differenceFirst = first[index] - meanFirst;
    const differenceSecond = second[index] - meanSecond;
    covariance += differenceFirst * differenceSecond;
    varianceFirst += differenceFirst ** 2;
    varianceSecond += differenceSecond ** 2;
  }

  const denominator = Math.sqrt(varianceFirst * varianceSecond);
  return denominator < 1e-12 ? 0 : clamp(covariance / denominator, -1, 1);
}

export function predictFromPreferences(
  preferences: UserPreferenceVector,
  attributes: GarmentAttributes
): number {
  const candidate = encodeGarmentAttributes(attributes).map((value) => value - 0.5);
  const denominator = preferences.values.reduce((sum, value) => sum + Math.abs(value), 0) * 0.5;
  if (denominator < 1e-9) return 50;

  const utility = preferences.values.reduce(
    (sum, value, index) => sum + value * candidate[index],
    0
  ) / denominator;
  return Math.round(50 + 50 * clamp(utility, -1, 1));
}

export function rankGarments(
  currentUserId: string,
  currentPreferences: UserPreferenceVector,
  otherUsers: CollaborativeUser[],
  candidates: GarmentCandidate[],
  topN = 10
): RankedGarment[] {
  const neighbors = otherUsers
    .filter((user) => user.userId !== currentUserId && user.preferences.interactionCount >= 2)
    .map((user) => ({
      userId: user.userId,
      preferences: user.preferences,
      similarity: pearsonCorrelation(currentPreferences.values, user.preferences.values),
    }))
    .filter((neighbor) => neighbor.similarity >= 0.15)
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, Math.max(0, topN));

  const ownConfidence = Math.min(1, currentPreferences.interactionCount / 3);
  const neighborConfidence = Math.min(1, neighbors.length / 3);
  const collaborativeWeight = 0.55 * neighborConfidence;
  const ownWeight = 0.35 * ownConfidence;
  const skinWeight = Math.max(0, 1 - collaborativeWeight - ownWeight);

  return candidates
    .map((candidate) => {
      const userPreferenceScore = predictFromPreferences(currentPreferences, candidate.attributes);
      const neighborPredictions = neighbors.map((neighbor) => ({
        userId: neighbor.userId,
        similarity: neighbor.similarity,
        score: predictFromPreferences(neighbor.preferences, candidate.attributes),
      }));
      const neighborWeight = neighborPredictions.reduce(
        (sum, neighbor) => sum + neighbor.similarity,
        0
      );
      const collaborativeScore = neighborWeight > 0
        ? Math.round(neighborPredictions.reduce(
            (sum, neighbor) => sum + neighbor.score * neighbor.similarity,
            0
          ) / neighborWeight)
        : null;
      const predictedSatisfaction = Math.round(
        candidate.skinColorScore * skinWeight +
          userPreferenceScore * ownWeight +
          (collaborativeScore ?? candidate.skinColorScore) * collaborativeWeight
      );

      return {
        ...candidate,
        predictedSatisfaction,
        userPreferenceScore,
        collaborativeScore,
        neighborCount: neighborPredictions.length,
        neighborUserIds: neighborPredictions.map((neighbor) => neighbor.userId),
      };
    })
    .sort((first, second) => second.predictedSatisfaction - first.predictedSatisfaction);
}

function clamp(value: number, minimum: number, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}