"use client";

import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { assessmentStages as stages } from "@/lib/assessment-stages";
import { hasStageResponseAndEvidence } from "@/lib/stage-completion";
import { createClient } from "@/lib/supabase/client";
import { hasCompleteProcedureUse, procedureStageIndex, procedureUseChecks, readProcedureUse, type ProcedureUse } from "@/lib/procedure-use";
import { incompleteTwinContributions, readTwinSelections, setTwinSelected, twinAnswerContext, twinStageIndex, type TwinSelections } from "@/lib/twin/assessment";
import { TwinPanel } from "./twin-panel";
import { TwinFindings } from "./twin-findings";
import type { Database } from "@/lib/supabase/database.types";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Fingerprint,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  Layers3,
  Menu,
  MessageSquareText,
  Printer,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const recommendationOptions = [
  "Individual learning or coaching",
  "Refresher training or competency reassessment",
  "Recommend Competency Procedure Initiation",
  "Procedure review",
  "Work design or interface improvement",
  "Staffing or resourcing review",
  "Supervision or briefing improvement",
  "Barrier or defence improvement",
  "Organisational learning",
  "Independent specialist review",
  "Further evidence gathering",
];
type AssessmentRevision = Database["public"]["Tables"]["assessment_revisions"]["Row"];

const prompts = [
  {
    question: "What event, incident or non-conformance is being assessed?",
    why: "A clear description of the event establishes the context for reviewing the individual's actions, evidence and surrounding conditions.",
    answers: null,
    answerLabel: "Working description",
  },
  {
    question: "Did the individual's action contribute to the event?",
    why: "Examine individual contribution alongside workplace conditions, organisational factors and failed or missing defences.",
    answers: ["Yes", "Partly", "No", "Unknown"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Did the action achieve what the individual intended to do at the time?",
    why: "Separating an intended action from an unintended result helps keep the assessment focused on what was understood at the time.",
    answers: ["Yes", "Partly", "No", "Unknown"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Is there evidence of a relevant fitness-for-duty factor at the time?",
    why: "This prompt identifies whether a restricted specialist review may be appropriate. Do not record diagnoses or detailed medical information here.",
    answers: ["Yes", "No", "Unknown", "Disputed"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Was the individual appropriately qualified for the task?",
    why: "Consider individual capability alongside task assignment, training, competence assessment and supervision.",
    answers: ["Yes", "Partly", "No", "Unknown"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Did the individual know the applicable requirement?",
    why: "Knowledge should be assessed from information available at the time and supported by contemporaneous evidence where possible.",
    answers: ["Yes", "Partly", "No", "Unknown"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Was a relevant and accurate procedure available and accessible?",
    why: "The existence of a procedure does not establish that it was accurate, workable, understood or genuinely expected to be followed.",
    answers: ["Yes", "Partly", "No", "Unknown"],
    answerLabel: "Select the current evidence position",
  },
  {
    question: "Could the individual realistically choose another course of action?",
    why: "A deliberate act does not by itself establish free choice. Consider constraints, understanding and control in context.",
    answers: null,
    answerLabel: "Choice and constraints",
  },
  {
    question: "What error traps might have influenced the action or outcome?",
    why: "Use these prompts to consider relevant conditions. They are not an exhaustive list or a score; record which factors apply, what is uncertain, and the evidence for and against.",
    answers: null,
    answerLabel: "Relevant error traps, evidence and uncertainty",
  },
  {
    question: "Would a similarly qualified and experienced person, facing the same information and conditions, probably have acted differently?",
    why: "Define the comparable person's experience and the context they would have known. Avoid hindsight bias.",
    answers: ["Probably yes", "Probably no", "Unable to determine"],
    answerLabel: "Substitution test",
  },
  {
    question: "Are previous similar events genuinely relevant to the current behaviour?",
    why: "A previous event is not automatic proof of current culpability. Record the evidence that bears on its relevance.",
    answers: ["Yes", "No", "Unknown", "Disputed"],
    answerLabel: "Select the current evidence position",
  },
];

const stateLabel: Record<string, string> = {
  complete: "Complete",
  active: "In progress",
  evidence: "Requires evidence",
  upcoming: "Not started",
};

const questionKeys = ["event", "causal_contribution", "intention_outcome", "fitness_for_duty", "training_competence", "knowledge_understanding", "procedures_expectations", "volition_control", "error_traps", "substitution_test", "previous_history"];
const answerStateByLabel: Record<string, Database["public"]["Tables"]["assessment_answers"]["Row"]["answer_state"]> = {
  Yes: "yes", Partly: "partly", No: "no", Unknown: "unknown", "Not applicable": "not_applicable", Disputed: "disputed", "Disputed / conflicting evidence": "disputed",
};

function StageIcon({ state }: { state: string }) {
  if (state === "complete") return <Check aria-hidden="true" className="size-3.5" />;
  if (state === "evidence") return <TriangleAlert aria-hidden="true" className="size-3.5" />;
  if (state === "active") return <span className="size-2 rounded-full bg-current" />;
  return <span className="size-1.5 rounded-full bg-current/45" />;
}

export function AssessmentWorkspace() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params.assessmentId;
  const [ownerId, setOwnerId] = useState("");
  const [methodologyVersionId, setMethodologyVersionId] = useState("");
  const [questionIds, setQuestionIds] = useState<Record<number, string>>({});
  const [questionDefinitions, setQuestionDefinitions] = useState<Record<number, { question: string; why: string; answers: string[] }>>({});
  const [answerIds, setAnswerIds] = useState<Record<number, string>>({});
  const [evidenceIds, setEvidenceIds] = useState<Record<number, string>>({});
  const [assessmentContext, setAssessmentContext] = useState({ reference: "Loading assessment…", individual: "", incident: "", eventReference: "", eventDate: "", description: "" });
  const [ready, setReady] = useState(false);
  const pendingAutosave = useRef(Promise.resolve());
  const signingOff = useRef(false);
  const [isSigningOff, setIsSigningOff] = useState(false);
  const [signoffError, setSignoffError] = useState("");
  const [saveMessage, setSaveMessage] = useState("Loading your assessment…");
  const [narrativeVersion, setNarrativeVersion] = useState(0);
  const [assessmentRevision, setAssessmentRevision] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState<AssessmentRevision[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [view, setView] = useState<"overview" | "stage" | "summary" | "recommendations" | "report">("overview");
  const [completedStages, setCompletedStages] = useState<Set<number>>(() => new Set());
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [twinSelections, setTwinSelections] = useState<TwinSelections>({});
  const [procedureUse, setProcedureUse] = useState<ProcedureUse>({});
  const [historicalRationales, setHistoricalRationales] = useState<Record<number, string>>({});
  const [evidence, setEvidence] = useState<Record<number, string>>({});
  const [evidencePositions, setEvidencePositions] = useState<Record<number, "supports" | "challenges" | "context" | "undetermined">>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [recommendationRationales, setRecommendationRationales] = useState<Record<string, string>>({});
  const isLocked = isCompleted || isArchived;

  useEffect(() => {
    let active = true;
    async function loadAssessment() {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) { router.replace("/workspace"); return; }
        const { data: record, error: recordError } = await supabase.from("assessments").select("*").eq("id", assessmentId).single();
        if (recordError || !record) { router.replace("/workspace"); return; }
        const [personResult, incidentResult, questionsResult, answersResult, evidenceResult, narrativeResult, revisionsResult] = await Promise.all([
          supabase.from("individuals").select("display_name").eq("id", record.individual_id).single(),
          supabase.from("incidents").select("reference,title,occurred_on,description").eq("id", record.incident_id).single(),
          supabase.from("methodology_questions").select("id,question_key,question_text,why_text,answer_options").eq("methodology_version_id", record.methodology_version_id).order("sort_order"),
          supabase.from("assessment_answers").select("*").eq("assessment_id", assessmentId),
          supabase.from("evidence_items").select("id,answer_id,description,status,position").eq("assessment_id", assessmentId),
          supabase.from("narrative_versions").select("version_number,generated_text,assessor_edited_text").eq("assessment_id", assessmentId).order("version_number", { ascending: false }).limit(1),
          supabase.from("assessment_revisions").select("*").eq("assessment_id", assessmentId).order("revision_number", { ascending: false }),
        ]);
        if (!active) return;
        if (personResult.error || incidentResult.error || questionsResult.error || answersResult.error || evidenceResult.error || revisionsResult.error) {
          setSaveMessage("Could not load assessment data. Check the migration and Supabase connection."); return;
        }
        const questionMap: Record<number, string> = {};
        const definitions: Record<number, { question: string; why: string; answers: string[] }> = {};
        for (const question of questionsResult.data ?? []) {
          const index = questionKeys.indexOf(question.question_key);
          if (index >= 0) {
            questionMap[index] = question.id;
            definitions[index] = { question: question.question_text, why: question.why_text, answers: Array.isArray(question.answer_options) ? question.answer_options.filter((answer): answer is string => typeof answer === "string") : [] };
          }
        }
        if (Object.keys(questionMap).length !== prompts.length) {
          setSaveMessage("The question set is missing. Apply the migration before using this assessment.");
          return;
        }
        const answerMap: Record<number, string> = {};
        const evidenceMap: Record<number, string> = {};
        const loadedResponses: Record<number, string> = {};
        const loadedRationales: Record<number, string> = {};
        const loadedEvidence: Record<number, string> = {};
        const loadedEvidencePositions: Record<number, "supports" | "challenges" | "context" | "undetermined"> = {};
        const completed = new Set<number>();
        const answers = answersResult.data ?? [];
        const evidences = evidenceResult.data ?? [];
        const loadedProcedureUse = readProcedureUse(
          answers.find((answer) => answer.question_key === questionKeys[procedureStageIndex])?.conditional_context,
        );
        setProcedureUse(loadedProcedureUse);
        setTwinSelections(readTwinSelections(
          answers.find((answer) => answer.question_key === questionKeys[twinStageIndex])?.conditional_context,
        ));
        answers.forEach((answer) => {
          const index = questionKeys.indexOf(answer.question_key);
          if (index < 0) return;
          answerMap[index] = answer.id;
          loadedResponses[index] = answer.answer_value ?? answer.explanation ?? "";
          loadedRationales[index] = answer.assessor_rationale ?? "";
          const evidenceItem = evidences.find((item) => item.answer_id === answer.id && item.status === "active");
          if (evidenceItem) { evidenceMap[index] = evidenceItem.id; loadedEvidence[index] = evidenceItem.description; loadedEvidencePositions[index] = evidenceItem.position; }
          const checksComplete = index !== procedureStageIndex || record.status === "completed" ||
            record.status === "archived" || hasCompleteProcedureUse(loadedProcedureUse);
          if (checksComplete && hasStageResponseAndEvidence(loadedResponses[index], loadedEvidence[index])) completed.add(index);
        });
        setOwnerId(authData.user.id);
        setMethodologyVersionId(record.methodology_version_id);
        setAssessmentRevision(record.revision_number);
        setIsCompleted(record.status === "completed");
        setIsArchived(record.status === "archived");
        setQuestionIds(questionMap);
        setQuestionDefinitions(definitions);
        setAnswerIds(answerMap);
        setEvidenceIds(evidenceMap);
        setRevisionHistory(revisionsResult.data ?? []);
        setResponses(loadedResponses); setHistoricalRationales(loadedRationales); setEvidence(loadedEvidence); setEvidencePositions(loadedEvidencePositions); setCompletedStages(completed);
        setAssessmentContext({ reference: record.reference, individual: personResult.data?.display_name ?? "", incident: incidentResult.data?.title ?? "", eventReference: incidentResult.data?.reference ?? "", eventDate: incidentResult.data?.occurred_on ?? "", description: incidentResult.data?.description ?? "" });
        const latestNarrative = narrativeResult.data?.[0];
        if (latestNarrative) { setSummaryText(latestNarrative.assessor_edited_text ?? latestNarrative.generated_text); setNarrativeVersion(latestNarrative.version_number); }
        setReady(true); setSaveMessage("All changes save automatically.");
      } catch {
        if (active) setSaveMessage("Supabase is not configured. Return to the workspace and check your environment settings.");
      }
    }
    void loadAssessment();
    return () => { active = false; };
  }, [assessmentId, router]);

  useEffect(() => {
    if (!ready || !ownerId || isCompleted || isArchived) return;
    let obsolete = false;
    function enqueueSave() {
      pendingAutosave.current = pendingAutosave.current.then(async () => {
        if (obsolete || signingOff.current) return;
        setSaveMessage("Saving changes…");
        try {
          const supabase = createClient();
          for (let index = 0; index < prompts.length; index += 1) {
            const questionId = questionIds[index];
            if (!questionId) continue;
            const answerValue = responses[index]?.trim() ?? "";
            const evidenceText = evidence[index]?.trim() ?? "";
            const hasChecks = index === procedureStageIndex && Object.values(procedureUse).some(Boolean);
            const hasTwinDraft = index === twinStageIndex && Object.keys(twinSelections).length > 0;
            if (!answerValue && !evidenceText && !answerIds[index] && !hasChecks && !hasTwinDraft) continue;
            const responseLabel = index === 0 ? "Not yet assessed" : answerValue;
            const answerPayload = {
              owner_id: ownerId, assessment_id: assessmentId, methodology_version_id: methodologyVersionId,
              methodology_question_id: questionId, question_key: questionKeys[index],
              question_snapshot: { question: questionDefinitions[index]?.question ?? prompts[index].question, why: questionDefinitions[index]?.why ?? prompts[index].why, stage: stages[index].name },
              answer_state: answerStateByLabel[responseLabel] ?? "not_yet_assessed" as const,
              answer_value: answerValue || null, explanation: index === 0 ? answerValue || null : null,
              additional_comments: null, conditional_context: index === procedureStageIndex ? { procedure_use: procedureUse }
                : index === twinStageIndex ? twinAnswerContext(twinSelections) : {}, updated_at: new Date().toISOString(),
            };
            const { data: savedAnswer, error: answerError } = await supabase.from("assessment_answers").upsert(answerPayload, { onConflict: "assessment_id,methodology_question_id" }).select("id").single();
            if (answerError || !savedAnswer) throw answerError ?? new Error("Unable to save an answer.");
            setAnswerIds((current) => current[index] === savedAnswer.id ? current : { ...current, [index]: savedAnswer.id });
            if (evidenceText) {
              const { data: savedEvidence, error: evidenceError } = await supabase.from("evidence_items").upsert({
                owner_id: ownerId, assessment_id: assessmentId, answer_id: savedAnswer.id, finding_id: null,
                evidence_type: "assessor_reference", source: null, description: evidenceText, evidence_date: null,
                relevance: null, limitations: null, position: evidencePositions[index] ?? "undetermined", confidentiality: "restricted", status: "active",
              }, { onConflict: "assessment_id,answer_id,evidence_type" }).select("id").single();
              if (evidenceError || !savedEvidence) throw evidenceError ?? new Error("Unable to save evidence note.");
              setEvidenceIds((current) => current[index] === savedEvidence.id ? current : { ...current, [index]: savedEvidence.id });
            } else if (evidenceIds[index]) {
              const { error: withdrawError } = await supabase.from("evidence_items").update({ status: "withdrawn" }).eq("id", evidenceIds[index]);
              if (withdrawError) throw withdrawError;
            }
          }
          if (Object.values(responses).some(Boolean) || Object.values(evidence).some(Boolean) || Object.values(procedureUse).some(Boolean) || Object.keys(twinSelections).length > 0) {
            const { error: lifecycleError } = await supabase.rpc("begin_assessment", { p_assessment_id: assessmentId });
            if (lifecycleError) throw lifecycleError;
          }
          if (!obsolete && !signingOff.current) setSaveMessage("All changes saved.");
        } catch {
          if (!obsolete && !signingOff.current) setSaveMessage("Save failed. Check your connection; your changes remain on screen until you leave.");
        }
      });
    }
    const timeout = window.setTimeout(enqueueSave, 700);
    return () => {
      obsolete = true;
      window.clearTimeout(timeout);
    };
  }, [ready, ownerId, methodologyVersionId, assessmentId, questionIds, questionDefinitions, answerIds, responses, procedureUse, twinSelections, evidence, evidencePositions, evidenceIds, isCompleted, isArchived]);

  async function saveNarrativeVersion() {
    if (!ready || isCompleted || isArchived || !summaryText.trim()) return;
    const supabase = createClient();
    setSaveMessage("Saving narrative version…");
    const basis = {
      kind: "assessor_authored_summary",
      assessment_reference: assessmentContext.reference,
      answer_ids: Object.values(answerIds),
      methodology_version_id: methodologyVersionId,
    };
    const { error } = await supabase.from("narrative_versions").insert({
      owner_id: ownerId, assessment_id: assessmentId, version_number: narrativeVersion + 1,
      generated_text: "No automated narrative was generated. The following text was entered by the assessor.",
      basis, assessor_edited_text: summaryText.trim(),
    });
    if (error) { setSaveMessage("Could not save narrative version. Please retry."); return; }
    setNarrativeVersion((version) => version + 1);
    setSaveMessage(`Narrative version ${narrativeVersion + 1} saved.`);
  }

  async function saveAssessmentSnapshot() {
    if (!ready || isCompleted || isArchived || signingOff.current || completedStages.size !== stages.length) return;
    if (twinSignoffIssues.length) {
      setSignoffError("Add a contribution explanation and evidence for every TWIN trap marked Contributing.");
      return;
    }
    setSignoffError("");
    signingOff.current = true;
    setIsSigningOff(true);
    setSaveMessage("Preserving assessment revision…");
    let completionConfirmed = false;
    try {
      await pendingAutosave.current;
      const supabase = createClient();
      for (let index = 0; index < prompts.length; index += 1) {
        const questionId = questionIds[index];
        if (!questionId) continue;
        const answerValue = responses[index]?.trim() ?? "";
        const evidenceText = evidence[index]?.trim() ?? "";
        const { data: savedAnswer, error: answerError } = await supabase.from("assessment_answers").upsert({
          owner_id: ownerId, assessment_id: assessmentId, methodology_version_id: methodologyVersionId,
          methodology_question_id: questionId, question_key: questionKeys[index],
          question_snapshot: { question: questionDefinitions[index]?.question ?? prompts[index].question, why: questionDefinitions[index]?.why ?? prompts[index].why, stage: stages[index].name },
          answer_state: answerStateByLabel[index === 0 ? "Not yet assessed" : answerValue] ?? "not_yet_assessed" as const,
          answer_value: answerValue || null, explanation: index === 0 ? answerValue || null : null,
          additional_comments: null, conditional_context: index === procedureStageIndex ? { procedure_use: procedureUse }
                : index === twinStageIndex ? twinAnswerContext(twinSelections) : {}, updated_at: new Date().toISOString(),
        }, { onConflict: "assessment_id,methodology_question_id" }).select("id").single();
        if (answerError || !savedAnswer) { setSignoffError("Could not save all answers. Assessment remains editable."); return; }
        if (evidenceText) {
          const { error } = await supabase.from("evidence_items").upsert({ owner_id: ownerId, assessment_id: assessmentId, answer_id: savedAnswer.id, finding_id: null, evidence_type: "assessor_reference", source: null, description: evidenceText, evidence_date: null, relevance: null, limitations: null, position: evidencePositions[index] ?? "undetermined", confidentiality: "restricted", status: "active" }, { onConflict: "assessment_id,answer_id,evidence_type" });
          if (error) { setSignoffError("Could not save all evidence notes. Assessment remains editable."); return; }
        }
      }
      const { error } = await supabase.rpc("complete_assessment", { p_assessment_id: assessmentId });
      if (error) {
        setSignoffError(error.message.includes("response, rationale, and evidence note")
          ? "Sign-off still requires the old rationale field in this database. Apply the completion-rule migration and try again."
          : error.message);
        return;
      }
      completionConfirmed = true;
      setIsCompleted(true);
      setSaveMessage(`Completed. Revision ${assessmentRevision} has been preserved.`);
      const { data: revisions, error: historyError } = await supabase.from("assessment_revisions")
        .select("*").eq("assessment_id", assessmentId).order("revision_number", { ascending: false });
      if (!historyError) setRevisionHistory(revisions ?? []);
    } catch {
      if (!completionConfirmed) {
        setSignoffError("Could not confirm completion. Refresh to check the assessment status before retrying.");
      }
    } finally {
      signingOff.current = false;
      setIsSigningOff(false);
    }
  }

  async function reopenAssessment() {
    if (!isCompleted || !ready) return;
    if (!window.confirm(`Open revision ${assessmentRevision + 1} for editing? Completed revision ${assessmentRevision} will stay in the assessment history.`)) return;
    const supabase = createClient();
    setSaveMessage("Opening a new revision…");
    const { data: nextRevision, error } = await supabase.rpc("reopen_assessment", { p_assessment_id: assessmentId });
    if (error) { setSaveMessage("Could not reopen. The completed revision remains preserved."); return; }
    if (!hasCompleteProcedureUse(procedureUse)) {
      setCompletedStages((current) => {
        const next = new Set(current);
        next.delete(procedureStageIndex);
        return next;
      });
    }
    setAssessmentRevision(nextRevision); setIsCompleted(false); setSaveMessage(`Reopened as revision ${nextRevision}. Prior revision preserved.`);
  }
  const twinSignoffIssues = incompleteTwinContributions(twinSelections);
  const activePrompt = { ...prompts[activeStage], ...questionDefinitions[activeStage] };
  const needsProcedureChecks = activeStage === procedureStageIndex && !hasCompleteProcedureUse(procedureUse);
  const canCompleteStage = !isLocked && !needsProcedureChecks &&
    hasStageResponseAndEvidence(responses[activeStage], evidence[activeStage]);
  const responseRecorded = (index: number) => Boolean(
    responses[index]?.trim() || (index === procedureStageIndex && Object.values(procedureUse).some(Boolean)) ||
      (index === twinStageIndex && Object.values(twinSelections).some((selection) => selection?.selected)),
  );
  const completedCount = completedStages.size;
  const stageStatuses = stages.map((_, index) => {
    if (completedStages.has(index)) return "complete";
    if (view === "stage" && activeStage === index) return "active";
    const hasAnyEntry = Boolean(responseRecorded(index) || evidence[index]?.trim());
    return hasAnyEntry ? (evidence[index]?.trim() ? "active" : "evidence") : "upcoming";
  });
  const statusCounts = {
    complete: stageStatuses.filter((status) => status === "complete").length,
    active: stageStatuses.filter((status) => status === "active").length,
    evidence: stageStatuses.filter((status) => status === "evidence").length,
    upcoming: stageStatuses.filter((status) => status === "upcoming").length,
  };

  function selectStage(index: number) {
    setActiveStage(index);
    setView("stage");
    setReviewOpen(false);
    setSaved(false);
  }

  function updateRecord(setter: Dispatch<SetStateAction<Record<number, string>>>, value: string) {
    if (isCompleted || isArchived) return;
    setter((current) => ({ ...current, [activeStage]: value }));
    markStageEdited();
  }

  function markStageEdited() {
    setCompletedStages((current) => {
      if (!current.has(activeStage)) return current;
      const next = new Set(current);
      next.delete(activeStage);
      return next;
    });
    setSaved(false);
  }

  function completeCurrentStage() {
    if (!canCompleteStage) return;
    setCompletedStages((current) => new Set(current).add(activeStage));
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#f3f6f7] text-[#172b38]">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#102936] text-white shadow-sm print:hidden">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 lg:hidden" aria-label="Assessment stage navigation" onClick={() => document.getElementById("assessment-stages")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              <Menu className="size-5" />
            </Button>
            <Link href="/" aria-label="NUCLEUS home" className="flex min-w-0 items-center gap-3 rounded-lg hover:text-[#c7ece3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#72c5b2] text-[#102936] shadow-inner">
                <Layers3 className="size-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-[0.9rem] font-bold leading-tight sm:text-[1.05rem]">Nucleus - Individual Culpability Assessment</span>
            </Link>
          </div>
          <div className="ml-3 hidden shrink-0 items-center gap-3 md:flex">
            <span className="hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-[#cfdbdf] lg:inline-flex">Demonstration workspace</span>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#dcebe7] text-xs font-semibold text-[#235349]" aria-label="Assessor profile">JD</span>
          </div>
          <Link href="/workspace?view=assessments" className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/30 px-2.5 py-2 text-xs font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="sm:hidden">Assessments</span><span className="hidden sm:inline">Back to assessments</span>
          </Link>
        </div>
      </header>

      <div className="assessment-shell mx-auto grid max-w-[1600px] lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-b border-[#dce4e7] bg-white px-4 py-5 lg:min-h-[calc(100vh-68px)] lg:border-r lg:border-b-0 lg:px-5 lg:py-7 print:hidden">
          <div className="mb-2 px-1"><div className="eyebrow">WORKSPACE</div></div>
          <nav aria-label="Workspace" className="mb-6">
            <button type="button" onClick={() => setView("overview")} aria-current={view === "overview" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${view === "overview" ? "bg-[#e8f4f1] text-[#176b5a] ring-1 ring-inset ring-[#cee5de]" : "text-[#647780] hover:bg-[#f4f7f7] hover:text-[#253b47]"}`}>
              <span className={`flex size-6 items-center justify-center rounded-md ${view === "overview" ? "text-[#176b5a]" : "text-[#819198]"}`}><LayoutDashboard className="size-4" aria-hidden="true" /></span>
              <span className="text-xs font-semibold">Assessment overview</span>
            </button>
          </nav>
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="eyebrow">ASSESSMENT</div>
              <h2 className="mt-1 text-sm font-semibold">Stages</h2>
            </div>
            <Badge className="border-0 bg-[#edf3f4] text-[#526973] hover:bg-[#edf3f4]">{completedCount} of {stages.length}</Badge>
          </div>
          <nav id="assessment-stages" aria-label="Assessment stages" className="stage-scroll flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {stages.map((stage, index) => (
              <button
                key={stage.name}
                type="button"
                onClick={() => selectStage(index)}
                aria-current={view === "stage" && activeStage === index ? "step" : undefined}
                className={`group flex min-w-[200px] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors lg:w-full lg:min-w-0 ${view === "stage" && activeStage === index ? "bg-[#e8f4f1] text-[#176b5a] ring-1 ring-inset ring-[#cee5de]" : "text-[#647780] hover:bg-[#f4f7f7] hover:text-[#253b47]"}`}
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${stageStatuses[index] === "complete" ? "bg-[#d9eee7] text-[#28735e]" : stageStatuses[index] === "active" ? "bg-[#176b5a] text-white" : stageStatuses[index] === "evidence" ? "bg-[#fff0d7] text-[#a36a17]" : "bg-[#f0f3f4] text-[#83939a]"}`}>
                  <StageIcon state={stageStatuses[index]} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-normal break-words text-xs font-medium leading-4">{String(index + 1).padStart(2, "0")} <span className="ml-1">{stage.name}</span></span>
                  <span className={`mt-0.5 block text-[10px] ${stageStatuses[index] === "active" ? "text-[#4d8679]" : "text-[#91a0a6]"}`}>{stateLabel[stageStatuses[index]]}</span>
                </span>
                {view === "stage" && activeStage === index && <ChevronRight className="size-4 shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </nav>
          <div className="mb-2 mt-7 px-1"><div className="eyebrow">REVIEW & OUTPUTS</div></div>
          <nav aria-label="Review and outputs" className="space-y-1">
            <button type="button" onClick={() => setView("summary")} aria-current={view === "summary" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${view === "summary" ? "bg-[#e8f4f1] text-[#176b5a] ring-1 ring-inset ring-[#cee5de]" : "text-[#647780] hover:bg-[#f4f7f7] hover:text-[#253b47]"}`}>
              <span className="flex size-6 items-center justify-center text-[#819198]"><FileText className="size-4" aria-hidden="true" /></span><span className="text-xs font-semibold">Summary</span>
            </button>
            <button type="button" onClick={() => setView("recommendations")} aria-current={view === "recommendations" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${view === "recommendations" ? "bg-[#e8f4f1] text-[#176b5a] ring-1 ring-inset ring-[#cee5de]" : "text-[#647780] hover:bg-[#f4f7f7] hover:text-[#253b47]"}`}>
              <span className="flex size-6 items-center justify-center text-[#819198]"><ClipboardList className="size-4" aria-hidden="true" /></span><span className="text-xs font-semibold">Recommendations</span>
            </button>
            <button type="button" onClick={() => setView("report")} aria-current={view === "report" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${view === "report" ? "bg-[#e8f4f1] text-[#176b5a] ring-1 ring-inset ring-[#cee5de]" : "text-[#647780] hover:bg-[#f4f7f7] hover:text-[#253b47]"}`}>
              <span className="flex size-6 items-center justify-center text-[#819198]"><Printer className="size-4" aria-hidden="true" /></span><span className="text-xs font-semibold">{isLocked ? "Assessment report" : "Draft report"}</span>
            </button>
          </nav>
          <div className="mt-6 hidden rounded-xl border border-[#dfe9e8] bg-[#f7faf9] p-3.5 lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#34564f]"><ShieldCheck className="size-4" aria-hidden="true" /> A considered process</div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6e8187]">Record what is known, what is uncertain, and the evidence behind each interpretation.</p>
          </div>
        </aside>

        <section id="main-content" className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-[#72848b]">
                  <Link href="/workspace?view=assessments" className="hover:underline">Assessments</Link><ChevronRight className="size-3" aria-hidden="true"/><span className="text-[#344c57]">{assessmentContext.reference}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[#18313d] sm:text-[30px]">{view === "overview" ? "Assessment overview" : view === "stage" ? stages[activeStage].name : view === "summary" ? "Assessment summary" : view === "recommendations" ? "Recommendations" : isLocked ? "Assessment report" : "Draft report"}</h1>
                  <Badge variant="outline" className="rounded-full border-[#e9d5ad] bg-[#fff9ec] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#986519]">{isArchived ? "Archived" : isCompleted ? `Completed · revision ${assessmentRevision}` : `Draft · revision ${assessmentRevision}`}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#71828a]">{view === "overview" ? "A structured review of the event, actions and working context." : view === "stage" ? `Stage ${activeStage + 1} of ${stages.length} · ${activePrompt.question}` : view === "summary" ? "Review recorded facts, assessor interpretations and outstanding information." : view === "recommendations" ? "Record proportionate actions and link each one to an assessment finding." : "Review the assessment record, then print or save it as a PDF."}</p>
              </div>
              {(view === "overview" || view === "stage") &&
                <Button className="h-10 rounded-lg bg-[#176b5a] px-4 text-white shadow-sm hover:bg-[#125646]" onClick={() => {
                  if (view === "overview") selectStage(activeStage);
                  else if (activeStage < stages.length - 1) selectStage(activeStage + 1);
                  else setView("report");
                  window.setTimeout(() => document.getElementById("current-stage")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                }}>
                {view === "overview" ? "Continue assessment" : activeStage < stages.length - 1 ? "Next stage" : "Review for sign-off"} <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>}
            </div>

            {isLocked && <div role="status" className="mb-5 rounded-xl border border-[#d7e4e1] bg-[#f1f7f5] p-4 text-sm text-[#405e57]">{isArchived ? "This assessment is archived and read-only." : `Completed revision ${assessmentRevision} is read-only. Reopen it to edit a new revision while keeping this snapshot.`}{isCompleted && <Button size="sm" onClick={reopenAssessment} className="ml-4 bg-[#176b5a] text-white hover:bg-[#125646]">Reopen revision {assessmentRevision + 1}</Button>}{revisionHistory.length > 0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">View preserved revisions ({revisionHistory.length})</summary><div className="mt-3 space-y-3">{revisionHistory.map((revision) => <details key={revision.id} className="rounded-lg border border-[#d7e4e1] bg-white p-3"><summary className="cursor-pointer text-xs font-semibold">Revision {revision.revision_number} · {new Date(revision.created_at).toLocaleString()} · {revision.change_reason}</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-[#526770]">{JSON.stringify(revision.snapshot, null, 2)}</pre></details>)}</div></details>}</div>}
            {!isLocked && !isSigningOff && view !== "report" && completedCount === stages.length && (
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#d7e4e1] bg-[#f1f7f5] p-4 text-sm text-[#405e57]">
                <p>All stages are complete. Sign off the assessment to mark it Completed in the register.</p>
                <Button size="sm" variant="outline" onClick={() => setView("report")}>Review for sign-off</Button>
              </div>
            )}
            {view === "report" && !signoffError && <p role="status" className="mb-3 text-xs text-[#50656d] print:hidden">{saveMessage}</p>}
            <div inert={(isLocked && view !== "report") || isSigningOff ? true : undefined}>
            {(view === "summary" || view === "recommendations") && <div className="mb-5 grid gap-3 rounded-2xl border border-[#dfe7e9] bg-white p-4 shadow-[0_5px_20px_rgba(28,55,67,0.04)] sm:grid-cols-[0.7fr_1.5fr_1fr] sm:items-center sm:px-5">
              <div><div className="eyebrow">EVENT NUMBER</div><div className="mt-1 text-sm font-semibold text-[#304a54]">{assessmentContext.eventReference}</div></div>
              <div><div className="eyebrow">EVENT DESCRIPTION</div><div className="mt-1 text-sm font-semibold text-[#304a54]">{assessmentContext.incident}</div></div>
              <div><div className="eyebrow">INDIVIDUAL</div><div className="mt-1 text-sm font-semibold text-[#304a54]">{assessmentContext.individual}</div></div>
            </div>}

            <div className={`grid gap-5 ${view === "report" ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.8fr)]"}`}>
              <div className="space-y-5">
                {view === "overview" && (
                <Card className="overflow-hidden rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <div className="h-1 bg-gradient-to-r from-[#25816e] via-[#72c5b2] to-[#c5e5dc]" />
                  <CardHeader className="px-5 pt-5 pb-2 sm:px-7 sm:pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="eyebrow">FICTIONAL DEMONSTRATION CASE</div>
                        <CardTitle className="mt-2 text-lg font-semibold text-[#18313d] sm:text-xl">{assessmentContext.individual} — {assessmentContext.incident}</CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-2 text-xs text-[#819097]"><span>Event reference {assessmentContext.eventReference}</span><span aria-hidden="true">•</span><span>{assessmentContext.eventDate || "Date not recorded"}</span></CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-6 sm:px-7">
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoTile icon={<Fingerprint />} label="Individual" value={assessmentContext.individual || "Loading"} detail="Assessed individual" />
                      <InfoTile icon={<ClipboardList />} label="Event" value={assessmentContext.eventReference || "Loading"} detail={assessmentContext.incident} />
                      <InfoTile icon={<Clock3 />} label="Last updated" value={new Date().toLocaleDateString()} detail="By current assessor" />
                    </div>
                    <div className="mt-5 rounded-xl border border-[#e8edef] bg-[#f8fafb] p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#568176] shadow-sm ring-1 ring-[#e6eeec]"><FileText className="size-4" aria-hidden="true" /></div>
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#547078]">Event summary</h3>
                          <p className="mt-2 text-sm leading-relaxed text-[#536971]">{assessmentContext.description || assessmentContext.incident || "No event description has been recorded."}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}

                {view === "stage" && <Card className="rounded-2xl border-[#cfe1dc] bg-[#f8fbfa] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <CardHeader className="px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#e5f2ef] text-[#207463]"><BookOpenCheck className="size-[18px]" aria-hidden="true" /></div>
                        <div><div className="eyebrow">ASSESSMENT STAGE {String(activeStage + 1).padStart(2, "0")}</div><h2 className="mt-1 text-lg font-semibold text-[#213b46]">{stages[activeStage].name}</h2></div>
                      </div>
                      <Badge className="border-0 bg-white text-[#617b75] shadow-sm hover:bg-white">Stage {activeStage + 1} / {stages.length}</Badge>
                    </div>
                    <CardDescription className="ml-12 text-xs text-[#71858a]">Record your response and supporting evidence below.</CardDescription>
                  </CardHeader>
                </Card>}

                {view === "stage" && <Card id="current-stage" className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <CardHeader className="px-5 pt-5 pb-0 sm:px-7 sm:pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><div className="eyebrow">QUESTION 01 · {stages[activeStage].name.toUpperCase()}</div><CardTitle className="mt-1.5 max-w-3xl text-base font-semibold leading-relaxed text-[#213b46]">{activePrompt.question}</CardTitle></div>
                      <Badge className={`border-0 hover:bg-[#e8f4f1] ${completedStages.has(activeStage) ? "bg-[#d9eee7] text-[#28735e]" : "bg-[#e8f4f1] text-[#24715f]"}`}>{completedStages.has(activeStage) ? "Complete" : "In progress"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pt-5 pb-6 sm:px-7">
                    <div className="mt-3 rounded-lg border-l-[3px] border-[#82b9ab] bg-[#f4f9f7] px-4 py-3">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#487166]"><CircleHelp className="size-3.5" aria-hidden="true" /> Why this matters</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#698078]">{activePrompt.why}</p>
                    </div>
                    {activePrompt.answers && activePrompt.answers.length > 0 ? (
                      <fieldset className="mt-5">
                        <legend className="text-xs font-semibold text-[#50656d]">{activePrompt.answerLabel}</legend>
                        <div className={`mt-2.5 grid gap-2 ${activePrompt.answers.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                          {activePrompt.answers.map((answer) => (
                            <button key={answer} type="button" aria-pressed={responses[activeStage] === answer} onClick={() => { updateRecord(setResponses, answer); setReviewOpen(true); }} className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237a68] focus-visible:ring-offset-2 ${responses[activeStage] === answer ? "border-[#77ac9e] bg-[#eff7f4] text-[#216b5b]" : "border-[#e1e8ea] bg-white text-[#64767e] hover:border-[#b9d2cb] hover:bg-[#fbfdfc]"}`}>{answer}</button>
                          ))}
                        </div>
                      </fieldset>
                    ) : (
                      <div className="mt-5">
                        <label htmlFor="response-notes" className="text-xs font-semibold text-[#50656d]">{activePrompt.answerLabel}</label>
                        <textarea id="response-notes" value={responses[activeStage] ?? ""} onChange={(event) => updateRecord(setResponses, event.target.value)} placeholder="Record a concise description based on the available information." className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#e1e8ea] bg-white px-3 py-2.5 text-sm text-[#425c65] outline-none placeholder:text-[#9aa8ac] focus:border-[#77ac9e] focus:ring-2 focus:ring-[#dceee8]" />
                      </div>
                    )}
                    {activeStage === twinStageIndex && (
                      <TwinPanel
                        selections={twinSelections}
                        disabled={!ready || isLocked}
                        onSelect={(trapId, selected) => {
                          setTwinSelections((current) => setTwinSelected(current, trapId, selected));
                        }}
                        onEdit={(trapId, changes) => {
                          setTwinSelections((current) => {
                            const selection = current[trapId];
                            return selection?.selected ? { ...current, [trapId]: { ...selection, ...changes } } : current;
                          });
                        }}
                      />
                    )}
                    {activeStage === procedureStageIndex && (!ready || isLocked || isSigningOff) && (
                      <p role="status" className="mt-5 text-xs text-[#50656d]">
                        {!ready ? saveMessage : isSigningOff ? "Preserving assessment revision…" : isArchived
                          ? "Procedure use is read-only in this archived assessment."
                          : "Reopen this assessment as a new revision to edit procedure use."}
                      </p>
                    )}
                    {activeStage === procedureStageIndex && procedureUseChecks.map(({ key, question, why, options }) => (
                      <div key={key} className="mt-5">
                        {!ready || isLocked || isSigningOff ? (
                          <>
                            <p className="text-xs font-semibold text-[#50656d]">{question}</p>
                            <p className="mt-1 text-sm text-[#425c65]">{ready ? (procedureUse[key] ?? "Not assessed") : "Response unavailable"}</p>
                          </>
                        ) : (
                          <>
                            <label htmlFor={key} className="text-xs font-semibold text-[#50656d]">{question}</label>
                            <p id={`${key}-why`} className="mt-1 text-xs text-[#698078]">{why}</p>
                            <select
                              id={key}
                              aria-describedby={`${key}-why`}
                              value={procedureUse[key] ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setProcedureUse((current) => readProcedureUse({
                                  procedure_use: { ...current, [key]: value || undefined },
                                }));
                                markStageEdited();
                                setReviewOpen(true);
                              }}
                              className="mt-2 block w-full rounded-lg border border-[#dfe9e6] bg-white px-3 py-2 text-sm text-[#425c65] focus-visible:ring-2 focus-visible:ring-[#237a68]"
                            >
                              <option value="">Not assessed</option>
                              {options.map((option) => <option key={option}>{option}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="mt-4 flex flex-col gap-3 border-t border-[#edf1f2] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-[11px] text-[#7a8b91]"><MessageSquareText className="size-3.5" aria-hidden="true" /> {saveMessage}</p>
                      <Button variant="outline" onClick={() => setReviewOpen((open) => !open)} className="h-9 rounded-lg border-[#d8e2e4] text-xs text-[#38535d] hover:bg-[#f5f9f8]">{reviewOpen ? "Hide response details" : "Review response"} <ArrowRight className="ml-2 size-3.5" aria-hidden="true" /></Button>
                    </div>
                    {reviewOpen && <div className="mt-4 grid gap-4 rounded-xl border border-[#e6edef] bg-[#f9fbfb] p-4">
                      <div><label htmlFor="evidence-reference" className="text-xs font-semibold text-[#50656d]">Evidence reference or note</label><textarea id="evidence-reference" value={evidence[activeStage] ?? ""} onChange={(event) => updateRecord(setEvidence, event.target.value)} placeholder="Add a source reference, or state ‘not available’ / ‘not applicable’ and why." className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#e1e8ea] bg-white px-3 py-2.5 text-xs text-[#425c65] outline-none placeholder:text-[#9aa8ac] focus:border-[#77ac9e] focus:ring-2 focus:ring-[#dceee8]" /><label htmlFor="evidence-position" className="mt-3 block text-[11px] font-semibold text-[#50656d]">How does this evidence relate to the current interpretation?</label><select id="evidence-position" value={evidencePositions[activeStage] ?? "undetermined"} onChange={(event) => { setEvidencePositions((current) => ({ ...current, [activeStage]: event.target.value as "supports" | "challenges" | "context" | "undetermined" })); setSaved(false); }} className="mt-1.5 w-full rounded-lg border border-[#dfe9e6] bg-white px-3 py-2 text-xs text-[#425c65]"><option value="undetermined">Not yet assessed</option><option value="supports">Supports interpretation</option><option value="challenges">Challenges interpretation</option><option value="context">Provides context</option></select></div>
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-[#819097]">Prototype only · fictional data. Do not enter real personnel or operational information.</span><Button size="sm" onClick={completeCurrentStage} disabled={!canCompleteStage || !ready} className="bg-[#176b5a] text-white hover:bg-[#125646] disabled:cursor-not-allowed disabled:bg-[#aabbb6]">{completedStages.has(activeStage) ? "Stage complete" : "Complete stage"}</Button></div>
                      {!canCompleteStage && !isLocked && <p className="text-[11px] text-[#8a7770]">Add a response and evidence reference (or explain why evidence is unavailable) to complete this stage.{needsProcedureChecks && " Record both procedure use checks as well."}</p>}
                      {saved && completedStages.has(activeStage) && <p role="status" className="text-xs font-medium text-[#28735e]">Stage marked complete. Editing any entry will reopen it.</p>}
                    </div>}
                  </CardContent>
                </Card>}

                {view === "summary" && <>
                  <Card className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                    <CardHeader className="px-5 pt-5 pb-2 sm:px-7 sm:pt-6">
                      <div className="eyebrow">DRAFT · PROVISIONAL</div>
                      <CardTitle className="mt-1 text-lg text-[#203a45]">Executive summary</CardTitle>
                      <CardDescription>Keep the conclusion reasoned, evidence-based and clear about uncertainty.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-6 sm:px-7">
                      <label htmlFor="executive-summary" className="sr-only">Executive summary</label>
                      <textarea id="executive-summary" value={summaryText} onChange={(event) => setSummaryText(event.target.value)} placeholder="Draft a concise summary of the current assessment. Distinguish facts, interpretations, explanations and unresolved issues." className="min-h-32 w-full resize-y rounded-xl border border-[#e1e8ea] bg-[#fbfcfc] px-4 py-3 text-sm leading-relaxed text-[#425c65] outline-none placeholder:text-[#9aa8ac] focus:border-[#77ac9e] focus:ring-2 focus:ring-[#dceee8]" />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-[#819097]">Prototype only · version {narrativeVersion || "not saved"}. Saving adds an immutable narrative version.</p><Button size="sm" disabled={!ready || !summaryText.trim()} onClick={saveNarrativeVersion} className="bg-[#176b5a] text-white hover:bg-[#125646]">Save narrative version</Button></div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                    <CardHeader className="px-5 pt-5 pb-2 sm:px-7 sm:pt-6"><div className="eyebrow">ASSESSMENT RECORD</div><CardTitle className="mt-1 text-base text-[#203a45]">Facts, responses and open questions</CardTitle></CardHeader>
                    <CardContent className="space-y-4 px-5 pb-6 sm:px-7">
                      <div className="rounded-xl border border-[#e7edef] bg-[#fafcfc] p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#648279]">Recorded case information</div><p className="mt-2 text-xs leading-relaxed text-[#596e76]">{assessmentContext.description || assessmentContext.incident || "No event description has been recorded."}</p></div>
                      <div><h3 className="mb-2 text-xs font-semibold text-[#50656d]">Assessor responses</h3>{stages.map((stage, index) => <div key={stage.name} className="border-t border-[#edf1f2] py-2.5 first:border-t-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-[#435d66]">{String(index + 1).padStart(2, "0")} · {stage.name}</span><span className="text-[10px] text-[#819097]">{completedStages.has(index) ? "Complete" : responseRecorded(index) ? "In progress" : "Not recorded"}</span></div>{responses[index]?.trim() && <p className="mt-1 text-xs leading-relaxed text-[#71828a]">{responses[index]}</p>}{index === procedureStageIndex && <ProcedureUseDetails answers={procedureUse} />}{historicalRationales[index]?.trim() && <p className="mt-1 text-[11px] leading-relaxed text-[#71828a]">Rationale: {historicalRationales[index]}</p>}{evidence[index]?.trim() && <p className="mt-1 text-[11px] leading-relaxed text-[#71828a]">Evidence: {evidence[index]}</p>}</div>)}</div>
                      <div className="rounded-xl border border-[#eadfca] bg-[#fffaf1] p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#967340]">Outstanding work</div><p className="mt-2 text-xs leading-relaxed text-[#796b55]">{stages.length - completedCount} of {stages.length} stages remain incomplete. Human performance classification, organisational contribution and provisional response consideration have not been determined by this prototype.</p></div>
                    </CardContent>
                  </Card>
                </>}

                {view === "recommendations" && <Card className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <CardHeader className="px-5 pt-5 pb-3 sm:px-7 sm:pt-6">
                    <div className="eyebrow">ASSESSOR-RECORDED · NO AUTOMATIC SANCTION</div>
                    <CardTitle className="mt-1 text-lg text-[#203a45]">Potential recommendations</CardTitle>
                    <CardDescription>Select only actions supported by findings. Add the finding or rationale for each selection.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 px-5 pb-6 sm:grid-cols-2 sm:px-7">
                    {recommendationOptions.map((recommendation) => {
                      const selected = selectedRecommendations.includes(recommendation);
                      const fieldId = `recommendation-${recommendationOptions.indexOf(recommendation)}`;
                      return <div key={recommendation} className={`rounded-xl border p-3.5 ${selected ? "border-[#a9cfc3] bg-[#f5faf8]" : "border-[#e7edef] bg-white"}`}>
                        <label className="flex cursor-pointer items-start gap-2.5 text-xs font-medium leading-relaxed text-[#435d66]">
                          <input type="checkbox" checked={selected} onChange={(event) => setSelectedRecommendations((current) => event.target.checked ? [...current, recommendation] : current.filter((item) => item !== recommendation))} className="mt-0.5 size-4 accent-[#176b5a]" />
                          {recommendation}
                        </label>
                        {recommendation === "Recommend Competency Procedure Initiation" && <p className="mt-2 rounded-lg border border-[#eadfca] bg-[#fffaf1] px-3 py-2 text-[11px] leading-relaxed text-[#796b55]">This effectively starts a formal employment process that could lead to suspension or dismissal.</p>}
                        {selected && <div className="mt-3"><label htmlFor={fieldId} className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#668078]">Linked finding or rationale</label><textarea id={fieldId} value={recommendationRationales[recommendation] ?? ""} onChange={(event) => setRecommendationRationales((current) => ({ ...current, [recommendation]: event.target.value }))} placeholder="Identify the supporting assessment finding." className="mt-1.5 min-h-16 w-full resize-y rounded-lg border border-[#dfe9e6] bg-white px-3 py-2 text-xs text-[#425c65] outline-none placeholder:text-[#9aa8ac] focus:border-[#77ac9e] focus:ring-2 focus:ring-[#dceee8]" /></div>}
                      </div>;
                    })}
                    <p className="text-[11px] text-[#819097] sm:col-span-2">Selections are held in this browser session only. Recommendations require assessor review and do not create a disciplinary decision.</p>
                  </CardContent>
                </Card>}

                {view === "report" && <>
                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#d8e4e3] bg-white p-4 sm:flex-row sm:items-center print:hidden">
                    <div><h2 className="text-sm font-semibold text-[#34515b]">Print or save this report as a PDF</h2><p className="mt-1 text-xs text-[#71848a]">Choose “Save as PDF” in your browser’s print destination options.</p></div>
                    <Button onClick={() => window.print()} className="bg-[#176b5a] text-white hover:bg-[#125646]"><Printer className="mr-2 size-4" aria-hidden="true" /> Print / Save as PDF</Button>
                  </div>

                  <article className="print-report rounded-2xl border border-[#dfe7e9] bg-white p-5 shadow-[0_5px_20px_rgba(28,55,67,0.04)] sm:p-8">
                    <header className="border-b-2 border-[#176b5a] pb-5">
                      <div className="eyebrow">NUCLEUS JUST CULTURE · INDIVIDUAL CULPABILITY ASSESSMENT</div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#18313d]">{isLocked ? "Assessment report" : "Draft assessment report"}</h2>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div><div className="eyebrow">EVENT NUMBER</div><div className="mt-1 font-semibold text-[#405b64]">{assessmentContext.eventReference}</div></div>
                        <div><div className="eyebrow">EVENT DESCRIPTION</div><div className="mt-1 font-semibold text-[#405b64]">{assessmentContext.incident}</div></div>
                      <div><div className="eyebrow">INDIVIDUAL</div><div className="mt-1 font-semibold text-[#405b64]">{assessmentContext.individual}</div></div>
                      </div>
                      <p className="mt-3 text-xs text-[#637880]">Assessment reference {assessmentContext.reference} · Fictional demonstration case</p>
                      <div className="mt-4 inline-flex rounded-full border border-[#e9d5ad] bg-[#fff9ec] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#986519]">{isArchived ? "Archived" : isCompleted ? `Completed · revision ${assessmentRevision}` : "Draft · Provisional"} · {completedCount} of {stages.length} stages complete</div>
                    </header>

                    <section className="report-section border-b border-[#e6edef] py-5">
                      <h3 className="text-sm font-bold text-[#294751]">1. Executive summary</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#50656d]">{summaryText.trim() || "No executive summary has been recorded."}</p>
                    </section>

                    <section className="report-section border-b border-[#e6edef] py-5">
                      <h3 className="text-sm font-bold text-[#294751]">2. Incident and assessed individual</h3>
                      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#819198]">Incident</dt><dd className="mt-1 font-medium text-[#405b64]">{assessmentContext.incident}</dd></div>
                        <div><dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#819198]">Event reference / date</dt><dd className="mt-1 font-medium text-[#405b64]">{assessmentContext.eventReference} · {assessmentContext.eventDate || "Date not recorded"}</dd></div>
                        <div><dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#819198]">Individual</dt><dd className="mt-1 font-medium text-[#405b64]">{assessmentContext.individual}</dd></div>
                        <div><dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#819198]">Assessed action</dt><dd className="mt-1 font-medium text-[#405b64]">Record in assessment responses</dd></div>
                      </dl>
                      <p className="mt-3 text-sm leading-relaxed text-[#50656d]">{assessmentContext.description || assessmentContext.incident || "No event description has been recorded."}</p>
                    </section>

                    <section className="report-section border-b border-[#e6edef] py-5">
                      <h3 className="text-sm font-bold text-[#294751]">3. Assessment responses and evidence</h3>
                      <div className="mt-3 space-y-3">
                        {stages.map((stage, index) => <div key={stage.name} className={`rounded-lg border border-[#e7edef] p-3 ${index === twinStageIndex ? "" : "break-inside-avoid"}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-semibold text-[#405b64]">Stage {index + 1}: {stage.name}</h4><span className="text-[10px] text-[#819198]">{completedStages.has(index) ? "Complete" : responseRecorded(index) ? "In progress" : "Not recorded"}</span></div>
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#526871]"><strong>Response:</strong> {responses[index]?.trim() || "Not recorded"}</p>
                          {index === procedureStageIndex && <ProcedureUseDetails answers={procedureUse} />}
                          {index === twinStageIndex && <TwinFindings selections={twinSelections} />}
                          {historicalRationales[index]?.trim() && <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#526871]"><strong>Assessor rationale:</strong> {historicalRationales[index]}</p>}
                          {evidence[index]?.trim() && <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#526871]"><strong>Evidence reference / note:</strong> {evidence[index]}</p>}
                        </div>)}
                      </div>
                    </section>

                    <section className="report-section border-b border-[#e6edef] py-5">
                      <h3 className="text-sm font-bold text-[#294751]">4. Recommendations</h3>
                      {selectedRecommendations.length ? <ul className="mt-3 space-y-3">{selectedRecommendations.map((recommendation) => <li key={recommendation} className="break-inside-avoid text-sm text-[#405b64]"><div className="font-semibold">{recommendation}</div><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#637880]">{recommendationRationales[recommendation]?.trim() || "No supporting finding or rationale recorded."}</p></li>)}</ul> : <p className="mt-2 text-sm text-[#637880]">No recommendations have been selected.</p>}
                    </section>

                    <section className="report-section py-5">
                      <h3 className="text-sm font-bold text-[#294751]">5. Status and limitations</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#50656d]">{stages.length - completedCount} of {stages.length} assessment stages remain incomplete. Human performance classification, organisational contribution and provisional response consideration have not been determined in this prototype.</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#50656d]">This report is from a fictional demonstration. It is decision support only, not a finding of fact, culpability determination, legal conclusion or disciplinary decision. All interpretations and recommendations require assessor review.</p>
                      {!isLocked && twinSignoffIssues.length > 0 && <p role="status" className="mt-3 text-sm text-[#795320]">
                        In Stage 9, add a contribution explanation and evidence for {twinSignoffIssues.map(({ trap }) => trap.label).join(", ")}.
                      </p>}
                      {signoffError && <p role="alert" className="mt-3 text-sm text-red-800 print:hidden">{signoffError}</p>}
                      {!isLocked && <Button disabled={!ready || isSigningOff || completedCount !== stages.length || twinSignoffIssues.length > 0} onClick={saveAssessmentSnapshot} className="mt-4 bg-[#176b5a] text-white hover:bg-[#125646] disabled:bg-[#aabbb6]">Complete assessment and preserve revision</Button>}
                    </section>
                  </article>
                </>}
              </div>

              {view !== "report" && <div className="space-y-5">
                <Card className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <CardHeader id="narrative-panel" className="px-5 pt-5 pb-2">
                    <div className="flex items-center justify-between"><div className="eyebrow">ASSESSMENT STATUS</div><Gauge className="size-4 text-[#72928c]" aria-hidden="true" /></div>
                    <CardTitle className="mt-1 text-base text-[#203a45]">Progress at a glance</CardTitle>
                    <CardDescription className="text-xs">A guide to the work recorded so far.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pt-2 pb-5">
                    <div className="flex items-end justify-between"><span className="text-3xl font-semibold tracking-tight text-[#1c6958]">{completedCount}<span className="text-lg text-[#9aabad"> / {stages.length}</span></span><span className="mb-1 text-xs text-[#74868d]">stages completed</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eaf0f1]"><div className="h-full rounded-full bg-[#50a38d] transition-[width]" style={{ width: `${(completedCount / stages.length) * 100}%` }} /></div>
                    <div className="mt-4 space-y-2.5">
                      <StatusRow icon={<Check />} label="Complete" value={`${statusCounts.complete} ${statusCounts.complete === 1 ? "stage" : "stages"}`} color="green" />
                      <StatusRow icon={<ArrowDownRight />} label="In progress" value={`${statusCounts.active} ${statusCounts.active === 1 ? "stage" : "stages"}`} color="teal" />
                      <StatusRow icon={<TriangleAlert />} label="Requires evidence" value={`${statusCounts.evidence} ${statusCounts.evidence === 1 ? "stage" : "stages"}`} color="amber" />
                      <StatusRow icon={<span className="size-1.5 rounded-full bg-current" />} label="Not started" value={`${statusCounts.upcoming} ${statusCounts.upcoming === 1 ? "stage" : "stages"}`} color="gray" />
                    </div>
                  </CardContent>
                </Card>

                {view !== "overview" && <Card className="rounded-2xl border-[#dfe7e9] py-0 shadow-[0_5px_20px_rgba(28,55,67,0.04)]">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <div className="flex items-center gap-2"><div className="flex size-7 items-center justify-center rounded-lg bg-[#eef3f6] text-[#607d89]"><Sparkles className="size-3.5" aria-hidden="true" /></div><div className="eyebrow">WORKING NARRATIVE</div></div>
                    <CardTitle className="mt-2 text-base text-[#203a45]">Current understanding</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="rounded-xl border border-[#e7edef] bg-[#fafcfc] p-3.5">
                      <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#64a993]"/><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#648279]">Incident record description</span></div>
                      <p className="mt-2 text-xs leading-relaxed text-[#596e76]">{assessmentContext.description || "No incident description has been recorded."}</p>
                    </div>
                    <div className="mt-2.5 rounded-xl border border-[#eadfca] bg-[#fffaf1] p-3.5">
                      <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#d3a251]"/><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#967340]">Current response</span></div>
                      <p className="mt-2 text-xs leading-relaxed text-[#796b55]">{responses[activeStage] ? `${stages[activeStage].name}: ${responses[activeStage]}` : "No response recorded for the selected stage. The sequence cues and work conditions still require review."}</p>
                    </div>
                    <a href="#narrative-panel" className="mt-2 inline-flex h-8 items-center px-1 text-xs text-[#317765] hover:text-[#175e4f]">Open narrative <ArrowRight className="ml-1.5 size-3.5" aria-hidden="true" /></a>
                  </CardContent>
                </Card>}

                <div className="rounded-2xl border border-[#d7e2e2] bg-[#eaf2f1] p-4">
                  <div className="flex gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-[#557c73]"><FlaskConical className="size-4" aria-hidden="true" /></div><div><h3 className="text-xs font-semibold text-[#3c6159]">Prototype data only</h3><p className="mt-1.5 text-[11px] leading-relaxed text-[#627d77]">This demonstration uses fictional information. Do not enter real personnel or operational data.</p></div></div>
                </div>
              </div>}
            </div>

            </div>
            <footer id="stage-overview" className="mt-7 flex flex-col gap-2 border-t border-[#dfe7e9] pt-4 text-[11px] text-[#87969b] sm:flex-row sm:items-center sm:justify-between print:hidden">
              <span className="flex items-center gap-1.5"><History className="size-3.5" aria-hidden="true" /> Demonstration assessment · Updated 17 November 2026</span>
              <span className="flex items-center gap-1.5"><FileCheck2 className="size-3.5" aria-hidden="true" /> Conclusions remain provisional until reviewed</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoTile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[#e7edef] bg-white p-3.5">
      <div className="flex items-center gap-2 text-[#7b9297]"><span className="[&_svg]:size-4">{icon}</span><span className="text-[10px] font-semibold uppercase tracking-[0.07em]">{label}</span></div>
      <div className="mt-2 text-sm font-semibold text-[#314b55]">{value}</div>
      <div className="mt-0.5 text-[10px] text-[#87979c]">{detail}</div>
    </div>
  );
}

function ProcedureUseDetails({ answers }: { answers: ProcedureUse }) {
  return (
    <dl className="mt-1 text-xs leading-relaxed text-[#526871]">
      {procedureUseChecks.map(({ key, reportLabel }) => (
        <div key={key}>
          <dt className="inline font-semibold">{reportLabel}</dt>{" "}
          <dd className="inline">{answers[key] ?? "Not assessed"}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusRow({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: "green" | "teal" | "amber" | "gray" }) {
  const styles = {
    green: "bg-[#e6f3ee] text-[#39816b]",
    teal: "bg-[#e9f3f2] text-[#448477]",
    amber: "bg-[#fff2dc] text-[#b08032]",
    gray: "bg-[#eff2f3] text-[#8c9ba0]",
  }[color];
  return <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className={`flex size-6 items-center justify-center rounded-md [&_svg]:size-3 ${styles}`}>{icon}</span><span className="text-xs text-[#63767e]">{label}</span></div><span className="text-[11px] font-medium text-[#8a999e]">{value}</span></div>;
}
