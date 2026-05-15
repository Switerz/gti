-- Migration 004: Database triggers

-- ─── updated_at auto-maintenance ─────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_updated_at on public.profiles;
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.projects;
create trigger handle_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.tasks;
create trigger handle_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.task_comments;
create trigger handle_updated_at
  before update on public.task_comments
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.task_checklist_items;
create trigger handle_updated_at
  before update on public.task_checklist_items
  for each row execute procedure public.handle_updated_at();

-- ─── Auto-create profile for new auth users ──────────────────────────────────
-- When a new user signs in for the first time, check the allowlist and create
-- their profile with the correct role. If not in allowlist, no profile is created
-- (client-side auth flow handles the redirect to /unauthorized).

create or replace function public.handle_new_user()
returns trigger as $$
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
        -- role is intentionally NOT updated on conflict to prevent accidental
        -- privilege changes when a user signs in again
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
