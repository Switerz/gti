-- =============================================================================
-- GTI — Demo seed data (run in Supabase SQL Editor)
-- Populates tasks, comments, and checklist items for visual review.
-- Requires at least one profile in the `profiles` table (sign in first).
-- =============================================================================

DO $$
DECLARE
  v_user      uuid;
  -- statuses
  s_backlog   uuid; s_todo uuid; s_progress uuid;
  s_backlog   uuid; s_todo uuid; s_progress uuid;
  s_blocked   uuid; s_review uuid; s_done uuid;
  -- categories
  c_prazo     uuid; c_coletado uuid; c_contestacao uuid;
  c_fat       uuid; c_bi       uuid; c_op         uuid;
  c_tech      uuid; c_transp   uuid;
  -- projects
  p_rollout   uuid; p_gc uuid; p_gb uuid;
  p_sim       uuid; p_auto uuid; p_bi uuid; p_mon uuid;
  -- task holders
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid;
  t6 uuid; t7 uuid; t8 uuid; t9 uuid; t10 uuid;
  t11 uuid; t12 uuid; t13 uuid; t14 uuid; t15 uuid;
  t16 uuid; t17 uuid; t18 uuid; t19 uuid; t20 uuid;
  t21 uuid; t22 uuid; t23 uuid; t24 uuid; t25 uuid;
  t26 uuid; t27 uuid; t28 uuid;
