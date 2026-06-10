-- Migration 018: Weekly KPIs module for Transportes

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.kpi_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  group_id uuid references public.kpi_groups(id),
  category_id uuid references public.categories(id),
  project_id uuid references public.projects(id),
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  owner_label text,
  product text,
  format_kind text not null default 'number'
    check (format_kind in ('percent', 'number', 'integer', 'days', 'currency', 'text')),
  decimal_places int not null default 1 check (decimal_places >= 0 and decimal_places <= 6),
  target_operator text not null default 'informational'
    check (target_operator in ('gte', 'lte', 'eq', 'informational')),
  target_value numeric,
  target_label text,
  unit_label text,
  chart_type text not null default 'line'
    check (chart_type in ('line', 'bar', 'none')),
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpi_assignments (
  kpi_id uuid references public.kpis(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  primary key (kpi_id, profile_id)
);

create table if not exists public.kpi_weekly_values (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(id) on delete cascade,
  iso_year int not null check (iso_year >= 2000 and iso_year <= 2100),
  iso_week int not null check (iso_week >= 1 and iso_week <= 53),
  week_start date not null,
  week_end date not null,
  value numeric,
  value_text text,
  target_value_snapshot numeric,
  target_operator_snapshot text
    check (
      target_operator_snapshot is null
      or target_operator_snapshot in ('gte', 'lte', 'eq', 'informational')
    ),
  status text not null default 'missing'
    check (status in ('on_track', 'off_track', 'neutral', 'missing')),
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (kpi_id, iso_year, iso_week),
  check (week_end >= week_start)
);

create table if not exists public.kpi_action_plans (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(id) on delete cascade,
  kpi_weekly_value_id uuid references public.kpi_weekly_values(id) on delete set null,
  restriction_text text,
  restriction_doc jsonb,
  action_text text,
  action_doc jsonb,
  due_date date,
  status text not null default 'in_progress'
    check (status in ('not_started', 'in_progress', 'blocked', 'done', 'cancelled')),
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpi_offenders (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(id) on delete cascade,
  kpi_weekly_value_id uuid references public.kpi_weekly_values(id) on delete set null,
  label text not null,
  impact_value numeric not null,
  impact_label text,
  description text,
  position int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpi_comments (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(id) on delete cascade,
  kpi_weekly_value_id uuid references public.kpi_weekly_values(id) on delete set null,
  author_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpi_activity_logs (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid references public.kpis(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null check (
    action in (
      'kpi_created',
      'kpi_updated',
      'weekly_value_created',
      'weekly_value_updated',
      'action_plan_created',
      'action_plan_updated',
      'offender_created',
      'offender_updated',
      'comment_added',
      'kpi_archived'
    )
  ),
  metadata jsonb,
  created_at timestamptz default now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

create index if not exists idx_kpis_owner_id on public.kpis (owner_id);
create index if not exists idx_kpis_group_id on public.kpis (group_id);
create index if not exists idx_kpis_category_id on public.kpis (category_id);
create index if not exists idx_kpis_project_id on public.kpis (project_id);
create index if not exists idx_kpis_active on public.kpis (active);
create index if not exists idx_kpis_product on public.kpis (product);

create index if not exists idx_kpi_assignments_profile_id
  on public.kpi_assignments (profile_id);

create index if not exists idx_kpi_weekly_values_kpi_id
  on public.kpi_weekly_values (kpi_id);
create index if not exists idx_kpi_weekly_values_week
  on public.kpi_weekly_values (iso_year, iso_week);
create index if not exists idx_kpi_weekly_values_status
  on public.kpi_weekly_values (status);

create index if not exists idx_kpi_action_plans_kpi_id
  on public.kpi_action_plans (kpi_id);
create index if not exists idx_kpi_action_plans_status
  on public.kpi_action_plans (status);

create index if not exists idx_kpi_offenders_kpi_id
  on public.kpi_offenders (kpi_id);

create index if not exists idx_kpi_comments_kpi_id
  on public.kpi_comments (kpi_id);

create index if not exists idx_kpi_activity_logs_kpi_id
  on public.kpi_activity_logs (kpi_id);
create index if not exists idx_kpi_activity_logs_created_at
  on public.kpi_activity_logs (created_at desc);

-- ─── updated_at triggers ────────────────────────────────────────────────────

drop trigger if exists handle_updated_at on public.kpi_groups;
create trigger handle_updated_at
  before update on public.kpi_groups
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.kpis;
create trigger handle_updated_at
  before update on public.kpis
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.kpi_weekly_values;
create trigger handle_updated_at
  before update on public.kpi_weekly_values
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.kpi_action_plans;
create trigger handle_updated_at
  before update on public.kpi_action_plans
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.kpi_offenders;
create trigger handle_updated_at
  before update on public.kpi_offenders
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.kpi_comments;
create trigger handle_updated_at
  before update on public.kpi_comments
  for each row execute procedure public.handle_updated_at();

-- ─── RLS helpers ────────────────────────────────────────────────────────────

create or replace function public.can_edit_kpi(kpi_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select (
    public.is_lead_or_admin()
    or exists (
      select 1
      from public.kpis k
      where k.id = $1
        and (
          k.created_by = auth.uid()
          or k.owner_id = auth.uid()
        )
    )
    or exists (
      select 1
      from public.kpi_assignments ka
      where ka.kpi_id = $1
        and ka.profile_id = auth.uid()
    )
  );
$$;

revoke execute on function public.can_edit_kpi(uuid) from public;
grant execute on function public.can_edit_kpi(uuid) to authenticated;

-- ─── Enable RLS ─────────────────────────────────────────────────────────────

alter table public.kpi_groups enable row level security;
alter table public.kpis enable row level security;
alter table public.kpi_assignments enable row level security;
alter table public.kpi_weekly_values enable row level security;
alter table public.kpi_action_plans enable row level security;
alter table public.kpi_offenders enable row level security;
alter table public.kpi_comments enable row level security;
alter table public.kpi_activity_logs enable row level security;

-- ─── kpi_groups policies ────────────────────────────────────────────────────

drop policy if exists "Active users can read active KPI groups" on public.kpi_groups;
create policy "Active users can read active KPI groups"
  on public.kpi_groups for select
  using (public.is_active_user() and active = true);

drop policy if exists "Lead or admin can manage KPI groups" on public.kpi_groups;
create policy "Lead or admin can manage KPI groups"
  on public.kpi_groups for all
  using (public.is_lead_or_admin())
  with check (public.is_lead_or_admin());

-- ─── kpis policies ──────────────────────────────────────────────────────────

drop policy if exists "Active users can read active KPIs" on public.kpis;
create policy "Active users can read active KPIs"
  on public.kpis for select
  using (public.is_active_user() and active = true);

drop policy if exists "Active users can create KPIs" on public.kpis;
create policy "Active users can create KPIs"
  on public.kpis for insert
  with check (public.is_active_user() and created_by = auth.uid());

drop policy if exists "Authorized users can update KPIs" on public.kpis;
create policy "Authorized users can update KPIs"
  on public.kpis for update
  using (public.can_edit_kpi(id))
  with check (public.can_edit_kpi(id));

drop policy if exists "Admins can delete KPIs" on public.kpis;
create policy "Admins can delete KPIs"
  on public.kpis for delete
  using (public.is_admin());

-- ─── kpi_assignments policies ───────────────────────────────────────────────

drop policy if exists "Active users can read KPI assignments" on public.kpi_assignments;
create policy "Active users can read KPI assignments"
  on public.kpi_assignments for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Authorized users can add KPI assignments" on public.kpi_assignments;
create policy "Authorized users can add KPI assignments"
  on public.kpi_assignments for insert
  with check (public.can_edit_kpi(kpi_id));

drop policy if exists "Authorized users can remove KPI assignments" on public.kpi_assignments;
create policy "Authorized users can remove KPI assignments"
  on public.kpi_assignments for delete
  using (public.can_edit_kpi(kpi_id));

-- ─── kpi_weekly_values policies ─────────────────────────────────────────────

drop policy if exists "Active users can read KPI weekly values" on public.kpi_weekly_values;
create policy "Active users can read KPI weekly values"
  on public.kpi_weekly_values for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Authorized users can create KPI weekly values" on public.kpi_weekly_values;
create policy "Authorized users can create KPI weekly values"
  on public.kpi_weekly_values for insert
  with check (public.can_edit_kpi(kpi_id) and created_by = auth.uid());

drop policy if exists "Authorized users can update KPI weekly values" on public.kpi_weekly_values;
create policy "Authorized users can update KPI weekly values"
  on public.kpi_weekly_values for update
  using (public.can_edit_kpi(kpi_id))
  with check (public.can_edit_kpi(kpi_id) and updated_by = auth.uid());

drop policy if exists "Admins can delete KPI weekly values" on public.kpi_weekly_values;
create policy "Admins can delete KPI weekly values"
  on public.kpi_weekly_values for delete
  using (public.is_admin());

-- ─── kpi_action_plans policies ──────────────────────────────────────────────

drop policy if exists "Active users can read KPI action plans" on public.kpi_action_plans;
create policy "Active users can read KPI action plans"
  on public.kpi_action_plans for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Authorized users can create KPI action plans" on public.kpi_action_plans;
create policy "Authorized users can create KPI action plans"
  on public.kpi_action_plans for insert
  with check (public.can_edit_kpi(kpi_id) and created_by = auth.uid());

drop policy if exists "Authorized users can update KPI action plans" on public.kpi_action_plans;
create policy "Authorized users can update KPI action plans"
  on public.kpi_action_plans for update
  using (public.can_edit_kpi(kpi_id))
  with check (public.can_edit_kpi(kpi_id));

drop policy if exists "Authorized users can delete KPI action plans" on public.kpi_action_plans;
create policy "Authorized users can delete KPI action plans"
  on public.kpi_action_plans for delete
  using (public.can_edit_kpi(kpi_id));

-- ─── kpi_offenders policies ─────────────────────────────────────────────────

drop policy if exists "Active users can read KPI offenders" on public.kpi_offenders;
create policy "Active users can read KPI offenders"
  on public.kpi_offenders for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Authorized users can create KPI offenders" on public.kpi_offenders;
create policy "Authorized users can create KPI offenders"
  on public.kpi_offenders for insert
  with check (public.can_edit_kpi(kpi_id) and created_by = auth.uid());

drop policy if exists "Authorized users can update KPI offenders" on public.kpi_offenders;
create policy "Authorized users can update KPI offenders"
  on public.kpi_offenders for update
  using (public.can_edit_kpi(kpi_id))
  with check (public.can_edit_kpi(kpi_id));

drop policy if exists "Authorized users can delete KPI offenders" on public.kpi_offenders;
create policy "Authorized users can delete KPI offenders"
  on public.kpi_offenders for delete
  using (public.can_edit_kpi(kpi_id));

-- ─── kpi_comments policies ──────────────────────────────────────────────────

drop policy if exists "Active users can read KPI comments" on public.kpi_comments;
create policy "Active users can read KPI comments"
  on public.kpi_comments for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Active users can create KPI comments" on public.kpi_comments;
create policy "Active users can create KPI comments"
  on public.kpi_comments for insert
  with check (
    public.is_active_user()
    and author_id = auth.uid()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Authors and admins can update KPI comments" on public.kpi_comments;
create policy "Authors and admins can update KPI comments"
  on public.kpi_comments for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "Authors and admins can delete KPI comments" on public.kpi_comments;
create policy "Authors and admins can delete KPI comments"
  on public.kpi_comments for delete
  using (author_id = auth.uid() or public.is_admin());

-- ─── kpi_activity_logs policies ─────────────────────────────────────────────

drop policy if exists "Active users can read KPI activity logs" on public.kpi_activity_logs;
create policy "Active users can read KPI activity logs"
  on public.kpi_activity_logs for select
  using (
    public.is_active_user()
    and exists (
      select 1 from public.kpis k
      where k.id = kpi_id and k.active = true
    )
  );

drop policy if exists "Active users can create KPI activity logs" on public.kpi_activity_logs;
create policy "Active users can create KPI activity logs"
  on public.kpi_activity_logs for insert
  with check (public.is_active_user() and actor_id = auth.uid());

-- ─── Seeds ──────────────────────────────────────────────────────────────────

insert into public.kpi_groups (name, slug, description, position, active)
values (
  'Principal',
  'principal',
  'Indicadores principais da equipe de Transportes.',
  1,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position,
  active = excluded.active;

with principal_group as (
  select id from public.kpi_groups where slug = 'principal'
),
seeded_kpis (
  name,
  slug,
  target_value,
  target_label,
  product,
  owner_label,
  format_kind,
  decimal_places,
  target_operator,
  unit_label,
  position,
  description
) as (
  values
    ('SLA Site (venda)', 'sla-site-venda', 96.0, '>= 96%', 'Gocase e Gobeaute', 'Lucas & Welis', 'percent', 1, 'gte', '%', 1, null),
    ('SLA Transportadora', 'sla-transportadora', 96.0, '>= 96%', 'Gocase e Gobeaute', 'Lucas & Welis', 'percent', 1, 'gte', '%', 2, null),
    ('SLA Cliente', 'sla-cliente', 93.0, '>= 93%', 'Gocase e Gobeaute', 'Lucas & Welis', 'percent', 1, 'gte', '%', 3, null),
    ('SLA B2C - Ápice', 'sla-b2c-apice', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 4, null),
    ('SLA B2C - Barbour''s', 'sla-b2c-barbours', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 5, null),
    ('SLA B2C - Lescent', 'sla-b2c-lescent', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 6, null),
    ('SLA B2C - Kokeshi', 'sla-b2c-kokeshi', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 7, null),
    ('SLA B2C - By Samia', 'sla-b2c-by-samia', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 8, null),
    ('SLA B2C - AUA', 'sla-b2c-aua', 96.0, '>= 96%', 'Gobeaute', 'Welis', 'percent', 1, 'gte', '%', 9, null),
    ('PMP Transporte - SP CAP', 'pmp-transporte-sp-cap', 2.0, '<= 2 dias', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'lte', 'dias', 10, null),
    ('PMP Transporte - SP (Estado)', 'pmp-transporte-sp-estado', 3.0, '<= 3 dias', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'lte', 'dias', 11, null),
    ('PMP Transporte - RJ', 'pmp-transporte-rj', null, 'Informativo', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'informational', 'dias', 12, null),
    ('PMP Transporte - MG', 'pmp-transporte-mg', null, 'Informativo', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'informational', 'dias', 13, null),
    ('PMP Transporte - CE', 'pmp-transporte-ce', null, 'Informativo', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'informational', 'dias', 14, null),
    ('Share Transportadora', 'share-transportadora', null, 'Informativo', 'Gocase e Gobeaute', 'Lucas & Welis', 'percent', 1, 'informational', '%', 15, null),
    ('Desvio de prazo (PMP x PMR)', 'desvio-prazo-pmp-pmr', 1.0, '> 1 dia', 'Gocase e Gobeaute', 'Lucas & Welis', 'days', 1, 'gte', 'dias', 16, null),
    ('Coletado x Processado - 0% não processado', 'coletado-processado-nao-processado', 0.0, '<= 0%', 'Gocase e Gobeaute', 'Lucas & Welis', 'percent', 1, 'lte', '%', 17, null),
    ('SLA B2B Transportadora', 'sla-b2b-transportadora', 96.0, '>= 96%', 'Gocase e Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 18, null),
    ('SLA B2B - Ápice', 'sla-b2b-apice', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 19, null),
    ('SLA B2B - Barbour''s', 'sla-b2b-barbours', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 20, null),
    ('SLA B2B - Lescent', 'sla-b2b-lescent', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 21, null),
    ('SLA B2B - Kokeshi', 'sla-b2b-kokeshi', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 22, null),
    ('SLA B2B - By Samia', 'sla-b2b-by-samia', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 23, null),
    ('SLA B2B - AUA', 'sla-b2b-aua', 96.0, '>= 96%', 'Gobeaute', 'Anderson e Monique', 'percent', 1, 'gte', '%', 24, null),
    ('Share Transportadora B2B', 'share-transportadora-b2b', null, 'Informativo', 'Gocase e Gobeaute', 'Anderson e Monique', 'percent', 1, 'informational', '%', 25, null),
    ('% Devolução', 'devolucao-percentual', 1.0, '<= 1%', 'Gocase e Gobeaute', 'Fablicia', 'percent', 1, 'lte', '%', 26, 'Percentual de Pedidos Fora do Prazo'),
    ('% Insucessos', 'insucessos-percentual', 1.0, '<= 1%', 'Gocase e Gobeaute', 'Fablicia', 'percent', 1, 'lte', '%', 27, 'Percentual de Pedidos Fora do Prazo'),
    ('% Reenvios - Gocase', 'reenvios-gocase-percentual', 1.2, '<= 1,2%', 'Gocase', 'Fablicia', 'percent', 1, 'lte', '%', 28, null),
    ('% Reenvios - Gobeaute', 'reenvios-gobeaute-percentual', 0.9, '<= 0,9%', 'Gobeaute', 'Fablicia', 'percent', 1, 'lte', '%', 29, null)
)
insert into public.kpis (
  name,
  slug,
  description,
  group_id,
  owner_label,
  product,
  format_kind,
  decimal_places,
  target_operator,
  target_value,
  target_label,
  unit_label,
  chart_type,
  active,
  position
)
select
  seeded_kpis.name,
  seeded_kpis.slug,
  seeded_kpis.description,
  principal_group.id,
  seeded_kpis.owner_label,
  seeded_kpis.product,
  seeded_kpis.format_kind,
  seeded_kpis.decimal_places,
  seeded_kpis.target_operator,
  seeded_kpis.target_value,
  seeded_kpis.target_label,
  seeded_kpis.unit_label,
  'line',
  true,
  seeded_kpis.position
from seeded_kpis
cross join principal_group
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  group_id = excluded.group_id,
  owner_label = excluded.owner_label,
  product = excluded.product,
  format_kind = excluded.format_kind,
  decimal_places = excluded.decimal_places,
  target_operator = excluded.target_operator,
  target_value = excluded.target_value,
  target_label = excluded.target_label,
  unit_label = excluded.unit_label,
  chart_type = excluded.chart_type,
  active = true,
  position = excluded.position;
