-- Migration 001: Initial schema for Gogroup Transport Planner

-- profiles: internal users, linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'lead', 'member')),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- allowed_emails: access control allowlist
create table if not exists public.allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'member' check (role in ('admin', 'lead', 'member')),
  active boolean not null default true,
  created_at timestamptz default now()
);

-- task_statuses: kanban columns
create table if not exists public.task_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  position int not null,
  color text,
  is_final boolean default false,
  created_at timestamptz default now()
);

-- categories: transport team work areas
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  color text,
  active boolean default true,
  created_at timestamptz default now()
);

-- projects: work fronts within categories
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.categories(id),
  active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tasks: main entity
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status_id uuid references public.task_statuses(id) not null,
  category_id uuid references public.categories(id),
  project_id uuid references public.projects(id),
  creator_id uuid references public.profiles(id) not null,
  owner_id uuid references public.profiles(id),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  start_date date,
  completed_at timestamptz,
  position numeric default 0,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- task_assignees: multiple assignees per task
create table if not exists public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  primary key (task_id, profile_id)
);

-- task_comments
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- task_checklist_items
create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- task_activity_logs: immutable audit trail
create table if not exists public.task_activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Performance indexes
create index if not exists idx_tasks_status_id on public.tasks(status_id);
create index if not exists idx_tasks_owner_id on public.tasks(owner_id);
create index if not exists idx_tasks_creator_id on public.tasks(creator_id);
create index if not exists idx_tasks_category_id on public.tasks(category_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_is_archived on public.tasks(is_archived);
create index if not exists idx_task_assignees_profile_id on public.task_assignees(profile_id);
create index if not exists idx_task_comments_task_id on public.task_comments(task_id);
create index if not exists idx_task_activity_logs_task_id on public.task_activity_logs(task_id);
