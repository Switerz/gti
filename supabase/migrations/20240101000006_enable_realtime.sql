-- Migration 006: enable Supabase Realtime for operational task tables.
--
-- The frontend subscribes to postgres_changes on these tables. This block is
-- idempotent so it can be re-run safely in projects where some tables were
-- already added to the supabase_realtime publication from the dashboard.

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'tasks',
    'task_assignees',
    'task_comments',
    'task_checklist_items',
    'task_activity_logs'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach table_name in array realtime_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
