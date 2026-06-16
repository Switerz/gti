# MCP GTI - Plano de Sprints

Este documento serve como referencia rapida para a criacao de um MCP do GTI, permitindo que assistentes como Codex e Claude leiam o contexto do sistema, consultem tarefas e executem acoes controladas como criar tarefas, alterar status, adicionar comentarios e gerenciar checklists.

## Objetivo Geral

Criar um MCP de dominio para o GTI, focado nas operacoes reais do sistema:

- Consultar tarefas, projetos, categorias, status e perfis.
- Ler detalhes completos de uma tarefa, incluindo checklist, comentarios e atividade.
- Criar e atualizar tarefas respeitando permissoes.
- Adicionar comentarios e itens de checklist.
- Expor contexto estavel do site para que agentes entendam regras, rotas e fluxo de trabalho.
- Manter credenciais, permissoes e acoes sensiveis sob controle.

## Principios

- O MCP deve falar a linguagem do GTI, nao apenas expor tabelas do banco.
- Ferramentas devem ser pequenas, tipadas e com parametros claros.
- Acoes destrutivas devem ficar fora do MVP ou exigir confirmacao humana.
- O MCP deve respeitar RLS e permissoes existentes sempre que possivel.
- Credenciais devem vir de variaveis de ambiente, nunca de tokens versionados.
- Toda acao de escrita deve deixar rastro em logs ou activity logs quando aplicavel.

## Sprint MCP 0 - Auditoria, Seguranca e Escopo

Status: concluida localmente

Objetivo: entender o estado atual e remover riscos antes de ampliar automacoes.

Entregas:
- Revisar `.mcp.json` atual.
- Remover tokens hardcoded e mover credenciais para variaveis de ambiente.
- Rotacionar qualquer token exposto em arquivo local/versionado.
- Mapear quais operacoes usam RLS diretamente e quais dependem de RPC.
- Confirmar usuario/perfil que o MCP deve representar.
- Definir lista inicial de ferramentas permitidas e proibidas.
- Criar checklist de seguranca do MCP.

Resultado:
- `.mcp.json` local sanitizado para usar `SUPABASE_ACCESS_TOKEN`.
- Criado `.mcp.example.json` sem segredos.
- Criado `docs/mcp-security.md` com auditoria, permissoes, proibicoes e checklist.
- `.mcp.json` e `.env` confirmados como nao rastreados no Git.
- Rotacao do token exposto registrada como acao obrigatoria fora do repositorio.

Fora de escopo:
- Usar `service_role` como credencial padrao.
- Criar, editar ou excluir usuarios.
- Arquivar ou deletar tarefas em massa.

## Sprint MCP 1 - Estrutura Base do Servidor

Status: concluida localmente

Objetivo: criar o esqueleto do MCP dentro do projeto.

Entregas:
- Criar pasta `mcp/`.
- Configurar servidor MCP em Node/TypeScript.
- Adicionar scripts de build/start no `package.json`.
- Configurar leitura de ambiente:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - token/sessao do usuario MCP, se necessario
- Criar cliente Supabase compartilhado.
- Criar validacao de inputs com Zod.
- Criar ferramenta simples `gti_healthcheck`.
- Documentar instalacao local em `mcp/README.md`.

Validacao:
- Rodar build TypeScript.
- Executar servidor MCP localmente.
- Testar `gti_healthcheck` em cliente MCP.

Resultado:
- Criada pasta `mcp/`.
- Criado servidor MCP stdio em TypeScript.
- Criada configuracao separada `tsconfig.mcp.json`.
- Adicionados scripts `mcp:build` e `mcp:start`.
- Adicionado cliente Supabase compartilhado para futuras ferramentas.
- Criada ferramenta `gti_healthcheck`.
- Criado `mcp/README.md`.

## Sprint MCP 2 - Contexto do Site e Recursos de Leitura

Status: concluida localmente

Objetivo: permitir que agentes entendam o GTI antes de agir.

