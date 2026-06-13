-- Migration 021: Transactional task creation RPC.
--
-- Creates the task, assignee rows and initial activity log in one database
-- transaction while still relying on RLS through auth.uid().

create or replace function public.create_task_with_assignees(
  p_title text,
  p_description text,
  p_status_id uuid,
  p_category_id uuid,
  p_project_id uuid,
  p_owner_id uuid,
  p_priority text,
  p_due_date date,
  p_start_date date,
  p_recurrence_type text,
  p_estimated_hours numeric,
  p_actual_hours numeric,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_task_id uuid;
  v_owner_id uuid := coalesce(p_owner_id, auth.uid());
  v_profile_id uuid;
begin
  if v_actor_id is null then
    raise exception 'authentication required';
  end if;

  insert into public.tasks (
    title,
    description,
    status_id,
    category_id,
    project_id,
    creator_id,
    owner_id,
    priority,
    due_date,
    start_date,
    recurrence_type,
    estimated_hours,
    actual_hours
  )
  values (
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_status_id,
    p_category_id,
    p_project_id,
    v_actor_id,
    v_owner_id,
    coalesce(p_priority, 'medium'),
    p_due_date,
    p_start_date,
    coalesce(p_recurrence_type, 'none'),
    p_estimated_hours,
    p_actual_hours
  )
  returning id into v_task_id;

  for v_profile_id in
    select distinct profile_id
    from unnest(array_append(coalesce(p_assignee_ids, array[]::uuid[]), v_owner_id)) as profile_id
    where profile_id is not null
  loop
    insert into public.task_assignees (task_id, profile_id, assigned_by)
    values (v_task_id, v_profile_id, v_actor_id)
    on conflict do nothing;
  end loop;

  insert into public.task_activity_logs (task_id, actor_id, action)
  values (v_task_id, v_actor_id, 'task_created');

  return v_task_id;
end;
$$;

grant execute on function public.create_task_with_assignees(
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  date,
  date,
  text,
  numeric,
  numeric,
  uuid[]
) to authenticated;
