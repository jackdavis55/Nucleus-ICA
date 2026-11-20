import assert from "node:assert/strict";
import test from "node:test";

import { hasStageResponseAndEvidence } from "./stage-completion.ts";

test("a response and evidence are sufficient to complete a stage", () => {
  assert.equal(hasStageResponseAndEvidence("Yes", "Fictional interview note"), true);
  assert.equal(hasStageResponseAndEvidence("Unknown", "Evidence was unavailable for this fictional case"), true);
});

test("a missing or blank response or evidence note blocks completion", () => {
  assert.equal(hasStageResponseAndEvidence("Yes"), false);
  assert.equal(hasStageResponseAndEvidence("Yes", " \t\n"), false);
  assert.equal(hasStageResponseAndEvidence(undefined, "Fictional interview note"), false);
  assert.equal(hasStageResponseAndEvidence(" \t\n", "Fictional interview note"), false);
});
