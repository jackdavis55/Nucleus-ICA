-- NUCLEUS database foundation. Development data must remain fictional.
create table public.methodology_versions (
  id uuid primary key default gen_random_uuid(), version text not null unique,
  title text not null, description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  published_at timestamptz, created_at timestamptz not null default now()
);
create table public.methodology_questions (
  id uuid primary key default gen_random_uuid(),
  methodology_version_id uuid not null references public.methodology_versions(id) on delete restrict,
  question_key text not null, stage_key text not null, stage_name text not null,
  question_text text not null, why_text text not null,
  answer_options jsonb not null default '[]'::jsonb,
  branching_rules jsonb not null default '{}'::jsonb, sort_order integer not null,
  unique (methodology_version_id, question_key), unique (id, methodology_version_id)
);
create table public.individuals (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  display_name text not null, reference_code text, notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, id), unique (owner_id, reference_code)
);
create table public.incidents (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  reference text not null, title text not null, occurred_on date, description text, site text,
  status text not null default 'open' check (status in ('open', 'under_review', 'closed', 'archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, id), unique (owner_id, reference)
);
create table public.assessments (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  individual_id uuid not null, incident_id uuid not null,
  methodology_version_id uuid not null references public.methodology_versions(id) on delete restrict,
  reference text not null, status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'archived')),
  revision_number integer not null default 1 check (revision_number > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  completed_at timestamptz, archived_at timestamptz,
  unique (owner_id, id), unique (owner_id, reference),
  unique (owner_id, id, methodology_version_id),
  foreign key (owner_id, individual_id) references public.individuals(owner_id, id) on delete restrict,
  foreign key (owner_id, incident_id) references public.incidents(owner_id, id) on delete restrict
);
create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, methodology_version_id uuid not null,
  methodology_question_id uuid not null, question_key text not null,
  question_snapshot jsonb not null,
  answer_state text not null default 'not_yet_assessed' check (answer_state in
    ('yes', 'partly', 'no', 'unknown', 'not_applicable', 'disputed', 'not_yet_assessed')),
  answer_value text, explanation text, additional_comments text, assessor_rationale text,
  conditional_context jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
  unique (assessment_id, methodology_question_id), unique (owner_id, id),
  unique (owner_id, assessment_id, id),
  foreign key (owner_id, assessment_id, methodology_version_id) references public.assessments(owner_id, id, methodology_version_id) on delete restrict,
  foreign key (methodology_question_id, methodology_version_id) references public.methodology_questions(id, methodology_version_id) on delete restrict
);
create table public.findings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null,
  finding_type text not null check (finding_type in ('causal_contribution', 'volition', 'organisational', 'uncertainty', 'unresolved_question', 'conclusion', 'other')),
  title text not null, interpretation text not null, basis jsonb not null default '{}'::jsonb,
  uncertainty text, status text not null default 'provisional'
    check (status in ('provisional', 'accepted', 'disputed', 'superseded')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, id), unique (owner_id, assessment_id, id),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict
);
create table public.evidence_items (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, answer_id uuid, finding_id uuid,
  evidence_type text not null, source text, description text not null, evidence_date date,
  relevance text, limitations text,
  position text not null check (position in ('supports', 'challenges', 'context', 'undetermined')),
  confidentiality text not null default 'restricted' check (confidentiality in ('restricted', 'sensitive', 'general')),
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  created_at timestamptz not null default now(),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict,
  foreign key (owner_id, assessment_id, answer_id) references public.assessment_answers(owner_id, assessment_id, id) on delete restrict,
  foreign key (owner_id, assessment_id, finding_id) references public.findings(owner_id, assessment_id, id) on delete restrict,
  unique (assessment_id, answer_id, evidence_type),
  check (answer_id is null or finding_id is null)
);
create table public.assessment_factors (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, category text not null, factor_name text not null,
  presence text not null default 'unknown' check (presence in ('present', 'absent', 'unknown', 'disputed')),
  relevance text not null default 'not_assessed' check (relevance in ('relevant', 'possibly_relevant', 'not_relevant', 'not_assessed')),
  influence text, supporting_evidence text, counter_evidence text, assessor_rationale text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, id), unique (owner_id, assessment_id, id),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict
);
create table public.finding_classifications (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, finding_id uuid not null,
  classification_system text not null check (classification_system in ('reason_human_performance', 'just_culture_response')),
  classification text not null, rationale text,
  status text not null default 'provisional' check (status in ('provisional', 'accepted', 'disputed', 'superseded')),
  created_at timestamptz not null default now(),
  foreign key (owner_id, assessment_id, finding_id) references public.findings(owner_id, assessment_id, id) on delete restrict
);
create table public.recommendations (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, title text not null, rationale text,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'completed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, id), unique (owner_id, assessment_id, id),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict
);
create table public.recommendation_findings (
  owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, recommendation_id uuid not null, finding_id uuid not null,
  primary key (recommendation_id, finding_id),
  foreign key (owner_id, assessment_id, recommendation_id) references public.recommendations(owner_id, assessment_id, id) on delete restrict,
  foreign key (owner_id, assessment_id, finding_id) references public.findings(owner_id, assessment_id, id) on delete restrict
);
create table public.assessment_revisions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, revision_number integer not null check (revision_number > 0),
  change_reason text not null, snapshot jsonb not null, created_at timestamptz not null default now(),
  unique (assessment_id, revision_number),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict
);
create table public.narrative_versions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  assessment_id uuid not null, version_number integer not null check (version_number > 0),
  generated_text text not null, basis jsonb not null default '{}'::jsonb, assessor_edited_text text,
  created_at timestamptz not null default now(), unique (assessment_id, version_number),
  foreign key (owner_id, assessment_id) references public.assessments(owner_id, id) on delete restrict
);

