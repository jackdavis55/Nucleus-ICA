-- Run in the SQL Editor of the development prototype, for this fictional case only.
-- A completed case is revised through the same lifecycle functions used by the app.
begin;

do $$
declare
  target public.assessments%rowtype;
  -- UUID supplied for the fictional assessment.
  assessment_id_override constant uuid := '1256244a-5f86-469d-b7df-9229cebba94a';
begin
  select a.* into strict target
  from public.assessments a
  where a.id = assessment_id_override
  for update of a;

  if target.status = 'archived' then
    raise exception 'Assessment % is archived. Backfill requires a draft, in-progress, or completed assessment', target.reference;
  end if;

  perform set_config('nucleus.demo_backfill_assessment', target.id::text, true);
  perform set_config('nucleus.demo_backfill_reopened', 'false', true);

  if target.status = 'completed' and exists (
    select 1
    from public.methodology_questions q
    left join public.assessment_answers a on a.assessment_id = target.id and a.methodology_question_id = q.id
    where q.methodology_version_id = target.methodology_version_id and (
      (q.question_key = 'procedures_expectations'
        and coalesce(jsonb_typeof(a.conditional_context->'procedure_use'), 'object') = 'object'
        and (a.conditional_context#>>'{procedure_use,specifiedUse}' is null
          or a.conditional_context#>>'{procedure_use,usedAsSpecified}' is null))
      or (q.question_key = 'error_traps'
        and (a.conditional_context->'twin' is null
          or a.conditional_context->'twin' = '{"catalogue_version":1,"selections":{}}'::jsonb))
    )
  ) then
    -- The SQL Editor runs as a database administrator. Scope the owner identity
    -- to this transaction so the standard lifecycle functions can check ownership.
    perform set_config('request.jwt.claim.sub', target.owner_id::text, true);
    perform public.reopen_assessment(target.id);
    perform set_config('nucleus.demo_backfill_reopened', 'true', true);
  end if;
exception
  when no_data_found then
    raise exception 'Assessment UUID % was not found in this database. Check the dashboard project and SQL Editor role', assessment_id_override;
end;
$$;

with examples(specified_use, used_as_specified, twin_selections) as (
  values
    ('Continuous Use', 'Yes',
      '{
        "T-12": {
          "selected": true,
          "presence": "Fictional demo: The task required coordinating several checks and tracking information from multiple sources.",
          "contribution": "The overlapping checks divided attention and slowed confirmation of the correct equipment location.",
          "evidence": "Fictional demo evidence: DEMO-01 task sequence and DEMO-02 walkthrough notes.",
          "status": "contributing"
        },
        "W-12": {
          "selected": true,
          "presence": "Fictional demo: Lighting was poor around the equipment labels during the night shift.",
          "contribution": "The low lighting made the labels harder to distinguish during the check.",
          "evidence": "Fictional demo evidence: DEMO-03 mock lighting inspection notes.",
          "status": "contributing"
        },
        "W-15": {
          "selected": true,
          "presence": "Fictional demo: Similar equipment was arranged close together in a layout that made locations easy to confuse.",
          "contribution": "The layout made it harder to match the procedure step to the correct equipment location.",
          "evidence": "Fictional demo evidence: DEMO-04 mock layout sketch and DEMO-02 walkthrough notes.",
          "status": "contributing"
        },
        "N-14": {
          "selected": true,
          "presence": "Fictional demo: The event occurred during the overnight shift.",
          "contribution": "A circadian effect or night-shift fatigue was considered. The available information does not establish fatigue or its contribution.",
          "evidence": "Fictional demo evidence: DEMO-05 fictional shift roster establishes timing only.",
          "status": "undetermined"
        }
      }'::jsonb)
), matches as (
  select a.id, a.reference, a.status, a.owner_id, a.methodology_version_id, e.*
  from public.assessments a
  cross join examples e
  where a.id = current_setting('nucleus.demo_backfill_assessment')::uuid
), editable as (
  select * from matches where status in ('draft', 'in_progress')
), targets as (
  select * from editable where (select count(*) from editable) = 1
), prepared as (
  select t.id, t.owner_id, t.methodology_version_id, q.id as question_id,
    q.question_key, jsonb_build_object(
      'question', q.question_text, 'why', q.why_text, 'stage', q.stage_name
    ) as question_snapshot,
    case q.question_key
      when 'procedures_expectations' then jsonb_build_object(
        'procedure_use', jsonb_build_object('specifiedUse', t.specified_use, 'usedAsSpecified', t.used_as_specified)
      )
      when 'error_traps' then jsonb_build_object(
        'twin', jsonb_build_object('catalogue_version', 1, 'selections', t.twin_selections)
      )
    end as conditional_context
  from targets t
  join public.methodology_questions q on q.methodology_version_id = t.methodology_version_id
  where q.question_key in ('procedures_expectations', 'error_traps')
), saved as (
  insert into public.assessment_answers as existing (
    assessment_id, owner_id, methodology_version_id, methodology_question_id,
    question_key, question_snapshot, conditional_context
  )
  select id, owner_id, methodology_version_id, question_id, question_key, question_snapshot, conditional_context
  from prepared
  on conflict (assessment_id, methodology_question_id) do update
  set conditional_context = existing.conditional_context ||
    case excluded.question_key
      when 'procedures_expectations' then jsonb_build_object(
        'procedure_use',
        -- Where one check already exists, preserve it and use Unknown for the
        -- missing check so a fictional use designation and outcome aren't mixed.
        (case when coalesce(existing.conditional_context->'procedure_use', '{}'::jsonb) = '{}'::jsonb
          then excluded.conditional_context->'procedure_use'
          else '{"specifiedUse":"Unknown","usedAsSpecified":"Unknown"}'::jsonb
        end) || jsonb_strip_nulls(coalesce(existing.conditional_context->'procedure_use', '{}'::jsonb))
      )
      else excluded.conditional_context
    end,
    updated_at = now()
  where (
    excluded.question_key = 'procedures_expectations'
    and coalesce(jsonb_typeof(existing.conditional_context->'procedure_use'), 'object') = 'object'
    and (
      existing.conditional_context#>>'{procedure_use,specifiedUse}' is null
      or existing.conditional_context#>>'{procedure_use,usedAsSpecified}' is null
    )
  ) or (
    excluded.question_key = 'error_traps'
    and (
      not (existing.conditional_context ? 'twin')
      or existing.conditional_context->'twin' = '{"catalogue_version":1,"selections":{}}'::jsonb
    )
  )
  returning assessment_id, question_key, conditional_context
), procedure_result as (
  select coalesce(s.conditional_context, a.conditional_context) -> 'procedure_use' as checks
  from prepared p
  left join saved s on s.assessment_id = p.id and s.question_key = p.question_key
  left join public.assessment_answers a on a.assessment_id = p.id and a.methodology_question_id = p.question_id
  where p.question_key = 'procedures_expectations'
)
select
  case
    when not exists (select 1 from matches) then 'Assessment missing from this database'
    when not exists (select 1 from editable) then 'Completed assessment already has backfill data'
    when (select count(*) from editable) > 1 then 'Multiple editable matches. Use the assessment reference to identify the intended record'
    when not exists (select 1 from procedure_result) then 'Stage 7 question is missing from this assessment methodology'
    when exists (select 1 from saved where question_key = 'procedures_expectations') then 'Stage 7 responses saved'
    else 'Stage 7 responses unchanged. Check the values shown below'
  end as result,
  (select reference from targets) as assessment_reference,
  (select checks ->> 'specifiedUse' from procedure_result) as specified_use,
  (select checks ->> 'usedAsSpecified' from procedure_result) as used_as_specified,
  exists (select 1 from saved where question_key = 'error_traps') as twin_updated;

-- Re-completion snapshots the updated answers and leaves the original snapshot intact.
do $$
begin
  if current_setting('nucleus.demo_backfill_reopened') = 'true' then
    perform public.complete_assessment(current_setting('nucleus.demo_backfill_assessment')::uuid);
  end if;
end;
$$;

select reference as assessment_reference, status, revision_number
from public.assessments
where id = current_setting('nucleus.demo_backfill_assessment')::uuid;

commit;
