# NUCLEUS — Codex project instructions

## Before making changes
- Read `README.md` and all relevant documents in `docs/`.
- Treat the project documents as the product requirements baseline.
- If requirements conflict, stop and identify the conflict rather than silently choosing.
- For substantial work, first provide a short implementation plan, files likely to change, assumptions and tests. Wait for approval before broad changes.
- Do not replace or materially reinterpret the assessment methodology without asking.

## Product boundaries
- This is a standalone, single-assessor application.
- Each assessment concerns one individual in relation to one incident/event or defined unsafe act.
- Do not build multi-user collaboration, employee self-service, case allocation, enterprise identity management or multi-person incident workflows in the MVP.
- The application supports structured reasoning; it does not determine legal culpability or automatically decide discipline.
- Never create a numerical culpability score or calculate a verdict by counting answers or mitigating/aggravating factors.
- Unknown, disputed, not assessed and not applicable are legitimate states. Never force an assessor to invent certainty.
- Keep human performance classification (e.g. slip, lapse, mistake, violation) distinct from Just Culture response categories (e.g. human error, at-risk behaviour, reckless behaviour).
- Keep facts, assessor interpretations, individual explanations, evidence, assumptions and unresolved issues visibly distinct.

## Safety, fairness and governance
- Do not present an automated output as a finding of fact.
- Do not let code or AI assign a final culpability verdict, disciplinary sanction or legal conclusion.
- Every provisional interpretation must be traceable to recorded answers/evidence and remain reviewable by the assessor.
- Include opportunities to record evidence both supporting and challenging a hypothesis.
- Do not infer intent, knowledge, foreseeability, recklessness or freedom of choice from a single answer.
- Do not treat a procedure's existence as proof that it was accurate, workable, understood or genuinely expected to be followed.
- Do not treat prior incidents as automatic proof of current culpability.
- Avoid double negatives in question wording.
- Use neutral, non-leading language and explain why each question is asked.
- Do not collect medical diagnoses or detailed health data in ordinary assessment fields. Refer fitness-for-duty matters to an appropriately restricted process.
- Do not use real employee, plant, event, security or operational data in development fixtures.

## Technical conventions
- Use Next.js App Router, React, TypeScript and Tailwind CSS.
- Use shadcn/ui components where appropriate; use Lucide icons.
- Keep questionnaire content and branching rules data-driven rather than hardcoding every question into page components.
- Use strict TypeScript. Avoid `any` unless there is a documented reason.
- Validate user-entered data at boundaries with Zod where appropriate.
- Keep business logic (classification, branching, narrative generation) separate from presentation components.
- Use accessible labels, keyboard navigation, visible focus states and semantic HTML.
- Prefer small, focused components and clear naming.
- Do not add dependencies without explaining why they are needed.
- Do not introduce external AI APIs, analytics, telemetry, cloud storage or third-party data transfer in the MVP.
- Do not claim local browser storage is secure or suitable for real personnel data.

## Change and test discipline
- Make focused changes. Do not rewrite unrelated files.
- Add or update tests for branching, narrative generation, validation and classification logic.
- Run available lint, typecheck, tests and production build commands after meaningful changes.
- Report exactly which commands were run and whether they passed.
- Do not suppress TypeScript, lint or test errors merely to make a build pass.
- Before finishing, summarise files changed, behaviour added, tests run, limitations and recommended next step.
- Preserve existing work. Do not delete user files or overwrite uncommitted changes without explicit approval.

## MVP data and persistence
- Supabase Auth and PostgreSQL are approved for the development prototype, using fictional demonstration records only.
- This approval does not approve production use or real personnel, incident, plant, security-sensitive, medical or operational data.
- Keep the initial deployment single-assessor, with public sign-up disabled and one provisioned account. Do not add teams, tenancy or collaboration.
- Keep evidence attachments deferred. Evidence notes may be stored in the protected database; any future files must use a private bucket and restrictive policies.
- Preserve archive and history records. Do not add hard-delete flows until retention, export, correction and deletion policy has been reviewed.
- Do not claim local browser storage, Supabase, authentication or RLS alone makes this suitable for real personnel data or makes the application legally/regulatorily compliant.
- Do not store secrets in source control.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
