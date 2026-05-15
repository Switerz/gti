-- Migration 003: Seed data for task statuses, categories, and projects

-- Task statuses (Kanban columns)
insert into public.task_statuses (name, slug, position, color, is_final) values
  ('Backlog',        'backlog',      1, '#94a3b8', false),
  ('A Fazer',        'todo',         2, '#3b82f6', false),
  ('Em andamento',   'in_progress',  3, '#f59e0b', false),
  ('Bloqueado',      'blocked',      4, '#ef4444', false),
  ('Em validação',   'review',       5, '#8b5cf6', false),
  ('Concluído',      'done',         6, '#10b981', true),
  ('Arquivado',      'archived',     7, '#6b7280', true)
on conflict (slug) do update
set
  name = excluded.name,
  position = excluded.position,
  color = excluded.color,
  is_final = excluded.is_final;

-- Categories (Transport team work areas)
insert into public.categories (name, slug, color) values
  ('Prazo Otimizado',        'prazo-otimizado',     '#3b82f6'),
  ('Coletado x Processado',  'coletado-processado', '#10b981'),
  ('Contestação de Faturas', 'contestacao-faturas', '#f59e0b'),
  ('Faturamento / Tiny',     'faturamento-tiny',    '#8b5cf6'),
  ('BI e Relatórios',        'bi-relatorios',       '#06b6d4'),
  ('Operação Transportes',   'operacao-transportes','#f97316'),
  ('Integrações / Tech',     'integracoes-tech',    '#ec4899'),
  ('Transportadoras',        'transportadoras',     '#6366f1'),
  ('Gocase',                 'gocase',              '#14b8a6'),
  ('Gobeaute',               'gobeaute',            '#f43f5e'),
  ('Growth / Conversão',     'growth-conversao',    '#a855f7'),
  ('Outros',                 'outros',              '#6b7280')
on conflict (slug) do update
set
  name = excluded.name,
  color = excluded.color,
  active = true;

-- Projects (seeded without created_by since no users exist at migration time)
-- created_by is nullable — update these after first admin user is created
with seeded_projects (name, description, category_slug) as (
  values
    (
      'Prazo Otimizado — Rollout Ceará',
      'Expansão do projeto Prazo Otimizado para o estado do Ceará.',
      'prazo-otimizado'
    ),
    (
      'Coletado x Processado — Gocase',
      'Reconciliação de volumes coletados vs. processados para a Gocase.',
      'coletado-processado'
    ),
    (
      'Coletado x Processado — Gobeaute',
      'Reconciliação de volumes coletados vs. processados para a Gobeaute.',
      'coletado-processado'
    ),
    (
      'Simulador de Contestação',
      'Ferramenta de simulação e análise de contestações de faturas.',
      'contestacao-faturas'
    ),
    (
      'Automação de Faturamento',
      'Automação do processo de faturamento via integração com Tiny.',
      'faturamento-tiny'
    ),
    (
      'Rotinas Semanais de BI',
      'Relatórios e dashboards semanais de BI para a área de Transportes.',
      'bi-relatorios'
    ),
    (
      'Monitoramento de Transportadoras',
      'Acompanhamento de SLA, qualidade e desempenho das transportadoras.',
      'transportadoras'
    )
)
insert into public.projects (name, description, category_id)
select seeded_projects.name, seeded_projects.description, categories.id
from seeded_projects
join public.categories on categories.slug = seeded_projects.category_slug
where not exists (
  select 1
  from public.projects
  where projects.name = seeded_projects.name
);
