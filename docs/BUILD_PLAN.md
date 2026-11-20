# NUCLEUS — Build Plan

## Working method

Build one vertical slice at a time. At the start of each task, ask Codex to:
1. Restate the requested outcome.
2. Identify relevant specification sections.
3. Propose files to create/change.
4. State assumptions.
5. State tests to run.

After implementation:
- Review the diff.
- Run checks.
- Try the UI in the browser.
- Update documentation if the design changed.
- Commit a Git checkpoint.

## Phase 0 — Project setup and specification confirmation
- Create Next.js App Router project with TypeScript and Tailwind.
- Install/configure shadcn/ui.
- Create basic layout.
- Add root AGENTS.md and docs.
- Confirm package scripts and run initial build.
- Do not implement full questionnaire yet.

Acceptance: app starts locally, project instructions are present, no real data is used.

## Phase 1 — Dashboard and visual shell
- Build NUCLEUS header and sidebar.
- Add assessment overview.
- Add stage navigation with statuses.
- Add responsive content area.
- Establish typography, palette and shared components.

Acceptance: polished static dashboard with fictional assessment.

## Phase 2 — Question engine
- Define typed question schema.
- Add standard answer states.
- Add explanation and conditional "why" field.
- Add stage navigation and completion logic.
- Add first 2–3 complete stages before expanding to all stages.

Acceptance: answers can be entered, retained during the session and correctly drive branching.

## Phase 3 — Error factors and evidence
- Add factor library and factor status.
- Add evidence reference entry.
- Show factors relevant to the current stage.
- Record supporting and challenging evidence.

Acceptance: factors are contextual and do not create a numeric score.

## Phase 4 — Live narrative
- Build deterministic narrative generation.
- Show established, provisional, disputed and missing information separately.
- Trace each narrative finding to the response(s) that generated it.
- Allow assessor edits while retaining generated text/basis.

Acceptance: changing an answer updates the correct narrative and does not overstate certainty.

## Phase 5 — Analysis and conclusion
- Add Reason human performance classification.
- Add separate Just Culture response consideration.
- Add volition/personal-control analysis.
- Add organisational analysis.
- Add summary, recommendations and provisional verdict.

Acceptance: no automatic final culpability decision; all conclusions explain their basis and uncertainty.

## Phase 6 — Draft report and prototype review
- Create print-friendly report.
- Add export only after format and data handling are reviewed.
- Conduct usability walkthrough with fictional cases.
- Review accessibility, security assumptions and methodology with subject-matter experts.

Acceptance: complete fictional demonstration from assessment creation to draft report.

## Out of scope for MVP
- Multi-user accounts and collaboration.
- Enterprise SSO.
- Public account registration and organisation tenancy.
- Private evidence file uploads (deferred; the schema supports notes/references only).
- AI-generated culpability decisions.
- AI evidence interpretation.
- Production personal-data storage.
- Integrations with plant systems, HR systems or operational technology.

## Approved Supabase development phase

The development prototype may use Supabase PostgreSQL and Auth with fictional records. Implement the committed migration and owner-scoped RLS before using a connected project. Keep real data and production deployment out of scope pending the specialist reviews described in `docs/SUPABASE_AND_DATA_GOVERNANCE.md`.