Entregas:
- Criar `docs/agent-context.md` com:
  - visao geral do GTI
  - regras de tarefas
  - prioridades
  - status do kanban
  - projetos e categorias
  - permissoes esperadas
  - rotas principais do app
- Expor recurso MCP `gti://context/site`.
- Expor recurso MCP `gti://context/tasks`.
- Criar ferramenta `gti_get_site_context`.
- Criar ferramenta `gti_list_task_statuses`.
- Criar ferramenta `gti_list_categories`.
- Criar ferramenta `gti_list_projects`.

Validacao:
- Confirmar que Codex/Claude conseguem carregar contexto sem acessar arquivos internos aleatorios.
- Conferir se o contexto nao contem segredos, emails pessoais sensiveis ou tokens.

Resultado:
- Criado `docs/agent-context.md`.
- Expostos recursos `gti://context/site` e `gti://context/tasks`.
- Criada ferramenta `gti_get_site_context`.
- Criadas ferramentas `gti_list_task_statuses`, `gti_list_categories` e `gti_list_projects`.
- Configuracao MCP passou a carregar `.env` local sem imprimir valores.
- Leituras Supabase exigem `GTI_MCP_USER_ACCESS_TOKEN` para respeitar RLS baseada em `auth.uid()`.

## Sprint MCP 3 - Ferramentas de Consulta de Tarefas

Status: concluida localmente

Objetivo: permitir leitura operacional das tarefas.

Entregas:
- Criar ferramenta `gti_list_tasks`.
- Criar ferramenta `gti_search_tasks`.
- Criar ferramenta `gti_get_task`.
- Incluir relacionamentos principais:
  - status
  - categoria
  - projeto
  - criador
  - responsavel
  - assignees
  - contagem/progresso de checklist
  - comentarios recentes
  - activity log recente
- Adicionar filtros:
  - status
  - categoria
  - projeto
  - prioridade
  - responsavel
  - texto
  - arquivadas ou nao
- Definir limites padrao para evitar respostas gigantes.

Validacao:
- Comparar resultados com telas de lista, quadro e detalhe.
- Testar usuario sem permissao administrativa.
- Garantir que tarefas arquivadas nao aparecam por padrao.

Resultado:
- Criada ferramenta `gti_list_tasks`.
- Criada ferramenta `gti_search_tasks`.
- Criada ferramenta `gti_get_task`.
- Listas retornam resumo com status, categoria, projeto, criador, responsavel, assignees, contagem de comentarios e progresso de checklist.
- Detalhe retorna checklist ordenado, comentarios recentes e activity log recente.
- Filtros e limites padrao adicionados para evitar respostas grandes.
- Tarefas arquivadas ficam ocultas por padrao.

## Sprint MCP 4 - Criacao e Atualizacao Controlada de Tarefas

Status: concluida localmente

Objetivo: permitir que agentes criem e alterem tarefas com seguranca.

Entregas:
- Criar ferramenta `gti_create_task`.
- Reutilizar RPC `create_task_with_assignees` quando aplicavel.
- Criar ferramenta `gti_update_task`.
- Criar ferramenta `gti_move_task_status`.
- Validar campos obrigatorios:
  - titulo
  - status
  - prioridade
  - owner/responsavel quando aplicavel
- Validar campos opcionais:
  - descricao
  - categoria
  - projeto
  - prazo
  - data de inicio
  - recorrencia
  - horas estimadas/reais
  - assignees
- Registrar activity logs de alteracoes.

Controles:
- Nao permitir deletar tarefa nesta sprint.
- Nao permitir arquivar tarefa sem confirmacao humana.
- Retornar resumo claro do que foi alterado.

Validacao:
- Criar tarefa real de teste em ambiente controlado.
- Conferir no app se a tarefa aparece corretamente.
- Conferir assignees e activity log.
- Rodar testes relevantes do app.

