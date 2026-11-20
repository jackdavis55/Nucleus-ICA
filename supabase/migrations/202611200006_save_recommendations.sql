alter table public.recommendations add column selected boolean not null default true;

create function public.save_recommendations(p_assessment_id uuid, p_recommendations jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  item record;
begin
  -- Serialize saves with sign-off using the same assessment row lock.
  perform 1 from public.assessments
  where id = p_assessment_id and owner_id = actor and status in ('draft', 'in_progress')
  for update;
  if not found then raise exception 'Assessment is not editable'; end if;

  if jsonb_typeof(p_recommendations) is distinct from 'array' then
    raise exception 'Recommendations must be an array';
  end if;

  for item in select * from jsonb_to_recordset(p_recommendations)
    as r(title text, rationale text, selected boolean)
  loop
    if nullif(btrim(item.title), '') is null or item.selected is null then
      raise exception 'Each recommendation needs a title and selection state';
    end if;

    update public.recommendations
    set selected = item.selected,
        rationale = case when item.selected then nullif(btrim(item.rationale), '') else rationale end,
        updated_at = now()
    where assessment_id = p_assessment_id and owner_id = actor
      and title = item.title and status = 'proposed';

    if not found and item.selected then
      insert into public.recommendations (owner_id, assessment_id, title, rationale)
      values (actor, p_assessment_id, item.title, nullif(btrim(item.rationale), ''));
    end if;
  end loop;
end;
$$;

revoke all on function public.save_recommendations(uuid, jsonb) from public, anon;
grant execute on function public.save_recommendations(uuid, jsonb) to authenticated;
