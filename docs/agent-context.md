# GTI - Contexto para Agentes

Este documento resume o contexto estavel do GTI para uso por agentes via MCP.

## Visao Geral

O GTI e uma aplicacao interna de planejamento operacional da equipe de Transportes. O produto combina dashboard, Kanban individual, Kanban da equipe, lista de tarefas, detalhe de tarefa, projetos, OKRs, KPIs e configuracoes administrativas.

O sistema usa:
- React, Vite e TypeScript no frontend.
- Supabase Auth, PostgreSQL, Realtime e RLS no backend.
- Google OAuth com allowlist de emails.
- Perfis internos em `profiles`.
- Regras de permissao por role: `admin`, `lead` e `member`.

## Entidades Principais

- `profiles`: usuarios internos ativos, vinculados ao Supabase Auth.
- `allowed_emails`: allowlist de acesso.
- `task_statuses`: colunas do Kanban.
- `categories`: areas/frentes de trabalho.
- `projects`: projetos dentro de categorias.
- `tasks`: tarefas operacionais.
- `task_assignees`: responsaveis adicionais da tarefa.
- `task_comments`: comentarios em tarefas.
- `task_checklist_items`: checklist da tarefa.
- `task_activity_logs`: historico operacional da tarefa.

## Regras de Tarefas

- Tarefa deve ter `title`, `status_id`, `creator_id`, `owner_id` e `priority`.
- `creator_id` deve ser o usuario autenticado que criou a tarefa.
- `owner_id` representa o responsavel principal.
- `task_assignees` representa participantes/responsaveis adicionais.
- Tarefas arquivadas usam `is_archived = true` e nao devem aparecer por padrao.
- Mudancas relevantes devem registrar activity log quando aplicavel.
- Criacao completa de tarefa deve preferir a RPC `create_task_with_assignees`.
- Tarefas recorrentes podem gerar nova tarefa ao serem concluidas.

## Prioridades

Valores validos:
- `low`
- `medium`
- `high`
- `urgent`

Padrao:
- `medium`

## Status do Kanban

Os status ficam em `task_statuses` e devem ser lidos do banco, ordenados por `position`.

Campos importantes:
- `id`
- `name`
- `slug`
- `position`
- `color`
- `is_final`

Agentes nao devem assumir nomes fixos de status sem consultar o banco.

## Projetos e Categorias

Categorias:
- Ficam em `categories`.
- Somente categorias `active = true` devem aparecer por padrao.
- Ordenacao padrao por `name`.

Projetos:
- Ficam em `projects`.
- Somente projetos `active = true` devem aparecer por padrao.
- Cada projeto pode ter uma categoria.
- Ordenacao padrao por `name`.

Agentes nao devem inventar projetos ou categorias. Devem consultar as ferramentas MCP antes de criar/alterar tarefas.

## Permissoes Esperadas

Roles:
- `admin`: acesso administrativo amplo.
- `lead`: acesso operacional amplo, incluindo visao de equipe.
- `member`: acesso operacional as tarefas relacionadas.

Regras importantes:
- RLS esta habilitado nas tabelas sensiveis.
- Leituras operacionais exigem usuario ativo.
- Escritas devem agir como usuario autenticado real.
- O MCP de dominio deve respeitar `auth.uid()`.
- Nao usar `service_role` como credencial padrao.

## Rotas Principais

- `/login`: login com Google.
- `/unauthorized`: acesso negado por allowlist.
- `/dashboard`: visao executiva.
- `/my-board`: Kanban individual.
- `/team-board`: Kanban da equipe.
- `/tasks`: lista de tarefas.
- `/tasks/:id`: detalhe da tarefa.
- `/projects`: lista e criacao de projetos.
- `/projects/:id`: detalhe, edicao e Kanban do projeto.
- `/kpis`: KPIs semanais.
- `/okrs`: OKRs.
- `/settings`: configuracoes e allowlist.

## Guardrails para Agentes

Permitido no MVP:
- Ler contexto do site.
- Listar status, categorias e projetos.
- Consultar tarefas.
- Criar tarefas com campos claros.
- Atualizar tarefas relacionadas.
- Adicionar comentarios.
- Adicionar e marcar checklist.

Exige confirmacao humana:
- Arquivar tarefa.
- Remover checklist.
- Alterar responsavel principal.
- Mover tarefa para status finalizado.
- Alterar mais de uma tarefa em uma solicitacao.
- Criar tarefa atribuida a outra pessoa.

Proibido no MVP:
- Deletar tarefas.
- Deletar comentarios.
- Deletar projetos.
- Editar allowlist.
- Editar roles.
- Executar SQL arbitrario.
- Contornar RLS.

## Boas Praticas para Uso do MCP

- Consultar status/projetos/categorias antes de criar tarefas.
- Usar IDs retornados pelas ferramentas, nao nomes livres.
- Evitar respostas gigantes; preferir filtros e limites.
- Explicar ao usuario quais alteracoes serao feitas antes de escrita sensivel.
- Registrar atividade para escritas operacionais sempre que aplicavel.
