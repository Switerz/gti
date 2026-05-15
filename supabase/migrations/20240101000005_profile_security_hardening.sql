-- Migration 005: harden profile self-updates
--
-- RLS allows users to update their own profile so they can keep display
-- metadata in sync with Supabase Auth. This trigger blocks clients from using
-- that self-update path to change security-sensitive columns.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.id = auth.uid() and not public.is_admin() then
    if new.role is distinct from old.role
      or new.active is distinct from old.active
      or new.email is distinct from old.email
      or new.id is distinct from old.id
    then
      raise exception 'profile security fields cannot be changed by the profile owner';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;

create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