Resultado:
- Criada ferramenta `gti_create_task` usando a RPC `create_task_with_assignees`.
- Criada ferramenta `gti_update_task` para campos conhecidos e sincronizacao opcional de assignees.
- Criada ferramenta `gti_move_task_status`.
- Escritas usam usuario autenticado via `GTI_MCP_USER_ACCESS_TOKEN`.
- Troca de responsavel exige `confirmOwnerChange=true`.
- Criacao atribuida a outra pessoa exige `confirmAssignedToOther=true`.
- Mover para status final exige `confirmFinalize=true`.
- Delecao e arquivamento ficaram fora do escopo da sprint.

## Sprint MCP 5 - Checklist e Comentarios

Status: concluida localmente

Objetivo: permitir que agentes ajudem na execucao diaria sem editar a tarefa inteira.

Entregas:
- Criar ferramenta `gti_add_checklist_item`.
- Criar ferramenta `gti_update_checklist_item`.
- Criar ferramenta `gti_toggle_checklist_item`.
- Criar ferramenta `gti_delete_checklist_item` somente se houver confirmacao ou regra clara.
- Criar ferramenta `gti_add_comment`.
- Incluir actor/usuario correto em comentarios e logs.
- Retornar checklist atualizado apos alteracoes.

Validacao:
- Adicionar item de checklist via MCP.
- Marcar item como concluido via MCP.
- Adicionar comentario via MCP.
- Conferir UI de detalhe da tarefa.
- Conferir activity logs.

Resultado:
- Criada ferramenta `gti_add_checklist_item`.
- Criada ferramenta `gti_update_checklist_item`.
- Criada ferramenta `gti_toggle_checklist_item`.
- Criada ferramenta `gti_delete_checklist_item` com `confirmDelete=true` obrigatorio.
- Criada ferramenta `gti_add_comment`.
- Alteracoes de checklist retornam checklist atualizado.
- Comentarios e checklist registram activity log quando aplicavel.

## Sprint MCP 6 - Guardrails, Confirmacoes e Auditoria

Status: concluida localmente

Objetivo: reduzir risco operacional antes do uso diario.

Entregas:
- Definir lista de acoes que exigem confirmacao:
  - arquivar tarefa
  - deletar tarefa
  - remover checklist
  - alterar responsavel
  - alterar status para finalizado
  - alterar muitas tarefas em sequencia
- Adicionar logs locais de chamadas MCP.
- Incluir request id ou correlation id.
- Padronizar erros amigaveis para o agente.
- Adicionar limites de volume:
  - limite de tarefas retornadas
  - limite de updates por chamada
  - limite de tamanho de comentario
- Documentar politica de permissao.

Validacao:
- Simular inputs invalidos.
- Simular falta de permissao.
- Simular tentativa de acao destrutiva.
- Conferir se o MCP falha de forma segura.

Resultado:
- Criada auditoria local em `logs/mcp-audit.jsonl`.
- Escritas recebem `requestId` e registram `started`, `succeeded` e `failed`.
- Logs sanitizam tokens, descricoes, titulos e corpos de comentario.
- Erros auditados retornam `[requestId]` para correlacao.
- Confirmacoes obrigatorias consolidadas para responsavel, finalizacao, criacao para terceiros e delete de checklist.
- Limites operacionais e politica documentados em `docs/mcp-permissions.md`.

## Sprint MCP 7 - Integracao com Codex e Claude

Status: concluida localmente

Objetivo: conectar o MCP nos clientes usados no dia a dia.

Entregas:
- Atualizar `.mcp.json` local com servidor `gti`.
- Documentar configuracao para Codex.
- Documentar configuracao para Claude Desktop.
- Criar exemplos de prompts:
  - "liste minhas tarefas urgentes"
  - "crie uma tarefa para..."
  - "adicione checklist nesta tarefa"
  - "resuma o andamento deste projeto"
  - "quais tarefas estao bloqueadas ou atrasadas?"
- Testar fluxo completo:
  - ler contexto
  - listar tarefas
  - abrir detalhe
  - adicionar checklist
  - comentar

Validacao:
- Teste manual com Codex.
- Teste manual com Claude.
- Registrar problemas e ajustes de schema.

