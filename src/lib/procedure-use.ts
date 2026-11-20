import { z } from "zod";

export const procedureStageIndex = 6;

const uncertaintyOptions = ["Unknown", "Disputed", "Not applicable"] as const;

export const procedureUseChecks = [
  {
    key: "specifiedUse",
    question: "What was the procedure’s specified use?",
    why: "Check the procedure’s use designation to establish how it was expected to be used.",
    reportLabel: "Specified use",
    options: ["Information Only", "Reference Use", "Continuous Use", ...uncertaintyOptions],
  },
  {
    key: "usedAsSpecified",
    question: "Did the individual use the procedure as specified?",
    why: "Compare the specified use with evidence of how the individual used the procedure during the task.",
    reportLabel: "Used as specified",
    options: ["Yes", "Partly", "No", ...uncertaintyOptions],
  },
] as const;

const procedureUseSchema = z.object({
  specifiedUse: z.enum(procedureUseChecks[0].options).optional(),
  usedAsSpecified: z.enum(procedureUseChecks[1].options).optional(),
});

export type ProcedureUse = z.infer<typeof procedureUseSchema>;

export function readProcedureUse(context: unknown): ProcedureUse {
  const result = z.object({ procedure_use: procedureUseSchema }).safeParse(context);
  return result.success ? result.data.procedure_use : {};
}

export function hasCompleteProcedureUse(answers: ProcedureUse) {
  return procedureUseChecks.every(({ key }) => Boolean(answers[key]));
}
