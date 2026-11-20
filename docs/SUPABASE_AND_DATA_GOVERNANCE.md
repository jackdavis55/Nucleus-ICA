# Supabase prototype and data governance

## Approved development boundary

The NUCLEUS development prototype may use Supabase PostgreSQL and Auth. Use fictional demonstration records only. This approval does not cover real personnel, employment, incident, plant, security-sensitive, medical or operational information, production deployment, or evidence file uploads. The application does not claim legal, regulatory or organisational compliance.

The initial operating model is one provisioned assessor account. Disable public sign-up in Supabase Auth. Do not add collaboration, organisation tenancy, SSO or multi-assessor workflows in this phase.

## Local configuration

Create `.env.local` in the repository root from `.env.example` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is expected to be used by the browser client; it is safe only in combination with the database grants and RLS policies. Never add a service-role/secret key to a `NEXT_PUBLIC_` variable or to source control. Supabase project credentials are not included in this repository.

Apply migrations with the Supabase CLI after linking the intended prototype project:

```sh
npx supabase login
npx supabase link
npx supabase db push
```

Provision the assessor account through the Supabase dashboard or a controlled administrative process. Do not enable public sign-up.

## Database and access control

`supabase/migrations/202611170001_initial_schema.sql` creates versioned methodology questions, individuals, incidents, assessments, answers, evidence notes, factors, findings, separate classification records, recommendations and append-only narrative/revision histories.

Each assessment references exactly one individual and one incident. An incident can be referenced by multiple assessments, including assessments for different individuals. Composite foreign keys require child rows to reference a parent with the same owner and assessment. RLS is enabled on all public tables. Methodology content is readable only by authenticated users and is not writable through the Data API. Assessor records are scoped to `auth.uid()`. Working tables have no delete grant; history tables allow insert and read, but not update or delete through the Data API.

Storage is not configured. Evidence is represented by protected database notes/references. A later file upload phase must use a private bucket with policies that validate ownership through the assessment parent and must address malware scanning, file limits, content types, retention and access logging.

## Data lifecycle decisions still required before operational use

This prototype archives records rather than deleting them. Before real data is considered, the organisation must approve:

- Data classification and minimum necessary fields for individuals, sites and event descriptions.
- Retention periods for active, archived, completed and superseded assessments.
- A governed process for export, correction, restriction, legal hold and deletion, including backups and audit copies.
- Backup frequency, recovery objectives, restore testing and access to backups.
- Hosting region/data residency, encryption and key management expectations, device controls and account recovery.
- Audit-log requirements and the treatment of assessor edits, revisions and exports.
- Applicable privacy, employment, records-management, security and nuclear/regulatory requirements.

These questions require specialist data-protection, legal/employment, information-security, records-management and nuclear operations review. RLS and authentication are technical controls, not proof of legal or regulatory compliance.

## Version history

Assessment rows carry a methodology version. Each answer stores a question snapshot so published question changes do not reinterpret an existing answer. `assessment_revisions` and `narrative_versions` are append-only tables intended to preserve prior completed conclusions and narrative edits. A governed reopen/revision workflow must snapshot the current assessment before any completed assessment can be materially changed. Do not add a direct completed-to-editable workflow that bypasses this history requirement.

## TypeScript database types

`src/lib/supabase/database.types.ts` is currently schema-aligned by hand because no Supabase project is linked in this workspace. After linking and applying the schema, regenerate it from the project schema with:

```sh
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

Review the generated diff and retain any app-specific aliases outside the generated file. Do not treat type generation as evidence that the migration or RLS policies have been applied or verified.