Resultado:
- `.mcp.json` local ja contem servidor `gti`.
- Criado guia `docs/mcp-integration.md` para Codex e Claude Desktop.
- Criados exemplos de prompts de contexto, leitura, criacao, checklist e comentarios.
- Criado script `npm run mcp:smoke` para validar servidor, tools, resources e healthcheck.
- Fluxo completo de teste documentado; passos de escrita devem usar tarefa de teste e token de usuario real.

## Sprint MCP 8 - Testes, Documentacao e Entrega

Status: concluida localmente

Objetivo: deixar o MCP confiavel e facil de manter.

Entregas:
- Testes unitarios das funcoes de payload.
- Testes de validacao Zod.
- Testes de integracao com Supabase quando ambiente estiver disponivel.
- README do MCP completo.
- Guia de operacao e troubleshooting.
- Checklist de seguranca final.
- Revisao de `.gitignore` para impedir credenciais.
- Revisao de logs para evitar vazamento de dados sensiveis.

Validacao:
- Rodar `npm run build`.
- Rodar `npm run lint`.
- Rodar testes unitarios relevantes.
- Testar inicializacao do MCP do zero.

Resultado:
- Criado `npm run mcp:check` para build + smoke test do MCP.
- Criado teste unitario de sanitizacao da auditoria em `mcp/tests/audit.test.ts`.
- Criado checklist de entrega em `docs/mcp-delivery-checklist.md`.
- README do MCP atualizado com comandos e checklist.
- Revisao de segredos documentada e validada por busca local.

## Backlog Futuro

- Criar ferramenta `gti_archive_task` com confirmacao explicita.
- Criar resumo automatico semanal por projeto/categoria.
- Criar sugestoes de proximas acoes a partir de tarefas atrasadas.
- Criar ferramentas para KPIs e OKRs.
- Integrar com comentarios em documentos ou atas, se o fluxo pedir.
- Criar modo somente leitura para usuarios que querem apenas consulta.
- Criar MCP separado de analytics, caso KPIs crescam muito.

## Proximas Sprints Pos-MVP

## Sprint MCP 9 - Aba MCP no GTI e Fluxo de Token

Status: concluida localmente e deployada na Vercel

Objetivo: facilitar a obtencao do token de sessao para uso local do MCP.

Entregas:
- Card `MCP` em `Configuracoes`.
- Botao para atualizar sessao.
- Botao para copiar somente o token.
- Botao para copiar snippet `.env`.
- Botao para copiar snippet `.mcp.json`.
- Nao exibir token em tela.
- Nao copiar `refresh_token`.
- Testes unitarios da copia do snippet e refresh de sessao.
- Deploy em producao na Vercel.

Validacao:
- `npm run test`.
- `npm run lint`.
- `npm run build`.
- `npm run mcp:check`.
- Conferir card em `https://go-gti.vercel.app/settings`.

Resultado:
- Deploy realizado em `https://go-gti.vercel.app`.
- Card MCP disponivel na versao Vercel.
- Token novo copiado pelo fluxo da UI e validado localmente.

## Sprint MCP 10 - Teste Real de Escrita e Auditoria

Status: concluida localmente

Objetivo: validar ponta a ponta as ferramentas de escrita com dados reais.

Entregas:
- Criar tarefa real de teste via `gti_create_task`.
- Adicionar itens de checklist via `gti_add_checklist_item`.
- Marcar item como concluido via `gti_toggle_checklist_item`.
- Adicionar comentario via `gti_add_comment`.
- Ler detalhe via `gti_get_task`.
- Conferir `logs/mcp-audit.jsonl`.

Resultado:
- Tarefa criada:
  - `40dd82aa-ee06-41f4-9ba8-bb64429d497b`
  - `[TESTE MCP] Escrita automatizada 2026-06-16T16:31:44`
  - Status: `A Fazer`
  - Prioridade: `low`
