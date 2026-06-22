-- Migration 024: Allow every active user to maintain KPIs and related records.
--
-- The original rule required members to be creator, owner_id, or present in
-- kpi_assignments. Legacy KPIs identify owners through owner_label, so users
-- displayed as responsible were still rejected by RLS. The application treats
-- KPI maintenance as a team operation; inactive users remain blocked.

create or replace function public.can_edit_kpi(kpi_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_active_user();
$$;

revoke execute on function public.can_edit_kpi(uuid) from public;
revoke execute on function public.can_edit_kpi(uuid) from anon;
grant execute on function public.can_edit_kpi(uuid) to authenticated;
