# First prompt for Codex

Paste the following into a new Codex chat after opening this project folder in VS Code:

---

You are the senior full-stack engineer helping me build NUCLEUS, a standalone Just Culture Assessment System.

Before writing code, read:
- `AGENTS.md`
- `README.md`
- `docs/PROJECT_BRIEF.md`
- `docs/FUNCTIONAL_SPEC.md`
- `docs/ASSESSMENT_METHODOLOGY.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/BUILD_PLAN.md`
- `docs/REFERENCE_REGISTER.md`

Important product scope:
- This is a standalone application for one individual assessor.
- Each assessment concerns one individual and one incident/event or defined unsafe act.
- The MVP uses fictional demonstration data only.
- It is a decision-support tool, not an automated culpability calculator or disciplinary decision-maker.

For this first task, do not build the full application yet.

1. Inspect the current workspace and tell me whether it is empty or contains an existing project.
2. Summarise the product requirements and identify any contradictions or unresolved decisions.
3. Recommend the simplest maintainable Next.js App Router + TypeScript + Tailwind + shadcn/ui setup.
4. Propose the initial folder structure.
5. Identify the first thin vertical slice to implement.
6. List the commands you propose to run and the files you expect to create.
7. Do not add a database, authentication, external AI service or production persistence.
8. Do not make changes until you have presented the plan and I approve it.

Keep the UI polished and appropriate for a nuclear/high-hazard enterprise environment. Use the project documents as the source of truth. If a requirement is ambiguous, ask rather than inventing a policy or assessment rule.

---
