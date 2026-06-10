-- Migration 019: Security hardening
--
-- Fixes two classes of advisor warnings:
--   1. function_search_path_mutable — adds SET search_path = public to all
--      SECURITY DEFINER functions that were missing it.
--   2. anon_security_definer_function_executable — revokes EXECUTE from the
--      anon role on functions that unauthenticated users must never call.

-- ─── 1. Fix mutable search_path ──────────────────────────────────────────────

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

create or replace function public.is_lead_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'lead') and active = true
  );
$$;

create or replace function public.can_edit_task(task_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    public.is_lead_or_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.creator_id = auth.uid() or t.owner_id = auth.uid())
    )
    or exists (
      select 1 from public.task_assignees ta
      where ta.task_id = task_id and ta.profile_id = auth.uid()
    )
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_role text;
begin
  select role into allowed_role
  from public.allowed_emails
  where lower(email) = lower(new.email) and active = true;

  if allowed_role is not null then
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url',
      allowed_role
    )
    on conflict (id) do update
      set
        email      = excluded.email,
        full_name  = excluded.full_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  end if;

  return new;
end;
$$;

-- ─── 2. Revoke anon access from SECURITY DEFINER functions ───────────────────

-- Auth helpers — only meaningful for authenticated sessions
revoke execute on function public.is_active_user() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_lead_or_admin() from anon;
revoke execute on function public.can_edit_task(uuid) from anon;
revoke execute on function public.can_edit_kpi(uuid) from anon;
revoke execute on function public.archive_project(uuid) from anon;

-- Trigger functions — invoked by the database engine, never by clients directly
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_updated_at() from anon;
revoke execute on function public.handle_updated_at() from authenticated;
revoke execute on function public.prevent_profile_privilege_escalation() from anon;
revoke execute on function public.prevent_profile_privilege_escalation() from authenticated;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
