-- Performance indexes for activity log queries by actor and report queries

create index if not exists idx_task_activity_logs_actor_id
  on public.task_activity_logs (actor_id);

create index if not exists idx_task_activity_logs_created_at
  on public.task_activity_logs (created_at desc);

create index if not exists idx_tasks_due_date
  on public.tasks (due_date)
  where due_date is not null;

create index if not exists idx_tasks_updated_at
  on public.tasks (updated_at desc);
