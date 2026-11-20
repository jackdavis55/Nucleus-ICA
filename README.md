# NUCLEUS — Just Culture Assessment System

This is the project specification pack for developing NUCLEUS with OpenAI Codex in VS Code.

## Product scope

NUCLEUS is a standalone, single-assessor decision-support application. One assessor conducts an assessment concerning one individual in relation to a defined incident or unsafe act. The first release is a prototype using fictional data only.

It is not a culpability calculator, legal decision-maker, HR case-management suite, or replacement for a formal investigation.

## Start here

1. Open this folder in VS Code.
2. Install/enable the OpenAI Codex extension and sign in.
3. Read `AGENTS.md`.
4. Read the documents in `docs/`.
5. Start Codex with the prompt in `docs/CODEX_FIRST_PROMPT.md`.
6. Ask Codex to propose a plan before it changes files.
7. Review each change and run the checks before accepting it.

## Documents

- `AGENTS.md` — persistent instructions for Codex.
- `docs/PROJECT_BRIEF.md` — product purpose, users, scope and principles.
- `docs/FUNCTIONAL_SPEC.md` — user journey, stages, questions and behaviours.
- `docs/ASSESSMENT_METHODOLOGY.md` — Reason, Dekker, human factors and decision safeguards.
- `docs/TECHNICAL_ARCHITECTURE.md` — proposed stack, data structures and design constraints.
- `docs/BUILD_PLAN.md` — staged implementation roadmap.
- `docs/REFERENCE_REGISTER.md` — literature and verification register.
- `docs/SUPABASE_AND_DATA_GOVERNANCE.md` — prototype setup, data lifecycle and production review gates.
- `docs/CODEX_FIRST_PROMPT.md` — first prompt to use in Codex.

## Important

The approved development prototype uses Supabase Auth and PostgreSQL with fictional records only. Do not enter real employee, incident, plant, security-sensitive, medical or operationally sensitive information until security, privacy, deployment and regulatory requirements have been formally reviewed.

## Supabase development setup

1. Create a Supabase project for prototype use and add the URL and publishable key to a root `.env.local` file using `.env.example` as a guide.
2. Provision one assessor in Supabase Auth and keep public sign-up disabled.
3. Install the Supabase CLI, run `npx supabase login`, then `npx supabase link` for the prototype project.
4. Review the migration and run `npx supabase db push`.
5. Start the app with `npm run dev` and sign in with the provisioned account.

Do not enter real data. See `docs/SUPABASE_AND_DATA_GOVERNANCE.md` for the migration, RLS, retention, recovery and review boundaries.
