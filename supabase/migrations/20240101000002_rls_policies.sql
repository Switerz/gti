-- Migration 002: Row Level Security policies (idempotent)

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.task_statuses enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_activity_logs enable row level security;

-- ─── Helper functions (SECURITY DEFINER bypasses RLS in subqueries) ───────────

create or replace function public.is_active_user()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$ language sql security definer stable;

create or replace function public.is_lead_or_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'lead') and active = true
  );
$$ language sql security definer stable;

create or replace function public.can_edit_task(task_id uuid)
returns boolean as $$
  select (
    public.is_lead_or_admin() or
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.creator_id = auth.uid() or t.owner_id = auth.uid())
    ) or
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = task_id and ta.profile_id = auth.uid()
    )
  );
$$ language sql security definer stable;

-- ─── profiles ────────────────────────────────────────────────────────────────

drop policy if exists "Active users can read all profiles" on public.profiles;
create policy "Active users can read all profiles"
  on public.profiles for select
  using (public.is_active_user());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- ─── allowed_emails ──────────────────────────────────────────────────────────

drop policy if exists "Users can check their own allowlist status" on public.allowed_emails;
create policy "Users can check their own allowlist status"
  on public.allowed_emails for select
  using (
    lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    or public.is_admin()
  );

drop policy if exists "Admins can insert allowed emails" on public.allowed_emails;
create policy "Admins can insert allowed emails"
  on public.allowed_emails for insert
  with check (public.is_admin());

drop policy if exists "Admins can update allowed emails" on public.allowed_emails;
create policy "Admins can update allowed emails"
  on public.allowed_emails for update
  using (public.is_admin());

drop policy if exists "Admins can delete allowed emails" on public.allowed_emails;
create policy "Admins can delete allowed emails"
  on public.allowed_emails for delete
  using (public.is_admin());

-- ─── task_statuses ───────────────────────────────────────────────────────────

drop policy if exists "Active users can read task statuses" on public.task_statuses;
create policy "Active users can read task statuses"
  on public.task_statuses for select
  using (public.is_active_user());

drop policy if exists "Admins can manage task statuses" on public.task_statuses;
create policy "Admins can manage task statuses"
  on public.task_statuses for all
  using (public.is_admin());

-- ─── categories ──────────────────────────────────────────────────────────────

drop policy if exists "Active users can read categories" on public.categories;
create policy "Active users can read categories"
  on public.categories for select
  using (public.is_active_user());

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin());

-- ─── projects ────────────────────────────────────────────────────────────────

drop policy if exists "Active users can read active projects" on public.projects;
create policy "Active users can read active projects"
  on public.projects for select
  using (public.is_active_user() and active = true);

drop policy if exists "Lead or admin can create projects" on public.projects;
create policy "Lead or admin can create projects"
  on public.projects for insert
  with check (public.is_lead_or_admin() and created_by = auth.uid());

drop policy if exists "Lead or admin can update projects" on public.projects;
create policy "Lead or admin can update projects"
  on public.projects for update
  using (public.is_lead_or_admin() or created_by = auth.uid());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete
  using (public.is_admin());

-- ─── tasks ───────────────────────────────────────────────────────────────────

drop policy if exists "Active users can read tasks" on public.tasks;
create policy "Active users can read tasks"
  on public.tasks for select
  using (public.is_active_user());

drop policy if exists "Active users can create tasks" on public.tasks;
create policy "Active users can create tasks"
  on public.tasks for insert
  with check (public.is_active_user() and creator_id = auth.uid());

drop policy if exists "Authorized users can update tasks" on public.tasks;
create policy "Authorized users can update tasks"
  on public.tasks for update
  using (public.can_edit_task(id));

drop policy if exists "Authorized users can archive or delete tasks" on public.tasks;
create policy "Authorized users can archive or delete tasks"
  on public.tasks for delete
  using (
    public.is_admin() or
    creator_id = auth.uid() or
    owner_id = auth.uid() or
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = id and ta.profile_id = auth.uid()
    )
  );

-- ─── task_assignees ──────────────────────────────────────────────────────────

drop policy if exists "Active users can read task assignees" on public.task_assignees;
create policy "Active users can read task assignees"
  on public.task_assignees for select
  using (public.is_active_user());

drop policy if exists "Authorized users can add assignees" on public.task_assignees;
create policy "Authorized users can add assignees"
  on public.task_assignees for insert
  with check (public.can_edit_task(task_id));

drop policy if exists "Authorized users can remove assignees" on public.task_assignees;
create policy "Authorized users can remove assignees"
  on public.task_assignees for delete
  using (public.can_edit_task(task_id));

-- ─── task_comments ───────────────────────────────────────────────────────────

drop policy if exists "Active users can read comments" on public.task_comments;
create policy "Active users can read comments"
  on public.task_comments for select
  using (public.is_active_user());

drop policy if exists "Active users can create comments" on public.task_comments;
create policy "Active users can create comments"
  on public.task_comments for insert
  with check (public.is_active_user() and author_id = auth.uid());

drop policy if exists "Authors and admins can update comments" on public.task_comments;
create policy "Authors and admins can update comments"
  on public.task_comments for update
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "Authors and admins can delete comments" on public.task_comments;
create policy "Authors and admins can delete comments"
  on public.task_comments for delete
  using (author_id = auth.uid() or public.is_admin());

-- ─── task_checklist_items ────────────────────────────────────────────────────

drop policy if exists "Active users can read checklist items" on public.task_checklist_items;
create policy "Active users can read checklist items"
  on public.task_checklist_items for select
  using (public.is_active_user());

drop policy if exists "Authorized users can manage checklist items" on public.task_checklist_items;
create policy "Authorized users can manage checklist items"
  on public.task_checklist_items for all
  using (public.can_edit_task(task_id));

-- ─── task_activity_logs ──────────────────────────────────────────────────────

drop policy if exists "Active users can read activity logs" on public.task_activity_logs;
create policy "Active users can read activity logs"
  on public.task_activity_logs for select
  using (public.is_active_user());

drop policy if exists "Active users can create activity logs" on public.task_activity_logs;
create policy "Active users can create activity logs"
  on public.task_activity_logs for insert
  with check (public.is_active_user() and actor_id = auth.uid());