create index methodology_questions_order_idx on public.methodology_questions(methodology_version_id, sort_order);
create index individuals_owner_status_idx on public.individuals(owner_id, status, display_name);
create index incidents_owner_status_date_idx on public.incidents(owner_id, status, occurred_on desc);
create index assessments_owner_status_updated_idx on public.assessments(owner_id, status, updated_at desc);
create index assessments_individual_idx on public.assessments(owner_id, individual_id);
create index assessments_incident_idx on public.assessments(owner_id, incident_id);
create index answers_assessment_idx on public.assessment_answers(owner_id, assessment_id);
create index evidence_assessment_idx on public.evidence_items(owner_id, assessment_id);
create index factors_assessment_idx on public.assessment_factors(owner_id, assessment_id);
create index findings_assessment_idx on public.findings(owner_id, assessment_id);
create index recommendations_assessment_idx on public.recommendations(owner_id, assessment_id);
create index revisions_assessment_idx on public.assessment_revisions(owner_id, assessment_id, revision_number desc);
create index narratives_assessment_idx on public.narrative_versions(owner_id, assessment_id, version_number desc);

alter table public.methodology_versions enable row level security;
alter table public.methodology_questions enable row level security;
create policy methodology_versions_read on public.methodology_versions for select to authenticated using (true);
create policy methodology_questions_read on public.methodology_questions for select to authenticated using (true);
revoke all on public.methodology_versions, public.methodology_questions from public, anon, authenticated;
grant select on public.methodology_versions, public.methodology_questions to authenticated;

-- Every assessor-owned table has identical owner-scoped RLS and no delete grant.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'individuals', 'incidents', 'assessments', 'assessment_answers', 'findings',
    'evidence_items', 'assessment_factors', 'finding_classifications', 'recommendations',
    'recommendation_findings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', table_name || '_update_own', table_name);
  end loop;
end $$;

create or replace function public.assessment_is_editable(p_assessment_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.assessments a
    where a.id = p_assessment_id and a.owner_id = (select auth.uid())
      and a.status in ('draft', 'in_progress')
  );
$$;
revoke all on function public.assessment_is_editable(uuid) from public, anon;
grant execute on function public.assessment_is_editable(uuid) to authenticated;

-- Lifecycle transitions happen through guarded functions so completed content
-- cannot be edited or reopened without preserving the prior snapshot.
revoke update on public.assessments from authenticated;
drop policy assessments_update_own on public.assessments;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'assessment_answers', 'findings', 'evidence_items', 'assessment_factors',
    'finding_classifications', 'recommendations', 'recommendation_findings'
  ] loop
    execute format('drop policy %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy %I on public.%I', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()) and (select public.assessment_is_editable(assessment_id)))', table_name || '_insert_editable', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid()) and (select public.assessment_is_editable(assessment_id))) with check (owner_id = (select auth.uid()) and (select public.assessment_is_editable(assessment_id)))', table_name || '_update_editable', table_name);
  end loop;
