-- Migration 023: Add remaining responsible members to kpi_assignments
--
-- Members are matched to KPIs by owner_label (the only link in the seed data).
-- Admins and leads already have full access via is_lead_or_admin(); only
-- role='member' profiles need explicit kpi_assignments rows to pass can_edit_kpi().
-- All statements are idempotent via ON CONFLICT (kpi_id, profile_id) DO NOTHING.

-- Anderson Oliveira — B2B KPIs (owner_label 'Anderson e Monique')
insert into public.kpi_assignments (kpi_id, profile_id, assigned_by)
select k.id, p.id, p.id
from public.kpis k
cross join (
  select id from public.profiles
  where email = 'anderson.oliveira@gocase.com' and active = true
) p
where k.owner_label ilike '%Anderson%'
  and k.active = true
on conflict (kpi_id, profile_id) do nothing;

-- Lucas Oliveira — SLA/PMP/Share KPIs (owner_label 'Lucas & Welis')
insert into public.kpi_assignments (kpi_id, profile_id, assigned_by)
select k.id, p.id, p.id
from public.kpis k
cross join (
  select id from public.profiles
  where email = 'lucas.oliveira@gocase.com' and active = true
) p
where k.owner_label ilike '%Lucas%'
  and k.active = true
on conflict (kpi_id, profile_id) do nothing;

-- Welis Ribeiro — SLA/PMP/Share KPIs (owner_label 'Lucas & Welis')
insert into public.kpi_assignments (kpi_id, profile_id, assigned_by)
select k.id, p.id, p.id
from public.kpis k
cross join (
  select id from public.profiles
  where email = 'welis.ribeiro@gocase.com' and active = true
) p
where k.owner_label ilike '%Welis%'
  and k.active = true
on conflict (kpi_id, profile_id) do nothing;

-- Fablicia Lima — Devolução / Insucessos / Reenvios KPIs (owner_label 'Fablicia')
insert into public.kpi_assignments (kpi_id, profile_id, assigned_by)
select k.id, p.id, p.id
from public.kpis k
cross join (
  select id from public.profiles
  where email = 'fablicia.lima@gocase.com' and active = true
) p
where k.owner_label ilike '%Fablicia%'
  and k.active = true
on conflict (kpi_id, profile_id) do nothing;
