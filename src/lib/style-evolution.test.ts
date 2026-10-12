import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStyleEvolutionSignals,
  parseEvolutionSnapshot,
} from "./style-evolution";

test("derives five-session skin and style changes from stored observations", () => {
  const sessions = Array.from({ length: 10 }, (_, index) => {
    const isRecent = index >= 5;
    return {
      id: `session-${index + 1}`,
      capturedAt: new Date(Date.UTC(2026, 0, index + 1)),
      intention: isRecent ? "bold" : "calm",
      feedback: [isRecent ? "liked" : "rejected"],
      interactions: [{
        action: isRecent ? "liked" : "rejected",
        attributes: { style: "minimalist" },
      }],
    };
  });
  const skinAnalyses = sessions.map((session, index) => ({
    capturedAt: session.capturedAt,
    summary: {
      tone: "medium",
      skinLab: null,
      undertone: "neutral",
      skinType: "combination",
      concerns: ["redness"],
      concernScores: { redness: index < 5 ? 0.6 : 0.3 },
      rawAttributes: {},
    },
  }));

  const signals = calculateStyleEvolutionSignals(sessions, skinAnalyses);

  assert.ok(signals);
  assert.equal(signals.sessionCount, 10);
  assert.equal(signals.throughSessionId, "session-10");
  assert.equal(signals.style.feedbackAcceptance.current, 100);
  assert.equal(signals.style.feedbackAcceptance.previous, 0);
  assert.equal(signals.style.feedbackAcceptance.deltaPercentagePoints, 100);
  assert.deepEqual(signals.style.intentions[0], {
    intention: "bold",
    currentShare: 1,
    previousShare: 0,
    deltaPercentagePoints: 100,
  });
  assert.equal(
    signals.style.preferences.find(({ facet, value }) => facet === "style" && value === "minimalist")?.delta,
    2
  );
  assert.deepEqual(signals.skin[0], {
    key: "redness",
    label: "Redness",
    firstScore: 0.6,
    currentScore: 0.3,
    deltaPercentagePoints: -30,
    observations: 10,
  });
  assert.equal(
    parseEvolutionSnapshot(JSON.stringify(signals)).signals?.throughSessionId,
    "session-10"
  );
});

test("does not create evolution metrics before five feedback sessions", () => {
  const sessions = Array.from({ length: 4 }, (_, index) => ({
    id: `session-${index + 1}`,
    capturedAt: new Date(Date.UTC(2026, 0, index + 1)),
    intention: "calm",
    feedback: ["liked"],
    interactions: [],
  }));

  assert.equal(calculateStyleEvolutionSignals(sessions, []), null);
});

test("keeps earlier profile-based evolution snapshots readable", () => {
  const legacyTraits = {
    skinTraits: null,
    preferredStyles: ["minimalist"],
    avoidedStyles: [],
    intentions: { calm: 2 },
    colorPalette: ["#fff"],
    styleSummary: "A minimal style.",
    sessionCount: 5,
  };

  assert.deepEqual(parseEvolutionSnapshot(JSON.stringify(legacyTraits)), {
    traits: legacyTraits,
  });
});
