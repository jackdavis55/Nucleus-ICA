import assert from "node:assert/strict";
import test from "node:test";

import { hasCompleteProcedureUse, procedureUseChecks, readProcedureUse } from "./procedure-use.ts";

test("both procedure use checks survive a saved answer round trip", () => {
  for (const specifiedUse of ["Information Only", "Reference Use", "Continuous Use"]) {
    for (const usedAsSpecified of procedureUseChecks[1].options) {
      const answers = { specifiedUse, usedAsSpecified };
      const savedContext = JSON.parse(JSON.stringify({ procedure_use: answers }));
      assert.deepEqual(readProcedureUse(savedContext), answers);
      assert.equal(hasCompleteProcedureUse(readProcedureUse(savedContext)), true);
    }
  }
});

test("uncertainty can be explicitly recorded and a partial response stays incomplete", () => {
  for (const specifiedUse of ["Unknown", "Disputed", "Not applicable"]) {
    const context = { procedure_use: { specifiedUse } };
    assert.deepEqual(readProcedureUse(context), { specifiedUse });
    assert.equal(hasCompleteProcedureUse(readProcedureUse(context)), false);
    assert.equal(hasCompleteProcedureUse(readProcedureUse({
      procedure_use: { specifiedUse, usedAsSpecified: "Unknown" },
    })), true);
  }
});

test("legacy answers and invalid procedure use values do not imply a response", () => {
  assert.deepEqual(readProcedureUse({}), {});
  assert.deepEqual(readProcedureUse({ procedure_use: { specifiedUse: "invalid" } }), {});
});