BEGIN
  -- ── Resolve user (first active profile found) ─────────────────────────────
  SELECT id INTO v_user FROM public.profiles WHERE active = true ORDER BY created_at LIMIT 1;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No active profile found. Sign in to the app first, then run this script.';
  END IF;

  -- ── Statuses ──────────────────────────────────────────────────────────────
  SELECT id INTO s_backlog  FROM public.task_statuses WHERE slug = 'backlog';
  SELECT id INTO s_todo     FROM public.task_statuses WHERE slug = 'todo';
  SELECT id INTO s_progress FROM public.task_statuses WHERE slug = 'in_progress';
  SELECT id INTO s_blocked  FROM public.task_statuses WHERE slug = 'blocked';
  SELECT id INTO s_review   FROM public.task_statuses WHERE slug = 'review';
  SELECT id INTO s_done     FROM public.task_statuses WHERE slug = 'done';

  -- ── Categories ────────────────────────────────────────────────────────────
  SELECT id INTO c_prazo       FROM public.categories WHERE slug = 'prazo-otimizado';
  SELECT id INTO c_coletado    FROM public.categories WHERE slug = 'coletado-processado';
  SELECT id INTO c_contestacao FROM public.categories WHERE slug = 'contestacao-faturas';
  SELECT id INTO c_fat         FROM public.categories WHERE slug = 'faturamento-tiny';
  SELECT id INTO c_bi          FROM public.categories WHERE slug = 'bi-relatorios';
  SELECT id INTO c_op          FROM public.categories WHERE slug = 'operacao-transportes';
  SELECT id INTO c_tech        FROM public.categories WHERE slug = 'integracoes-tech';
  SELECT id INTO c_transp      FROM public.categories WHERE slug = 'transportadoras';

  -- ── Projects ──────────────────────────────────────────────────────────────
  SELECT id INTO p_rollout FROM public.projects WHERE name = 'Prazo Otimizado — Rollout Ceará';
  SELECT id INTO p_gc      FROM public.projects WHERE name = 'Coletado x Processado — Gocase';
  SELECT id INTO p_gb      FROM public.projects WHERE name = 'Coletado x Processado — Gobeaute';
  SELECT id INTO p_sim     FROM public.projects WHERE name = 'Simulador de Contestação';
  SELECT id INTO p_auto    FROM public.projects WHERE name = 'Automação de Faturamento';
  SELECT id INTO p_bi      FROM public.projects WHERE name = 'Rotinas Semanais de BI';
  SELECT id INTO p_mon     FROM public.projects WHERE name = 'Monitoramento de Transportadoras';

  -- ============================================================================
  -- TASKS — Backlog (3)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Mapear transportadoras com cobertura no Nordeste',
    'Levantar lista completa de transportadoras parceiras com operação ativa no Ceará e Rio Grande do Norte. Incluir tabela de frete e prazo médio por CEP.',
    s_backlog, c_prazo, p_rollout, v_user, v_user, 'medium', '2026-06-01', '2026-06-30', 10
  ) RETURNING id INTO t1;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Definir critérios de aceitação para contestações automáticas',
    'Documentar as regras de negócio que determinam quando uma divergência de cobrança pode ser contestada automaticamente sem revisão manual.',
    s_backlog, c_contestacao, p_sim, v_user, v_user, 'low', '2026-07-15', 20
  ) RETURNING id INTO t2;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Especificar endpoint de callback para webhooks Tiny',
    'Definir contrato da API de callback que receberá notificações de eventos do Tiny ERP (pedido criado, NF emitida, status de entrega).',
    s_backlog, c_fat, p_auto, v_user, v_user, 'medium', '2026-06-20', 30
  ) RETURNING id INTO t3;

  -- ============================================================================
  -- TASKS — A Fazer (5)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Criar dashboard de prazo por transportadora no Power BI',
    'Desenvolver dashboard com % de entregas no prazo, SLA médio e tendência semanal, segmentado por transportadora e estado de destino.',
    s_todo, c_bi, p_bi, v_user, v_user, 'high', '2026-05-12', '2026-05-30', 10
  ) RETURNING id INTO t4;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Configurar alertas de volume anômalo no pipeline de coletado',
    'Implementar regra de alerta quando a diferença entre coletado e processado ultrapassar 5% em qualquer transportadora por período de 24h.',
    s_todo, c_coletado, p_gc, v_user, v_user, 'high', '2026-05-22', 20
  ) RETURNING id INTO t5;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Revisar mapeamento de CEPs para transportadora Jadlog',
    'Validar cobertura de atendimento da Jadlog nos CEPs de destino prioritários. Atualizar tabela de roteamento no sistema.',
    s_todo, c_transp, p_mon, v_user, v_user, 'medium', '2026-05-28', 30
  ) RETURNING id INTO t6;

  INSERT INTO public.tasks (title, status_id, category_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Atualizar credenciais de acesso à API dos Correios',
    s_todo, c_tech, v_user, v_user, 'urgent', '2026-05-16', 40
  ) RETURNING id INTO t7;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, position)
  VALUES (
    'Documentar processo de conciliação mensal de faturas',
    'Escrever SOP do processo de conciliação: coleta de boletos, validação de descontos, lançamento no financeiro e prazo de pagamento.',
    s_todo, c_contestacao, v_user, v_user, 'low', 50
  ) RETURNING id INTO t8;

  -- ============================================================================
  -- TASKS — Em andamento (6)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Implementar rota de rollout CE para Prazo Otimizado',
    'Desenvolver a lógica de seleção automática de transportadora para pedidos com destino ao Ceará, priorizando prazo sobre custo quando SLA < 48h.',
    s_progress, c_prazo, p_rollout, v_user, v_user, 'high', '2026-05-05', '2026-05-24', 10
  ) RETURNING id INTO t9;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Conciliar divergências de coletado vs. processado — semana 19',
    'Analisar e regularizar as 47 ocorrências de divergência identificadas na semana 19 entre volumes coletados pela transportadora e processados no WMS.',
    s_progress, c_coletado, p_gc, v_user, v_user, 'urgent', '2026-05-13', '2026-05-16', 20
  ) RETURNING id INTO t10;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Integrar Tiny ERP com módulo de faturamento de frete',
    'Configurar integração via API REST entre Tiny ERP e o módulo interno de cálculo de frete. Mapear campos de NF-e para tabela de fretes.',
    s_progress, c_fat, p_auto, v_user, v_user, 'high', '2026-05-01', '2026-05-30', 30
  ) RETURNING id INTO t11;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Produzir relatório semanal de SLA — semana 20',
    'Compilar dados de desempenho das 8 transportadoras ativas. Incluir % no prazo, taxa de avaria e NPS de entrega.',
    s_progress, c_bi, p_bi, v_user, v_user, 'medium', '2026-05-14', '2026-05-17', 40
  ) RETURNING id INTO t12;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Monitorar SLA da Correios no período pós-Dia das Mães',
    'Acompanhar métricas de prazo dos Correios nos 10 dias após o Dia das Mães. Registrar atrasos acima de 2 dias e abrir contestações quando aplicável.',
    s_progress, c_transp, p_mon, v_user, v_user, 'high', '2026-05-12', '2026-05-22', 50
  ) RETURNING id INTO t13;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Levantar volume de contestações pendentes — maio/2026',
    'Coletar e consolidar todas as contestações de fatura abertas em maio/2026, classificar por transportadora e valor em disputa.',
    s_progress, c_contestacao, v_user, v_user, 'medium', '2026-05-10', '2026-05-20', 60
  ) RETURNING id INTO t14;

  -- ============================================================================
  -- TASKS — Bloqueado (3)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Subir novo modelo de cálculo de frete para produção',
    'Deploy está aguardando aprovação da equipe de infra. Ticket aberto há 5 dias sem resposta. Escalar para gerência de TI.',
    s_blocked, c_tech, p_auto, v_user, v_user, 'urgent', '2026-05-15', 10
  ) RETURNING id INTO t15;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Solicitar tabela de frete atualizada — Sequoia',
    'Transportadora Sequoia não enviou tabela vigente de maio/2026. Sem tabela atualizada, não é possível calcular frete corretamente.',
    s_blocked, c_transp, p_mon, v_user, v_user, 'high', '2026-05-18', 20
  ) RETURNING id INTO t16;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Regularizar acesso ao portal da transportadora TNT',
    'Credenciais de acesso ao portal TNT expiraram em 30/04. Aguardando reset de senha pelo suporte da transportadora.',
    s_blocked, c_transp, v_user, v_user, 'high', '2026-05-14', 30
  ) RETURNING id INTO t17;

  -- ============================================================================
  -- TASKS — Em validação (4)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Validar cálculo de divergências do simulador de contestação',
    'Verificar se as fórmulas de cálculo de divergência cobrem todos os cenários: frete reverso, reentrega, peso cubado vs. real.',
    s_review, c_contestacao, p_sim, v_user, v_user, 'high', '2026-05-08', '2026-05-17', 10
  ) RETURNING id INTO t18;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, start_date, due_date, position)
  VALUES (
    'Testar integração do pipeline de coletado — ambiente staging',
    'Executar bateria de testes no ambiente de staging com dados reais de abril/2026. Validar reconciliação automática e logs de erro.',
    s_review, c_coletado, p_gb, v_user, v_user, 'medium', '2026-05-12', '2026-05-19', 20
  ) RETURNING id INTO t19;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Revisar layout do dashboard de SLA com a área de operações',
    'Apresentar protótipo do dashboard para equipe de operações e coletar feedback antes da publicação final.',
    s_review, c_bi, p_bi, v_user, v_user, 'medium', '2026-05-20', 30
  ) RETURNING id INTO t20;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, due_date, position)
  VALUES (
    'Homologar script de conciliação automática de NF-e',
    'Validar script Python que faz conciliação automática entre NF-e emitidas e boletos pagos. Testar com base de março e abril/2026.',
    s_review, c_fat, v_user, v_user, 'high', '2026-05-19', 40
  ) RETURNING id INTO t21;

  -- ============================================================================
  -- TASKS — Concluído (8)
  -- ============================================================================
  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Configurar pipeline de ingestão de dados da Jadlog',
    'Implementar pipeline ETL para ingestão diária dos logs de entrega da Jadlog via SFTP.',
    s_done, c_tech, p_mon, v_user, v_user, 'high', '2026-05-02', now() - interval '10 days', 10
  ) RETURNING id INTO t22;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Negociar novo contrato com LATAM Cargo para rotas Sul',
    'Renegociar tabela de frete para destinos RS, SC e PR. Obtido desconto de 8% para volumes acima de 500 volumes/mês.',
    s_done, c_transp, p_mon, v_user, v_user, 'medium', '2026-04-30', now() - interval '14 days', 20
  ) RETURNING id INTO t23;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Criar relatório de custo de frete por canal — abril/2026',
    'Consolidar custo total de frete por canal de venda (marketplace, e-commerce próprio, B2B) referente a abril/2026.',
    s_done, c_bi, v_user, v_user, 'medium', '2026-05-05', now() - interval '9 days', 30
  ) RETURNING id INTO t24;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Mapear campos de NF-e para faturamento Tiny',
    'Levantamento completo dos campos da NF-e (SEFAZ) que precisam ser mapeados para os campos de pedido do Tiny ERP.',
    s_done, c_fat, p_auto, v_user, v_user, 'high', '2026-04-25', now() - interval '18 days', 40
  ) RETURNING id INTO t25;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Conciliar divergências de coletado vs. processado — semana 17',
    'Regularizadas 23 ocorrências de divergência da semana 17. 19 casos resolvidos por correção no WMS, 4 por reprocessamento manual.',
    s_done, c_coletado, p_gc, v_user, v_user, 'high', '2026-05-02', now() - interval '12 days', 50
  ) RETURNING id INTO t26;

  INSERT INTO public.tasks (title, description, status_id, category_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Atualizar allowlist de e-mails no sistema GTI',
    'Adicionar novos colaboradores à allowlist de acesso ao sistema de gestão de tarefas de transportes.',
    s_done, c_op, v_user, v_user, 'low', '2026-05-01', now() - interval '13 days', 60
  ) RETURNING id INTO t27;

  INSERT INTO public.tasks (title, description, status_id, category_id, project_id, creator_id, owner_id, priority, due_date, completed_at, position)
  VALUES (
    'Levantar requisitos do rollout CE junto à equipe comercial',
    'Reunião realizada com equipe comercial em 28/04. Levantados 12 requisitos funcionais e 3 regras de negócio específicas para o Nordeste.',
    s_done, c_prazo, p_rollout, v_user, v_user, 'medium', '2026-04-30', now() - interval '15 days', 70
  ) RETURNING id INTO t28;

  -- ============================================================================
  -- ASSIGNEES — link owner to all tasks
  -- ============================================================================
  INSERT INTO public.task_assignees (task_id, profile_id, assigned_by)
  SELECT unnest(ARRAY[t1,t2,t3,t4,t5,t6,t7,t8,t9,t10,t11,t12,t13,t14,
                      t15,t16,t17,t18,t19,t20,t21,t22,t23,t24,t25,t26,t27,t28]),
         v_user, v_user
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- CHECKLIST ITEMS
  -- ============================================================================
  -- t9 — Implementar rota de rollout CE
  INSERT INTO public.task_checklist_items (task_id, title, is_done, position) VALUES
    (t9, 'Mapear CEPs ativos no Ceará',              true,  1),
    (t9, 'Configurar regras de roteamento no sistema', true, 2),
    (t9, 'Testar com pedidos simulados',               false, 3),
    (t9, 'Validar com equipe de operações',            false, 4),
    (t9, 'Deploy em produção',                         false, 5);

  -- t11 — Integrar Tiny ERP
  INSERT INTO public.task_checklist_items (task_id, title, is_done, position) VALUES
    (t11, 'Criar credenciais de API no Tiny',          true,  1),
    (t11, 'Implementar autenticação OAuth',             true,  2),
    (t11, 'Mapear campos de NF-e → frete',             true,  3),
    (t11, 'Criar job de sincronização a cada 15min',   false, 4),
    (t11, 'Testar em staging',                         false, 5),
    (t11, 'Documentar endpoints',                      false, 6);

  -- t18 — Validar cálculo simulador
  INSERT INTO public.task_checklist_items (task_id, title, is_done, position) VALUES
    (t18, 'Cobrir frete reverso',      true,  1),
    (t18, 'Cobrir reentrega',          true,  2),
    (t18, 'Cobrir peso cubado vs real',false, 3),
    (t18, 'Cobrir avaria parcial',     false, 4);

  -- t22 — Pipeline Jadlog (concluída)
  INSERT INTO public.task_checklist_items (task_id, title, is_done, position) VALUES
    (t22, 'Configurar SFTP',              true, 1),
    (t22, 'Parsear formato de arquivo',   true, 2),
    (t22, 'Criar tabela de destino',      true, 3),
    (t22, 'Agendar job diário',           true, 4),
    (t22, 'Validar com dados reais',      true, 5);

  -- ============================================================================
  -- COMMENTS
  -- ============================================================================
  INSERT INTO public.task_comments (task_id, author_id, body) VALUES
    (t10, v_user, 'Já regularizei 31 das 47 ocorrências. As 16 restantes precisam de validação manual com a Jadlog — aguardando retorno deles.'),
    (t10, v_user, 'Jadlog confirmou que 8 volumes foram retidos em triagem por suspeita de avaria. Estão sendo investigados. Previsão de resolução: amanhã.'),
    (t15, v_user, 'Escalado para o Rodrigo (TI). Ele disse que o ticket estava na fila errada — moveu para o backlog de infra e prometeu resolver até sexta.'),
    (t15, v_user, 'Update: aprovação obtida! Deploy agendado para hoje às 22h (janela de manutenção). Monitorar logs após a virada.'),
    (t9,  v_user, 'Fiz o mapeamento de 847 CEPs no CE. Encontrei 23 CEPs sem cobertura por nenhuma transportadora parceira — abri tarefa separada para tratar.'),
    (t13, v_user, 'Semana 1 pós-Dia das Mães: 94,2% das entregas dos Correios dentro do prazo. Acima da meta (92%). Registrados 3 atrasos > 2 dias — contestações abertas.'),
    (t18, v_user, 'Revisei os cenários de frete reverso e reentrega — ambos calculando corretamente. Só faltam os cenários de peso cubado, trabalho nisso amanhã.'),
    (t5,  v_user, 'Defini o threshold: qualquer diferença > 3% em 6h ou > 5% em 24h dispara alerta. Revisando com a equipe amanhã antes de implementar.'),
    (t25, v_user, 'Mapeamento concluído! 34 campos no total. Documentado na confluence. Link para revisão: [ver doc interno]'),
    (t22, v_user, 'Pipeline rodando há 3 dias sem erro. Dados chegando às 6h da manhã conforme configurado. Pode fechar.');

  -- ============================================================================
  -- ACTIVITY LOGS (task_created for all tasks)
  -- ============================================================================
  INSERT INTO public.task_activity_logs (task_id, actor_id, action, metadata)
  SELECT id, v_user, 'task_created', jsonb_build_object('title', title)
  FROM public.tasks
  WHERE creator_id = v_user
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Demo seed concluído com sucesso! 28 tarefas criadas para o perfil %.', v_user;
END $$;
