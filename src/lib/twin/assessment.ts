import { z } from "zod";
import { twinCatalogue } from "./catalogue";

export const twinStageIndex = 8;
export const twinCatalogueVersion = 1;
export const twinNoteLimit = 4000;

export const twinCategories = [
  { id: "T", name: "Task Demands", short: "Task", color: "bg-[#DCEBFA] text-[#174B80]" },
  { id: "W", name: "Work Environment", short: "Work", color: "bg-[#DDF0E4] text-[#205C3B]" },
  { id: "I", name: "Individual Capabilities", short: "Individual", color: "bg-[#FCE9D7] text-[#874A19]" },
  { id: "N", name: "Human Nature", short: "Nature", color: "bg-[#EDE3F8] text-[#603D88]" },
] as const;

export type TwinCategory = (typeof twinCategories)[number]["id"];
export type TwinTrap = (typeof twinCatalogue)[number];
export type TwinTrapId = TwinTrap["id"];

export const contributionLabels = {
  undetermined: "Undetermined",
  contributing: "Contributing",
  present_unconfirmed: "Present — contribution unconfirmed",
  not_contributing: "Not contributing",
} as const;

const noteSchema = z.string().max(twinNoteLimit);
const selectionSchema = z.object({
  selected: z.boolean(),
  presence: noteSchema,
  contribution: noteSchema,
  evidence: noteSchema,
  status: z.enum(["undetermined", "contributing", "present_unconfirmed", "not_contributing"]),
});
const trapIdSchema = z.enum(twinCatalogue.map(({ id }) => id));
const selectionMapSchema = z.partialRecord(trapIdSchema, selectionSchema);
const contextSchema = z.object({ twin: z.object({
  catalogue_version: z.literal(twinCatalogueVersion),
  selections: selectionMapSchema,
}) });

export type TwinSelection = z.infer<typeof selectionSchema>;
export type TwinSelections = z.infer<typeof selectionMapSchema>;

export function readTwinSelections(context: unknown): TwinSelections {
  const result = contextSchema.safeParse(context);
  return result.success ? result.data.twin.selections : {};
}

export function twinAnswerContext(selections: TwinSelections) {
  return { twin: { catalogue_version: twinCatalogueVersion, selections: selectionMapSchema.parse(selections) } };
}

export function setTwinSelected(selections: TwinSelections, id: TwinTrapId, selected: boolean): TwinSelections {
  const previous = selections[id] ?? { presence: "", contribution: "", evidence: "", status: "undetermined" };
  return { ...selections, [id]: { ...previous, selected } };
}

export function searchTwinTraps(query: string, coreOnly = false) {
  const terms = query.trim().toLowerCase().split(/\s+/);
  return twinCatalogue.filter(({ label, definition, sourceTier }) =>
    (!coreOnly || sourceTier === "core") &&
    terms.every((term) => `${label} ${definition}`.toLowerCase().includes(term)),
  );
}

export function selectedTwinTraps(selections: TwinSelections) {
  return twinCatalogue.flatMap((trap) => {
    const selection = selections[trap.id];
    return selection?.selected ? [{ trap, selection }] : [];
  });
}

export function twinContributionNeedsEvidence(selection: TwinSelection) {
  return selection.status === "contributing" && (!selection.contribution.trim() || !selection.evidence.trim());
}

export function incompleteTwinContributions(selections: TwinSelections) {
  return selectedTwinTraps(selections).filter(({ selection }) => twinContributionNeedsEvidence(selection));
}

export function groupTwinFindings(selections: TwinSelections) {
  const findings = selectedTwinTraps(selections);
  return twinCategories.flatMap((category) => {
    const entries = findings.filter(({ trap }) => trap.category === category.id);
    return entries.length ? [{ category, entries }] : [];
  });
}
