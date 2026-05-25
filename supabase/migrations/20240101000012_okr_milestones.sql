-- Sub-itens / marcos mensais dos KRs (substitui colunas Jan-Jun do XLSX)

create table public.okr_milestones (
  id            uuid        primary key default gen_random_uuid(),
  kr_id         uuid        not null references public.okr_key_results(id) on delete cascade,
  label         text        not null,
  target_value  numeric     not null default 1,
  current_value numeric     not null default 0,
  position      int         not null default 0,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.okr_milestones enable row level security;

create policy "Active users can read okr_milestones"
  on public.okr_milestones for select using (public.is_active_user());

create policy "Lead or admin can update okr_milestones"
  on public.okr_milestones for update
  using (public.is_lead_or_admin())
  with check (public.is_lead_or_admin());

create policy "Admins can manage okr_milestones"
  on public.okr_milestones for insert with check (public.is_admin());

create policy "Admins can delete okr_milestones"
  on public.okr_milestones for delete using (public.is_admin());

-- ─── Ajuste no grade_target do KR de IA (6 automações, não 10) ───────────────

update public.okr_key_results
set grade_target = 6
where code = 'KR1'
  and objective_id = (
    select id from public.okr_objectives where position = 5
  );

-- ─── Seed: marcos por KR ─────────────────────────────────────────────────────
-- Referencia KRs pelo código + posição do objetivo pai

with krs as (
  select kr.id, kr.code, obj.position as obj_pos
  from public.okr_key_results kr
  join public.okr_objectives obj on kr.objective_id = obj.id
)
insert into public.okr_milestones (kr_id, label, target_value, position)
select krs.id, m.label, m.target_value, m.position
from krs
join (values

  -- MacroOKR 1, KR2 — fases do plano de trabalho por cliente
  (1, 'KR2', 'Definir e validar o plano',  0.25, 1),
  (1, 'KR2', 'Concluir e executar o plano', 0.75, 2),

  -- MacroOKR 2, KR1 — melhora progressiva de SLA B2B
  (2, 'KR1', 'SLA B2B ≥ 75% (jan)', 1, 1),
  (2, 'KR1', 'SLA B2B ≥ 85% (fev)', 1, 2),
  (2, 'KR1', 'SLA B2B ≥ 90% (mar)', 1, 3),
  (2, 'KR1', 'SLA B2B ≥ 95% (abr)', 1, 4),

  -- MacroOKR 2, KR2 — redução acumulada de custo de frete B2B
  (2, 'KR2', 'Redução de 3% vs Dez/25 (jan)',  1, 1),
  (2, 'KR2', 'Redução de 6% vs Dez/25 (fev)',  1, 2),
  (2, 'KR2', 'Redução de 12% vs Dez/25 (mar)', 1, 3),
  (2, 'KR2', 'Redução de 15% vs Dez/25 (abr)', 1, 4),
  (2, 'KR2', 'Redução de 15% vs Dez/25 (mai)', 1, 5),
  (2, 'KR2', 'Redução de 15% vs Dez/25 (jun)', 1, 6),

  -- MacroOKR 2, KR3 — savings mensais do Bid B2C
  (2, 'KR3', 'Savings mar — R$50K',  1,  1),
  (2, 'KR3', 'Savings abr — R$50K',  1,  2),
  (2, 'KR3', 'Savings mai — R$80K',  1,  3),
  (2, 'KR3', 'Savings jun — R$100K', 1,  4),
  (2, 'KR3', 'Savings jul — R$100K', 1,  5),
  (2, 'KR3', 'Savings ago — R$120K', 1,  6),
  (2, 'KR3', 'Savings set — R$120K', 1,  7),
  (2, 'KR3', 'Savings out — R$120K', 1,  8),
  (2, 'KR3', 'Savings nov — R$150K', 1,  9),
  (2, 'KR3', 'Savings dez — R$110K', 1, 10),

  -- MacroOKR 5, KR1 — automações IA/RPA
  (5, 'KR1', 'Revisão de pedidos coletados no CD × processados no transportador',         1, 1),
  (5, 'KR1', 'Envio automático da base de dados ao transportador para validação de SLA',  1, 2),
  (5, 'KR1', 'Validação da emissão do CTE de entrega para 100% das notas coletadas',     1, 3),
  (5, 'KR1', 'Notificação automática de pedidos com risco de atraso (CX e Operações)',   1, 4),
  (5, 'KR1', 'Conciliação de custo de reenvio/reembolso × ressarcimento do transportador', 1, 5),
  (5, 'KR1', 'Validação da ocorrência do transportador × Intelipost',                    1, 6)

) as m(obj_pos, kr_code, label, target_value, position)
on krs.obj_pos = m.obj_pos and krs.code = m.kr_code;
