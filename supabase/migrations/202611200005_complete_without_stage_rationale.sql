-- Keep prior rationale data and revision snapshots while updating the sign-off requirement.
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
          and a.answer_value ~ '[^[:space:]]'
          and exists (
            select 1 from public.evidence_items e
            where e.assessment_id = a.assessment_id and e.answer_id = a.id
              and e.status = 'active' and e.description ~ '[^[:space:]]'
          )
      )
  ) then raise exception 'Every methodology question needs a response and an evidence note before completion'; end if;

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

update public.methodology_questions
set why_text = 'A previous event is not automatic proof of current culpability. Record the evidence that bears on its relevance.'
where question_key = 'previous_history'
  and why_text = 'A previous event is not automatic proof of current culpability. Record relevance and rationale.';
