-- Migration 020: Persist task assignment notifications.
--
-- Realtime-only notifications are easy to miss when the user is offline,
-- refreshes the app, or the websocket reconnects. This table makes assignment
-- notifications durable while keeping visibility scoped to the assigned user.

create table if not exists public.task_assignment_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_assignment_notifications_profile_created
  on public.task_assignment_notifications (profile_id, created_at desc);

create index if not exists idx_task_assignment_notifications_task_id
  on public.task_assignment_notifications (task_id);

create unique index if not exists uq_task_assignment_notifications_assignment
  on public.task_assignment_notifications (profile_id, task_id, created_at);

alter table public.task_assignment_notifications enable row level security;

drop policy if exists "Users can read their task notifications" on public.task_assignment_notifications;
create policy "Users can read their task notifications"
  on public.task_assignment_notifications for select
  using (public.is_active_user() and profile_id = auth.uid());

drop policy if exists "Users can mark their task notifications" on public.task_assignment_notifications;
create policy "Users can mark their task notifications"
  on public.task_assignment_notifications for update
  using (public.is_active_user() and profile_id = auth.uid())
  with check (public.is_active_user() and profile_id = auth.uid());

drop policy if exists "Users can delete their task notifications" on public.task_assignment_notifications;
create policy "Users can delete their task notifications"
  on public.task_assignment_notifications for delete
  using (public.is_active_user() and profile_id = auth.uid());

create or replace function public.create_task_assignment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id = coalesce(new.assigned_by, new.profile_id) then
    return new;
  end if;

  insert into public.task_assignment_notifications (
    profile_id,
    task_id,
    assigned_by,
    created_at
  )
  values (
    new.profile_id,
    new.task_id,
    new.assigned_by,
    coalesce(new.created_at, now())
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists create_task_assignment_notification on public.task_assignees;
create trigger create_task_assignment_notification
  after insert on public.task_assignees
  for each row execute procedure public.create_task_assignment_notification();

revoke execute on function public.create_task_assignment_notification() from public;
