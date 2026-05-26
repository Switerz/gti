alter table public.tasks
  add column if not exists estimated_hours numeric(6,2) null,
  add column if not exists actual_hours    numeric(6,2) null;
