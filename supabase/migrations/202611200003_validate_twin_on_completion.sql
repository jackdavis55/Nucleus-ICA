-- The Stage 9 answer context is included in existing assessment revision snapshots.
create function public.validate_twin_on_completion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1
    from public.assessment_answers a
    cross join lateral jsonb_each(
      case
        when jsonb_typeof(a.conditional_context #> '{twin,selections}') = 'object'
          then a.conditional_context #> '{twin,selections}'
        else '{}'::jsonb
      end
    ) as trap(id, selection)
    where a.assessment_id = new.id
      and a.question_key = 'error_traps'
      and trap.selection -> 'selected' = 'true'::jsonb
      and trap.selection ->> 'status' = 'contributing'
      and (
        jsonb_typeof(trap.selection -> 'contribution') is distinct from 'string'
        or jsonb_typeof(trap.selection -> 'evidence') is distinct from 'string'
        or trap.selection ->> 'contribution' !~ '[^[:space:]]'
        or trap.selection ->> 'evidence' !~ '[^[:space:]]'
      )
  ) then
    raise exception 'Add a contribution explanation and evidence for every TWIN trap marked Contributing';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_twin_on_completion() from public, anon, authenticated;

create trigger validate_twin_on_completion
before update of status on public.assessments
for each row
when (old.status is distinct from new.status and new.status = 'completed')
execute function public.validate_twin_on_completion();
