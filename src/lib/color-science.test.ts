import assert from "node:assert/strict";
import test from "node:test";
import { classifySkinUndertone } from "./color-science";

test("classifies undertone from measured Lab chromatic direction", () => {
  assert.equal(classifySkinUndertone({ l: 60, a: 10, b: 20 }), "warm");
  assert.equal(classifySkinUndertone({ l: 60, a: 20, b: 8 }), "cool");
  assert.equal(classifySkinUndertone({ l: 60, a: 12, b: 12 }), "neutral");
  assert.equal(classifySkinUndertone({ l: 60, a: -2, b: 18 }), "olive");
});

test("uses neutral for low chroma and reports missing/invalid measurements", () => {
  assert.equal(classifySkinUndertone({ l: 60, a: 3, b: 4 }), "neutral");
  assert.equal(classifySkinUndertone({ l: 60, a: Number.NaN, b: 10 }), "not assessed");
  assert.equal(classifySkinUndertone(null), "not assessed");
});
