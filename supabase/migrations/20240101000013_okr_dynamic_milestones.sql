-- KRs com milestones dinâmicos: lista livre gerenciada por lead/admin
-- Caso de uso inicial: KR de IA/RPA — projetos com savings em R$

alter table public.okr_key_results
  add column if not exists dynamic_milestones boolean not null default false;

-- KR1 do MacroOKR 5 (IA): dinâmico, meta = R$20.000 em ganhos
update public.okr_key_results
set
  dynamic_milestones = true,
  grade_target       = 20000
where code = 'KR1'
  and objective_id = (
    select id from public.okr_objectives where position = 5
  );

-- Remove os 6 marcos fixos do seed anterior (KR agora é dinâmico)
delete from public.okr_milestones
where kr_id = (
  select kr.id
  from public.okr_key_results kr
  join public.okr_objectives obj on kr.objective_id = obj.id
  where kr.code = 'KR1' and obj.position = 5
);

-- Permite lead ou admin inserir milestones (antes só admin)
drop policy if exists "Admins can manage okr_milestones" on public.okr_milestones;

create policy "Lead or admin can insert okr_milestones"
  on public.okr_milestones for insert
  with check (public.is_lead_or_admin());

create policy "Lead or admin can delete okr_milestones"
  on public.okr_milestones for delete
  using (public.is_lead_or_admin());
