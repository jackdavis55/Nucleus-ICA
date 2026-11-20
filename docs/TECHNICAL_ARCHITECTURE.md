# NUCLEUS — Technical Architecture

## 1. Proposed MVP stack

- Next.js using App Router.
- React.
- TypeScript with strict mode.
- Tailwind CSS.
- shadcn/ui.
- Lucide icons.
- Zod for user-entered data validation.
- Supabase PostgreSQL, Auth and the official `@supabase/ssr` / `@supabase/supabase-js` packages.
- Unit tests for pure business logic.
- Browser-level tests for critical flows once the basic UI exists.

Use currently supported stable package versions at project creation. Do not hardcode versions from this document.

## 2. Architecture principles

- Keep UI components separate from assessment logic.
- Store question definitions in typed data/configuration.
- Keep branching logic explicit and testable.
- Keep narrative generation deterministic in the MVP.
- Do not call external AI APIs in the MVP.
- Do not introduce external analytics or telemetry.
- Use fictional records only in the approved Supabase development prototype.
- Use an assessor account provisioned outside the application; public sign-up is disabled.
- Treat Supabase Auth as identity and RLS as the database authorization boundary. Never ship a service-role key to the browser.
- Keep storage replaceable so schema and assessment logic remain separable.

## 3. Suggested project structure

```text
nucleus/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   └── assessments/
│       └── [assessmentId]/
│           ├── layout.tsx
│           ├── page.tsx
│           ├── analysis/
│           ├── summary/
│           ├── recommendations/
│           └── verdict/
├── components/
│   ├── layout/
│   ├── assessment/
│   ├── narrative/
│   └── conclusions/
├── data/
│   ├── questions/
│   └── demo/
├── lib/
│   ├── assessment/
│   ├── branching/
│   ├── narrative/
│   └── validation/
├── types/
├── docs/
└── tests/
```

Adapt this to the actual project rather than creating empty folders without a use.

## 4. Core TypeScript concepts

Define explicit types for:
- Assessment
- IncidentSummary
- AssessedIndividual (minimum necessary fields only)
- AssessedAct
- AssessmentStage
- AssessmentQuestion
- QuestionResponse
- EvidenceReference
- ErrorFactor
- NarrativeFinding
- HumanPerformanceClassification
- JustCultureConsideration
- Recommendation
- AssessorConclusion

QuestionResponse should preserve:
- Selected answer.
- Free-text explanation.
- Evidence references.
- Assessor interpretation.
- Status (complete/incomplete/unknown/disputed/not applicable).
- Updated timestamp.

## 5. Data and persistence

The development prototype uses Supabase Auth and PostgreSQL with fictional data only. It does not use production records or evidence uploads. Do not enter real employee or operational information.

Browser localStorage/IndexedDB is not, by itself, a secure solution for sensitive employment or nuclear information. Before production persistence, define:
- Data classification.
- Threat model.
- Encryption at rest and in transit.
- Device access and authentication.
- Backup and recovery.
- Retention and deletion.
- Auditability.
- Data residency and deployment constraints.
- Applicable privacy/employment obligations.

Supabase development persistence has been explicitly approved. This is not approval for production use. Keep attachments out of this phase and do not enable public sign-up.

The schema and migration are under `supabase/`. RLS is enabled on every public table. Owner-scoped rows use `owner_id = auth.uid()` policies, and composite foreign keys bind child records to the same owner and assessment. Authenticated users receive only select/insert/update on working records; historical revision tables are append-only through the Data API. See `docs/SUPABASE_AND_DATA_GOVERNANCE.md` before applying migrations.

## 6. UI layout

- Left sidebar: assessment stages and statuses.
- Header: product name, assessment reference, draft status.
- Main panel: current question, explanation, answer controls and follow-ups.
- Supporting panel/drawer: evidence and error traps.
- Narrative area: current provisional assessment narrative.
- Analysis pages: Reason taxonomy, volition, organisational contributors.
- Conclusion pages: summary, recommendations and provisional verdict.

Use responsive layout, semantic headings, keyboard accessibility, clear focus styles and readable contrast.

## 7. Business logic boundaries

Implement pure functions for:
- Determining question visibility.
- Determining stage completion.
- Updating provisional finding states.
- Generating narrative sentences.
- Suggesting candidate classifications from recorded evidence (never final adjudication).
- Identifying unanswered or conflicting questions.

Any candidate classification must be clearly labelled provisional and must not produce a disciplinary decision.

## 8. Quality checks

At minimum, establish scripts for:
- lint
- typecheck
- test
- build

Add tests for:
- Branching conditions.
- Unknown and disputed answers.
- Narrative provenance.
- Avoiding false claims when evidence is missing.
- No numerical culpability scoring.
- Classification separation.
