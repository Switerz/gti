-- OKR tables — substitui o acompanhamento via XLSX (1S26 Transportes)

create table public.okr_objectives (
  id          uuid        primary key default gen_random_uuid(),
  macro_title text        not null,
  description text,
  semester    text        not null default '1S26',
  position    int         not null default 0,
  created_at  timestamptz not null default now()
);

create table public.okr_key_results (
  id            uuid        primary key default gen_random_uuid(),
  objective_id  uuid        not null references public.okr_objectives(id) on delete cascade,
  code          text        not null,
  title         text        not null,
  owner         text,
  updater       text,
  data_source   text,
  grade_min     numeric     not null default 0,
  grade_target  numeric     not null default 1,
  current_value numeric     not null default 0,
  notes         text,
  position      int         not null default 0,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.okr_objectives  enable row level security;
alter table public.okr_key_results enable row level security;

-- Todos os usuários ativos podem visualizar
create policy "Active users can read okr_objectives"
  on public.okr_objectives for select using (public.is_active_user());

create policy "Active users can read okr_key_results"
  on public.okr_key_results for select using (public.is_active_user());

-- Lead ou admin podem atualizar valores dos KRs
create policy "Lead or admin can update okr_key_results"
  on public.okr_key_results for update
  using (public.is_lead_or_admin())
  with check (public.is_lead_or_admin());

-- Admin gerencia estrutura (criar/excluir objetivos e KRs)
create policy "Admins can manage okr_objectives"
  on public.okr_objectives for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can insert okr_key_results"
  on public.okr_key_results for insert with check (public.is_admin());

create policy "Admins can delete okr_key_results"
  on public.okr_key_results for delete using (public.is_admin());

-- ─── Seed: OKRs 1S26 — Transportes ──────────────────────────────────────────

with obj as (
  insert into public.okr_objectives (macro_title, description, position) values
    (
      'Crescimento sustentável e equilibrado do grupo',
      'Garantir visão integrada, decisões padronizadas e atuação personalizada para cada marca',
      1
    ),
    (
      'Eficiência de Custos & Execução de Alta Performance',
      'Governança na contratação de fretes B2B e redução de custos no transportes geral',
      2
    ),
    (
      'Governança Corporativa Forte',
      'Padronização contratual e estruturação da logística reversa',
      3
    ),
    (
      'Acelerar o crescimento de vendas do grupo',
      'Ter um prazo mais competitivo e opções de entrega expressa para alavancar vendas',
      4
    ),
    (
      'IA como motor de produtividade e decisão',
      'Revisão de rotinas de transporte para automação de atividades manuais',
      5
    )
  returning id, position
)
insert into public.okr_key_results
  (objective_id, code, title, owner, updater, data_source, grade_min, grade_target, position)
select
  obj.id,
  kr.code,
  kr.title,
  kr.owner,
  kr.updater,
  kr.data_source,
  kr.grade_min,
  kr.grade_target,
  kr.position
from obj
join (values
  -- MacroOKR 1
  (1, 'KR1', 'Manter a taxa de reenvio abaixo de 1,2% (Gocase) e 0,9% (Gobeaute) no acumulado do 1S26',
   'Kelly Sousa', null, null, 0.9, 1.0, 1),
  (1, 'KR2', 'Definir, aprovar com diretoria até final de fevereiro e executar um plano de trabalho por cliente interno (Gocase & Gobeaute) até junho/26',
   'João Conde', 'João Conde', null, 0.0, 1.0, 2),
  (1, 'KR3', 'Padronizar indicadores, metas e rituais de gestão de transportes para todas as marcas até março/26',
   'João Conde', 'João Conde', 'BI - Oficiais + Resultado de SLA / Custo e Prazo aderentes à estratégia da marca', 0.0, 1.0, 3),
  -- MacroOKR 2
  (2, 'KR1', 'Estruturar e documentar 100% do processo B2B GB (cotação → contratação → coleta → entrega) com garantia de SLA B2B de 95% (atual 70%)',
   'Talita Oliveira', 'Talita', 'Estruturação de BI + documentação com fluxo e processos', 0.0, 4.0, 1),
  (2, 'KR2', 'Reduzir o custo médio de frete B2B em até 15% vs. frete Kg Dez/25',
   'Talita Oliveira', 'Talita', 'Custo frete p/KG (fechamento mensal)', 0.0, 6.0, 2),
  (2, 'KR3', 'Realizar Bid de 100% do B2C até março/26 (mínimo 4 transportadoras) trazendo oportunidades de redução de custo ou ganho de eficiência. Meta: redução de R$1MM no frete anual Gocase',
   'João Conde', 'João', 'Tabelas dos participantes + análise de resultado + Integração', 0.0, 10.0, 3),
  -- MacroOKR 3
  (3, 'KR1', 'Garantir que 100% dos transportadores tenham contratos validados e assinados até junho/26 (10 B2C e 18 B2B)',
   'João Conde', 'João', 'Contratos assinados e validados junto ao jurídico', 0.0, 1.0, 1),
  (3, 'KR2', 'Estruturar o processo de logística reversa/devolução (lógica, prazo, cobrança) end-to-end até julho/26. Taxa atual de devolução Gogroup: 0,33%. Meta: 0,20%',
   'Kelly Sousa', 'Kelly', 'BI + documentação com fluxo e processos. Taxa de % de devolução mensal', 0.0, 1.0, 2),
  -- MacroOKR 4
  (4, 'KR1', 'Reduzir prazo de entrega prometido em 1 dia para todo o Brasil até junho/26 na Gocase (vinculado ao OKR de Tecnologia: Frete Inteligente)',
   'João Conde', 'João', 'MetaBase — Indicador BI PMO/PMP', 0.0, 1.0, 1),
  (4, 'KR2', 'Reduzir prazo de entrega prometido em 1 dia para todo o Brasil até julho/26 na Gobeaute (vinculado ao OKR de Tecnologia: Frete Inteligente)',
   'João Conde', 'João', 'MetaBase — Indicador BI PMO/PMP', 0.0, 1.0, 2),
  -- MacroOKR 5
  (5, 'KR1', 'Desenvolver automações para eliminar atividades manuais e absorver o crescimento anual sem aumento de quadro para essas atividades',
   'João Conde', 'João', 'Matricular os temas no controle oficial de IA e RPA', 0.0, 10.0, 1),
  (5, 'KR2', 'Inventariar e documentar 100% dos agentes/automações IA/RPA (passado + presente) da área até abril/26 na plataforma oficial',
   'João Conde', 'João', 'Matricular os temas no controle oficial de IA e RPA', 0.0, 1.0, 2)
) as kr(obj_pos, code, title, owner, updater, data_source, grade_min, grade_target, position)
on obj.position = kr.obj_pos;