- Checklist criado com 2 itens.
- 1 item marcado como concluido.
- Comentario criado.
- Auditoria local confirmou `started` e `succeeded` para criacao, checklist, toggle e comentario.
- Log local sanitizou titulo, descricao e corpo do comentario.

## Sprint MCP 11 - Ferramenta de Arquivamento Seguro

Status: concluida localmente

Objetivo: permitir arquivar tarefas de forma controlada.

Entregas:
- Criar ferramenta `gti_archive_task`.
- Exigir `confirmArchive=true`.
- Bloquear arquivamento em massa.
- Registrar `task_archived` em activity log.
- Retornar resumo da tarefa arquivada.
- Adicionar auditoria local com `requestId`.
- Documentar no README e em `docs/mcp-permissions.md`.

Validacao:
- Criar tarefa de teste.
- Arquivar tarefa de teste via MCP.
- Conferir UI.
- Conferir activity log.
- Conferir `logs/mcp-audit.jsonl`.

Resultado:
- Criada ferramenta `gti_archive_task`.
- `confirmArchive=true` e obrigatorio.
- A ferramenta recebe apenas um `id`, bloqueando arquivamento em massa pelo schema.
- Arquivamento atualiza `is_archived=true`.
- Activity log registra `task_archived`.
- Resposta retorna resumo da tarefa arquivada e `requestId`.
- Auditoria local registra `started`, `succeeded` e `failed` quando aplicavel.
- README, politica de permissoes e checklist de entrega atualizados.
- Tarefa real de teste arquivada via MCP:
  - `52a164a5-971c-40ce-9b07-70e828b58a0d`
  - `[TESTE MCP] Arquivamento seguro 2026-06-16T16:58:01.418Z`
  - `requestId`: `db364e40-ea66-4156-80ff-f3fabb13c0e3`

## Sprint MCP 12 - Perfil, Pessoas e Resolucao por Nome

Status: concluida localmente

Objetivo: permitir que agentes encontrem pessoas sem inventar IDs.

Entregas:
- Criar ferramenta `gti_list_profiles`.
- Criar ferramenta `gti_search_profiles`.
- Retornar somente perfis ativos por padrao.
- Limitar resultados.
- Incluir `id`, `full_name`, `email`, `role` e `active`.
- Documentar que atribuicoes devem usar IDs retornados pelas ferramentas.

Validacao:
- Buscar usuario por nome.
- Buscar usuario por email.
- Usar ID retornado para criar tarefa atribuida a outra pessoa com confirmacao.

Resultado:
- Criada ferramenta `gti_list_profiles`.
- Criada ferramenta `gti_search_profiles`.
- Ambas retornam `id`, `full_name`, `email`, `role` e `active`.
- Perfis inativos ficam ocultos por padrao via `activeOnly=true`.
- Resultados limitados por `limit`, com padrao `20` e maximo `50`.
- Busca por nome e email usa consultas separadas e junta os resultados por ID.
- README, politica de permissoes e checklist de entrega atualizados.
- Validacao real de leitura concluida:
  - `gti_list_profiles` retornou 5 perfis ativos com `limit: 5`.
  - `gti_search_profiles` encontrou perfil por nome.
  - `gti_search_profiles` encontrou o mesmo perfil por email.

## Sprint MCP 13 - Resumos Operacionais

Status: concluida localmente

Objetivo: dar ao agente ferramentas de leitura mais executivas.

Entregas:
- Criar `gti_summarize_my_tasks`.
- Criar `gti_summarize_project`.
- Criar `gti_summarize_category`.
- Incluir contagem por status, prioridade e vencimento.
- Incluir tarefas atrasadas e proximas de vencer.
- Incluir progresso medio de checklist.
- Nao retornar listas gigantes; usar top N.

Validacao:
- Comparar contagens com `gti_list_tasks`.
- Testar com projeto sem tarefas.
- Testar com categoria sem tarefas.

