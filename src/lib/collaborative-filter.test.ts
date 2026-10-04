import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPreferenceVector,
  pearsonCorrelation,
  rankGarments,
} from "./collaborative-filter";

const blueTop = {
  category: "top",
  lab: { l: 55, a: 5, b: -45 },
};
const redTop = {
  category: "top",
  lab: { l: 55, a: 55, b: 35 },
};

test("Pearson similarity handles identical, inverse, and constant vectors", () => {
  assert.equal(pearsonCorrelation([1, 2, 3], [1, 2, 3]), 1);
  assert.equal(pearsonCorrelation([1, 2, 3], [3, 2, 1]), -1);
  assert.equal(pearsonCorrelation([1, 1, 1], [2, 2, 2]), 0);
  assert.equal(pearsonCorrelation([1, 2], [1]), 0);
});

test("like and reject actions move preferences in opposite directions", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const positive = buildPreferenceVector([
    { action: "liked", attributes: blueTop, createdAt: now },
  ], now);
  const negative = buildPreferenceVector([
    { action: "rejected", attributes: blueTop, createdAt: now },
  ], now);

  assert.deepEqual(positive.values, negative.values.map((value) => -value));
});

test("top-N similar users rank an unseen preferred-color garment higher", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const current = buildPreferenceVector([
    { action: "liked", attributes: blueTop, createdAt: now },
    { action: "rejected", attributes: redTop, createdAt: now },
  ], now);
  const peer = buildPreferenceVector([
    { action: "liked", attributes: blueTop, createdAt: now },
    { action: "rejected", attributes: redTop, createdAt: now },
  ], now);
  const ranked = rankGarments(
    "current-user",
    current,
    [{ userId: "similar-user", preferences: peer }],
    [
      { id: "red-unseen", attributes: redTop, skinColorScore: 60 },
      { id: "blue-unseen", attributes: blueTop, skinColorScore: 60 },
    ],
    5
  );

  assert.equal(ranked[0].id, "blue-unseen");
  assert.equal(ranked[0].neighborCount, 1);
  assert.ok(ranked[0].collaborativeScore !== null);
});

test("more-like-this contributes more preference weight than a plain like", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const liked = buildPreferenceVector([
    { action: "liked", attributes: blueTop, createdAt: now },
  ], now);
  const moreLikeThis = buildPreferenceVector([
    { action: "more_like_this", attributes: blueTop, createdAt: now },
  ], now);

  assert.ok(moreLikeThis.values.some((value, index) => Math.abs(value) > Math.abs(liked.values[index])));
});