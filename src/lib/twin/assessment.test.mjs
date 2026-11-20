import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "./catalogue" && context.parentURL?.endsWith("/twin/assessment.ts")) {
      return nextResolve("./catalogue.ts", context);
    }
    if (specifier === "@/lib/twin/assessment") {
      return nextResolve(new URL("./assessment.ts", import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith("/twin-findings.tsx")) {
      const source = readFileSync(new URL(url), "utf8");
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
      });
      return { format: "module", source: outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { searchTwinTraps, setTwinSelected, selectedTwinTraps, incompleteTwinContributions, readTwinSelections, twinAnswerContext } = await import("./assessment.ts");
const { TwinFindings } = await import("../../app/assessments/[assessmentId]/twin-findings.tsx");
hooks.deregister();

test("the catalogue matches all 85 specified IDs, labels, definitions and source tiers", () => {
  const catalogue = searchTwinTraps("");
  const specification = readFileSync(new URL("../../../docs/TWIN_Error_Trap_Codex_Implementation_Spec.md", import.meta.url), "utf8");
  const rows = [...specification.matchAll(/^\| ([TWIN]-\d\d) \| (.*?) \| (.*?) \| (Core|Extended) \|$/gm)];
  assert.equal(catalogue.length, 85);
  assert.equal(new Set(catalogue.map(({ id }) => id)).size, 85);
  assert.deepEqual(catalogue.map(({ id, label, definition, sourceTier }) => [id, label, definition, sourceTier]), rows.map(([, id, label, definition, tier]) => [id, label, definition, tier.toLowerCase()]));
  assert.deepEqual(["T", "W", "I", "N"].map((category) => catalogue.filter((trap) => trap.category === category).length), [14, 27, 16, 28]);
  assert.deepEqual(["T", "W", "I", "N"].map((category) => searchTwinTraps("", true).filter((trap) => trap.category === category).length), [8, 8, 8, 8]);
});

test("search matches labels and definitions across categories", () => {
  const matches = searchTwinTraps("  PRESSURE ");
  assert.ok(matches.some(({ id }) => id === "T-01"));
  assert.ok(matches.some(({ id }) => id === "W-10"));
  assert.ok(matches.some(({ id }) => id === "N-01"));
  assert.deepEqual(searchTwinTraps("nonexistent trap"), []);
});

test("selection is unique, persists as a draft, and withdrawal preserves elaboration", () => {
  const draft = setTwinSelected(setTwinSelected({}, "T-01", true), "T-01", true);
  assert.equal(selectedTwinTraps(draft).length, 1);
  assert.deepEqual(incompleteTwinContributions(draft), []);
  draft["T-01"].evidence = "Fictional interview";
  const withdrawn = setTwinSelected(draft, "T-01", false);
  const reloaded = readTwinSelections(JSON.parse(JSON.stringify(twinAnswerContext(withdrawn))));
  assert.deepEqual(selectedTwinTraps(reloaded), []);
  assert.equal(setTwinSelected(reloaded, "T-01", true)["T-01"].evidence, "Fictional interview");
  assert.deepEqual(readTwinSelections({}), {});
  assert.throws(() => twinAnswerContext({ "T-01": { ...draft["T-01"], evidence: "x".repeat(4001) } }));
});

test("sign-off requires contribution and evidence for active contributing traps", () => {
  const draft = setTwinSelected({}, "T-01", true);
  draft["T-01"].status = "contributing";
  draft["T-01"].contribution = "  ";
  assert.equal(incompleteTwinContributions(draft).length, 1);
  draft["T-01"].contribution = "Reduced time available for checking";
  assert.equal(incompleteTwinContributions(draft).length, 1);
  assert.equal(incompleteTwinContributions(setTwinSelected(draft, "T-01", false)).length, 0);
  draft["T-01"].evidence = "Fictional work log";
  assert.equal(incompleteTwinContributions(draft).length, 0);
});

test("the rendered report groups active findings and escapes evidence text", () => {
  let selections = {};
  for (const id of ["N-01", "T-01", "W-01"]) selections = setTwinSelected(selections, id, true);
  selections["T-01"] = { selected: true, presence: "Fictional deadline", contribution: "Checking time reduced", evidence: "<fictional log>", status: "contributing" };
  selections = setTwinSelected(selections, "W-01", false);
  const html = renderToStaticMarkup(createElement(TwinFindings, { selections }));
  assert.ok(html.indexOf("Task Demands") < html.indexOf("Human Nature"));
  assert.match(html, /Time pressure · Contributing/);
  assert.match(html, /Fictional deadline/);
  assert.match(html, /Checking time reduced/);
  assert.match(html, /&lt;fictional log&gt;/);
  assert.doesNotMatch(html, /Distractions \/ interruptions|Work Environment/);
  assert.match(renderToStaticMarkup(createElement(TwinFindings, { selections: {} })), /No TWIN error traps recorded/);
});
