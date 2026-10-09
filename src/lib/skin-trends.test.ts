import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSkinTrajectory,
  compareSkinAnalyses,
  hasFreshSkinAnalysis,
} from "./skin-trends";
import { SkinSummary } from "@/types";

function summary(concernScores: Record<string, number>): SkinSummary {
  return {
    tone: "medium",
    skinLab: null,
    undertone: "not assessed",
    skinType: "not assessed",
    concerns: [],
    concernScores,
    rawAttributes: {},
  };
}

test("compares shared concern estimates and averages regional scores", () => {
  const comparison = compareSkinAnalyses(
    summary({ acne_forehead: 0.7, acne_cheek: 0.5, redness: 0.25 }),
    summary({ acne_forehead: 0.4, acne_cheek: 0.4, texture: 0.6 }),
    "2026-10-01T12:00:00.000Z",
    "2026-10-08T12:00:00.000Z"
  );

  assert.deepEqual(comparison.changes, [{
    key: "acne",
    label: "Acne",
    previousScore: 0.4,
    currentScore: 0.6,
    deltaPercentagePoints: 20,
    relativePercentageChange: 50,
  }]);
  assert.equal(comparison.previousCapturedAt, "2026-10-01T12:00:00.000Z");
  assert.equal(comparison.trajectory[0].relativePercentageChange, 50);
});

test("does not treat passport reuse or non-YouCam payloads as fresh analyses", () => {
  assert.equal(hasFreshSkinAnalysis(JSON.stringify({
    skinAnalysis: { source: "stored_skin_passport" },
  })), false);
  assert.equal(hasFreshSkinAnalysis(JSON.stringify({
    status: 200,
    data: {},
  })), false);
  assert.equal(hasFreshSkinAnalysis(JSON.stringify({
    skinAnalysis: { task_status: "success", results: { output: [] } },
  })), true);
  assert.equal(hasFreshSkinAnalysis("invalid-json"), false);
});

test("ignores invalid scores and does not compare absent concerns as zero", () => {
  const comparison = compareSkinAnalyses(
    summary({ acne: 1.2, texture: 0.3 }),
    summary({ acne: 0.2, redness: 0.7 }),
    "2026-10-01T12:00:00.000Z",
    "2026-10-08T12:00:00.000Z"
  );
  assert.deepEqual(comparison.changes, []);
});

test("calculates multi-session relative trajectories and handles a zero baseline", () => {
  const trajectory = calculateSkinTrajectory([
    { summary: summary({ redness: 0.5, texture: 0 }), capturedAt: "2026-09-01T12:00:00.000Z" },
    { summary: summary({ redness: 0.47, texture: 0.2 }), capturedAt: "2026-09-15T12:00:00.000Z" },
    { summary: summary({ redness: 0.43, texture: 0.1 }), capturedAt: "2026-10-01T12:00:00.000Z" },
  ]);

  assert.deepEqual(trajectory[0], {
    key: "redness",
    label: "Redness",
    firstScore: 0.5,
    previousScore: 0.47,
    currentScore: 0.43,
    deltaPercentagePoints: -7,
    relativePercentageChange: -14,
    observations: [
      { capturedAt: "2026-09-01T12:00:00.000Z", score: 0.5 },
      { capturedAt: "2026-09-15T12:00:00.000Z", score: 0.47 },
      { capturedAt: "2026-10-01T12:00:00.000Z", score: 0.43 },
    ],
  });
  assert.equal(trajectory.find(({ key }) => key === "texture")?.relativePercentageChange, null);
});