Resultado:
- Criada ferramenta `gti_summarize_my_tasks`.
- Criada ferramenta `gti_summarize_project`.
- Criada ferramenta `gti_summarize_category`.
- Resumos incluem contagem por status, prioridade, vencimento, tarefas atrasadas, proximas de vencer e progresso de checklist.
- Tarefas arquivadas ficam excluidas.
- Listas de tarefas usam `topN`, com padrao `5` e maximo `10`.
- Consultas usam `fetchLimit`, com padrao `200` e maximo `500`.
- README, guia de integracao, politica de permissoes e checklist de entrega atualizados.
- Validacao real de leitura concluida:
  - `gti_summarize_my_tasks` retornou total, abertas, atrasadas, proximas de vencer e percentual de checklist.
  - `gti_summarize_project` bateu com `gti_list_tasks` para projeto real.
  - `gti_summarize_category` bateu com `gti_list_tasks` para categoria real.
  - Projeto e categoria sem tarefas retornaram total `0`.

## Sprint MCP 14 - Sugestoes de Proximas Acoes

Status: concluida localmente

Objetivo: ajudar no planejamento sem executar mudancas automaticamente.

Entregas:
- Criar `gti_suggest_next_actions`.
- Usar tarefas atrasadas, urgentes, sem responsavel, sem checklist ou paradas em status inicial.
- Retornar sugestoes textuais, sem escrita automatica.
- Incluir IDs de tarefas relacionadas.
- Explicar criterio usado.

Guardrails:
- Nao criar tarefas automaticamente.
- Nao mover status automaticamente.
- Nao comentar automaticamente.

Validacao:
- Rodar em tarefas pessoais.
- Rodar em projeto especifico.
- Conferir se sugestoes citam IDs reais.

Resultado:
- Criada ferramenta `gti_suggest_next_actions`.
- A ferramenta e somente leitura e nao cria tarefas, move status ou adiciona comentarios.
- Escopos suportados: `my_tasks`, `project` e `category`.
- Criterios usados: atrasada, urgente, sem responsavel, sem checklist, status inicial e proxima de vencer.
- Sugestoes retornam `taskId`, titulo, prioridade, prazo, status, responsavel, criterios e sugestao textual.
- Resultados limitados por `maxSuggestions`, com padrao `10` e maximo `20`.
- Consultas usam `fetchLimit`, com padrao `200` e maximo `500`.
- README, guia de integracao, politica de permissoes e checklist de entrega atualizados.
- `npm run mcp:check` passou com 23 ferramentas.
- Validacao real com dados ficou pendente porque o `GTI_MCP_USER_ACCESS_TOKEN` local estava expirado.

## Sprint MCP 15 - KPIs e OKRs

Status: concluida localmente

Objetivo: expandir o MCP para leitura e operacao leve de KPIs/OKRs.

Entregas:
- Criar ferramentas de leitura de KPIs.
- Criar ferramentas de leitura de OKRs.
- Criar resumo semanal de KPIs fora da meta.
- Criar leitura de planos de acao.
- Avaliar se escrita em KPIs deve exigir confirmacoes adicionais.

Validacao:
- Comparar com pagina `/kpis`.
- Comparar com pagina `/okrs`.
- Testar usuario `member`, `lead` e `admin`.

Resultado:
- Criada ferramenta `gti_list_kpis`.
- Criada ferramenta `gti_get_kpi`.
- Criada ferramenta `gti_summarize_kpis_off_track`.
- Criada ferramenta `gti_list_kpi_action_plans`.
- Criada ferramenta `gti_list_okrs`.
- Ferramentas de KPIs/OKRs ficaram somente leitura nesta sprint.
- Resumo de KPIs fora da meta calcula status da semana atual ou de semana informada.
- OKRs retornam objetivos, KRs, marcos e progresso calculado.
- README, guia de integracao, politica de permissoes e checklist de entrega atualizados.
- `npm run mcp:build` passou.
- Validacao real com dados ficou pendente porque o `GTI_MCP_USER_ACCESS_TOKEN` local estava expirado.

## Sprint MCP 16 - Hardening de Autenticacao e Token

Status: concluida localmente

