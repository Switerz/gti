-- Migration 022: Assign Monique to her B2B KPIs
--
-- anamonique.fernandes@gocase.com was unable to save KPI weekly values because
-- no kpi_assignments row existed for her profile. The KPI seeds set owner_label
-- to 'Anderson e Monique' as a text label, but never set the owner_id FK or
-- inserted kpi_assignments rows — so can_edit_kpi() returned false and every
-- INSERT/UPDATE on kpi_weekly_values was blocked by RLS.
--
-- This migration inserts kpi_assignments rows for all KPIs whose owner_label
-- contains 'Monique', using a sub-select on profiles.email so it is safe to
-- re-run (ON CONFLICT DO NOTHING) and does not depend on hard-coded UUIDs.

insert into public.kpi_assignments (kpi_id, profile_id, assigned_by)
select
  k.id   as kpi_id,
  p.id   as profile_id,
  p.id   as assigned_by
from public.kpis k
cross join (
  select id
  from public.profiles
  where email = 'anamonique.fernandes@gocase.com'
    and active = true
) p
where k.owner_label ilike '%Monique%'
  and k.active = true
on conflict (kpi_id, profile_id) do nothing;
