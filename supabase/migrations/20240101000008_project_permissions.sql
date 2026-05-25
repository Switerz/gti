-- Allow all active users to create projects (previously lead/admin only)
drop policy if exists "Lead or admin can create projects" on public.projects;
drop policy if exists "Active users can create projects" on public.projects;
create policy "Active users can create projects"
  on public.projects for insert
  with check (public.is_active_user() and created_by = auth.uid());

-- Allow lead or admin to soft-delete projects via update (active = false)
-- The existing UPDATE policy already covers is_lead_or_admin(), so no change needed there.
-- Hard-delete remains admin-only (existing policy unchanged).