end $$;

-- Historical records are append-only for authenticated users.
alter table public.assessment_revisions enable row level security;
alter table public.narrative_versions enable row level security;
revoke all on public.assessment_revisions, public.narrative_versions from public, anon, authenticated;
grant select on public.assessment_revisions to authenticated;
grant select, insert on public.narrative_versions to authenticated;
create policy assessment_revisions_select_own on public.assessment_revisions for select to authenticated using (owner_id = (select auth.uid()));
create policy narrative_versions_select_own on public.narrative_versions for select to authenticated using (owner_id = (select auth.uid()));
create policy narrative_versions_insert_own on public.narrative_versions for insert to authenticated with check (owner_id = (select auth.uid()) and (select public.assessment_is_editable(assessment_id)));

create or replace function public.begin_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.assessments set status = 'in_progress', updated_at = now()
  where id = p_assessment_id and owner_id = (select auth.uid()) and status = 'draft';
  if not found and not exists (
    select 1 from public.assessments where id = p_assessment_id
      and owner_id = (select auth.uid()) and status = 'in_progress'
  ) then raise exception 'Assessment not found or not editable'; end if;
end;
$$;

create or replace function public.complete_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  assessment_row public.assessments%rowtype;
  snapshot_json jsonb;
begin
  select * into assessment_row from public.assessments
  where id = p_assessment_id and owner_id = (select auth.uid()) for update;
  if not found or assessment_row.status not in ('draft', 'in_progress') then
    raise exception 'Assessment not found or not editable';
  end if;
  if exists (
    select 1 from public.methodology_questions q
    where q.methodology_version_id = assessment_row.methodology_version_id
      and not exists (
        select 1 from public.assessment_answers a
        where a.assessment_id = assessment_row.id and a.methodology_question_id = q.id
          and nullif(btrim(a.answer_value), '') is not null
          and nullif(btrim(a.assessor_rationale), '') is not null
          and exists (select 1 from public.evidence_items e where e.assessment_id = a.assessment_id and e.answer_id = a.id and e.status = 'active')
      )
  ) then raise exception 'Every methodology question needs a response, rationale, and evidence note before completion'; end if;

  update public.assessments set status = 'completed', completed_at = now(), updated_at = now()
  where id = assessment_row.id returning * into assessment_row;
  snapshot_json := jsonb_build_object(
    'assessment', to_jsonb(assessment_row),
    'answers', coalesce((select jsonb_agg(to_jsonb(r)) from public.assessment_answers r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(to_jsonb(r)) from public.evidence_items r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'factors', coalesce((select jsonb_agg(to_jsonb(r)) from public.assessment_factors r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'findings', coalesce((select jsonb_agg(to_jsonb(r)) from public.findings r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'classifications', coalesce((select jsonb_agg(to_jsonb(r)) from public.finding_classifications r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'recommendations', coalesce((select jsonb_agg(to_jsonb(r)) from public.recommendations r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'recommendation_findings', coalesce((select jsonb_agg(to_jsonb(r)) from public.recommendation_findings r where r.assessment_id = assessment_row.id), '[]'::jsonb),
    'narratives', coalesce((select jsonb_agg(to_jsonb(r)) from public.narrative_versions r where r.assessment_id = assessment_row.id), '[]'::jsonb)
  );
  insert into public.assessment_revisions(owner_id, assessment_id, revision_number, change_reason, snapshot)
  values (assessment_row.owner_id, assessment_row.id, assessment_row.revision_number, 'Assessor completed assessment', snapshot_json);
end;
$$;

create or replace function public.reopen_assessment(p_assessment_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare assessment_row public.assessments%rowtype;
begin
  select * into assessment_row from public.assessments
  where id = p_assessment_id and owner_id = (select auth.uid()) for update;
  if not found or assessment_row.status <> 'completed' then raise exception 'Only a completed assessment can be reopened'; end if;
  if not exists (select 1 from public.assessment_revisions r where r.assessment_id = assessment_row.id and r.revision_number = assessment_row.revision_number) then
    raise exception 'Completed revision snapshot is missing';
  end if;
  update public.assessments set status = 'in_progress', revision_number = revision_number + 1,
    completed_at = null, updated_at = now()
  where id = assessment_row.id returning revision_number into assessment_row.revision_number;
  return assessment_row.revision_number;
end;
$$;

create or replace function public.archive_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.assessments set status = 'archived', archived_at = now(), updated_at = now()
  where id = p_assessment_id and owner_id = (select auth.uid()) and status <> 'archived';
  if not found then raise exception 'Assessment not found'; end if;
end;
$$;

revoke all on function public.begin_assessment(uuid), public.complete_assessment(uuid), public.reopen_assessment(uuid), public.archive_assessment(uuid) from public, anon;
grant execute on function public.begin_assessment(uuid), public.complete_assessment(uuid), public.reopen_assessment(uuid), public.archive_assessment(uuid) to authenticated;

insert into public.methodology_versions (version, title, description, status, published_at)
values ('nucleus-1.0', 'NUCLEUS assessment methodology 1.0', 'Initial versioned NUCLEUS question and analysis baseline.', 'published', now());

insert into public.methodology_questions
  (methodology_version_id, question_key, stage_key, stage_name, question_text, why_text, answer_options, sort_order)
select v.id, q.question_key, q.stage_key, q.stage_name, q.question_text, q.why_text, q.answer_options::jsonb, q.sort_order
from public.methodology_versions v
cross join (values
  ('event', 'event', 'Event, Incident or Non-Conformance', 'What event, incident or non-conformance is being assessed?', 'A clear description establishes the context for reviewing actions, evidence and surrounding conditions.', '[]', 0),
  ('causal_contribution', 'causal', 'Causal contribution', 'Did the individual’s action contribute to the event?', 'Examine individual contribution alongside workplace conditions, organisational factors and failed or missing defences.', '["Yes", "Partly", "No", "Unknown", "Not applicable", "Disputed", "Not yet assessed"]', 1),
  ('intention_outcome', 'intention', 'Intention & outcome', 'Did the action achieve what the individual intended to do at the time?', 'Separating an intended action from an unintended result helps focus on what was understood at the time.', '["Yes", "Partly", "No", "Unknown", "Not applicable", "Disputed", "Not yet assessed"]', 2),
  ('fitness_for_duty', 'fitness', 'Fitness for duty', 'Is there evidence of a relevant fitness-for-duty factor at the time?', 'This identifies whether a restricted specialist review may be appropriate. Do not record diagnoses or detailed medical information here.', '["Yes", "No", "Unknown", "Disputed", "Not yet assessed"]', 3),
  ('training_competence', 'training', 'Training & competence', 'Was the individual appropriately qualified for the task?', 'Consider individual capability alongside task assignment, training, competence assessment and supervision.', '["Yes", "Partly", "No", "Unknown", "Not applicable", "Disputed", "Not yet assessed"]', 4),
  ('knowledge_understanding', 'knowledge', 'Knowledge & understanding', 'Did the individual know the applicable requirement?', 'Assess knowledge from information available at the time and contemporaneous evidence where possible.', '["Yes", "Partly", "No", "Unknown", "Not applicable", "Disputed", "Not yet assessed"]', 5),
  ('procedures_expectations', 'procedures', 'Procedures & expectations', 'Was a relevant and accurate procedure available and accessible?', 'A procedure’s existence does not establish that it was accurate, workable, understood or genuinely expected to be followed.', '["Yes", "Partly", "No", "Unknown", "Not applicable", "Disputed", "Not yet assessed"]', 6),
  ('volition_control', 'volition', 'Volition & personal control', 'Could the individual realistically choose another course of action?', 'A deliberate act does not by itself establish free choice. Consider constraints, understanding and control in context.', '[]', 7),
  ('error_traps', 'factors', 'Error traps & context', 'What error traps might have influenced the action or outcome?', 'Consider relevant conditions; record uncertainty and evidence for and against. Factors are not a score.', '[]', 8),
  ('substitution_test', 'substitution', 'Substitution test', 'Would a similarly qualified and experienced person, facing the same information and conditions, probably have acted differently?', 'Define the comparable person and context they would have known. Avoid hindsight bias.', '["Probably yes", "Probably no", "Unable to determine", "Not yet assessed"]', 9),
  ('previous_history', 'history', 'Previous history', 'Are previous similar events genuinely relevant to the current behaviour?', 'A previous event is not automatic proof of current culpability. Record relevance and rationale.', '["Yes", "No", "Unknown", "Disputed", "Not yet assessed"]', 10)
) as q(question_key, stage_key, stage_name, question_text, why_text, answer_options, sort_order)
where v.version = 'nucleus-1.0';