Objetivo: reduzir dependencia de copiar `access_token` manualmente.

Opcoes a avaliar:
- Melhorar aba MCP para mostrar quando token esta perto de expirar.
- Adicionar aviso visual para token expirado.
- Adicionar botao para copiar comando `npm run mcp:smoke`.
- Avaliar Edge Function para emitir tokens MCP revogaveis.
- Avaliar tabela de tokens pessoais com expiração, escopos e `last_used_at`.

Cuidados:
- Token proprio do GTI nao vira automaticamente `auth.uid()` no Supabase.
- Qualquer token revogavel precisa preservar autorizacao equivalente ao usuario.
- Nao usar `service_role` para burlar RLS sem uma camada de autorizacao forte.

Resultado:
- Aba MCP passou a mostrar estado de expiração do token.
- Aba MCP avisa quando o token esta expirado ou perto de expirar.
- Copia de token fica bloqueada quando a sessao esta expirada.
- Adicionado botao para copiar `npm run mcp:smoke`.
- Fluxo de troubleshooting documentado para `token is expired`.
- Edge Function e tabela de tokens pessoais ficaram como avaliacao futura, sem implementacao nesta sprint.

## Sprint MCP 17 - Testes de Permissao por Papel

Status: preparada localmente; validacao real pendente

Objetivo: validar comportamento real com `member`, `lead` e `admin`.

Entregas:
- Preparar usuarios/tokens de teste por role.
- Testar leitura de tarefas.
- Testar criacao para si.
- Testar criacao para outra pessoa.
- Testar update de tarefa relacionada e nao relacionada.
- Testar comentarios e checklist.
- Documentar matriz de permissoes real.

Validacao:
- Registrar casos esperados e observados.
- Ajustar tools ou RLS se houver divergencia.

Resultado:
- Criado script `npm run mcp:permissions`.
- Script carrega `.env` local e aceita tokens `GTI_MCP_MEMBER_ACCESS_TOKEN`, `GTI_MCP_LEAD_ACCESS_TOKEN` e `GTI_MCP_ADMIN_ACCESS_TOKEN`.
- Validacao padrao e somente leitura.
- Escritas reais exigem `GTI_MCP_PERMISSION_TEST_WRITES=true`.
- Criado `docs/mcp-permission-matrix.md` com comandos, cobertura e matriz esperada.
- `.env.example` atualizado com variaveis opcionais da matriz.
- Validacao real por papel ainda depende de tokens validos para `member`, `lead` e `admin`.

## Sprint MCP 18 - Entrega e Commit

Status: pendente

Objetivo: preparar a entrega versionada do MCP.

Entregas:
- Revisar arquivos alterados.
- Garantir que `.env`, `.mcp.json`, `logs/`, `dist/` e `mcp/dist/` nao entram no Git.
- Rodar validacao completa:
  - `npm run mcp:check`
  - `npm run test`
  - `npm run lint`
  - `npm run build`
- Revisar busca por segredos.
- Criar commit coerente.
- Opcional: tag ou release interna.

Validacao:
- `git status` limpo exceto arquivos ignorados locais.
- Nenhum token real em arquivos versionados.

## Riscos Conhecidos

- Token Supabase em arquivo local/versionado precisa ser tratado antes de uso amplo.
- Escritas via MCP podem confundir autoria se o usuario MCP nao estiver bem definido.
- Usar credencial muito privilegiada pode burlar RLS e criar risco desnecessario.
- Ferramentas amplas demais aumentam chance de alteracoes acidentais.
- Respostas com muitas tarefas podem ficar grandes e pouco uteis para agentes.

## Definicao de Pronto

- Credenciais nao aparecem em arquivos versionados.
- MCP inicia localmente com configuracao documentada.
- Ferramentas tem schemas claros e validacao.
- Leituras respeitam permissoes e limites.
- Escritas deixam activity log quando aplicavel.
- Acoes destrutivas sao bloqueadas ou exigem confirmacao.
- Codex e Claude conseguem usar o MCP em fluxo real.
