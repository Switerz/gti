# Planner Kanban de Transportes - Gogroup

Aplicacao web interna para planejamento operacional da equipe de Transportes do Gogroup.

## Stack

- Vite + React + TypeScript
- TailwindCSS + shadcn/ui
- React Router
- TanStack Query
- Supabase Auth/Database/RLS
- Vitest + React Testing Library
- Playwright

## Setup local

1. Instale dependencias:

```bash
npm install
```

2. Configure variaveis de ambiente:

```bash
cp .env.example .env.local
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

3. Execute as migrations no Supabase:

Acesse o SQL Editor do seu projeto Supabase e execute os arquivos em ordem:

```
supabase/migrations/20240101000001_init_schema.sql
supabase/migrations/20240101000002_rls_policies.sql
supabase/migrations/20240101000003_seeds.sql
supabase/migrations/20240101000004_triggers.sql
supabase/migrations/20240101000005_profile_security_hardening.sql
```

4. Configure Google OAuth no Supabase:

- Acesse Authentication > Providers no painel do Supabase
- Ative Google OAuth e configure as credenciais do Google Cloud Console
- Em Authentication > URL Configuration, adicione `http://localhost:5173` em "Site URL" e `http://localhost:5173/dashboard` em "Redirect URLs"

5. Adicione o seu e-mail na allowlist:

```sql
insert into public.allowed_emails (email, role)
values ('seu.email@gogroup.com', 'admin');
```

6. Rode o app:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run test:e2e
npm run test:e2e:refresh-auth
npm run preview
```

## Testes e fluxo TDD

O projeto deve evoluir em ciclos TDD: escrever o teste do criterio de aceite, ver falhar, implementar o minimo, refatorar e rodar a validacao.

Validacao local recomendada:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

### E2E autenticado

Os testes publicos de login rodam sem sessao. Fluxos autenticados, como criacao de tarefa, ficam pulados ate existir um `storageState` Playwright de um usuario permitido no Supabase:

```powershell
$env:E2E_AUTH_STORAGE_STATE="playwright/.auth/allowed-user.json"; npm run test:e2e
```

Esse modo usa uma sessao real do Supabase e nao cria bypass de autenticacao no app.
Quando `E2E_AUTH_STORAGE_STATE` estiver definido, o Playwright roda com um worker para evitar concorrencia no refresh token da sessao Supabase.

Se o arquivo de sessao expirar, renove antes de rodar os fluxos autenticados:

```powershell
$env:E2E_AUTH_STORAGE_STATE="playwright/.auth/allowed-user.json"; npm run test:e2e:refresh-auth
```

## Gerenciar allowlist

Apenas admins podem gerenciar a allowlist via UI (Sprint 7). Por enquanto, use o SQL Editor do Supabase:

### Adicionar usuario

```sql
insert into public.allowed_emails (email, role, active)
values ('usuario@gogroup.com', 'member', true);
```

### Alterar role

```sql
update public.allowed_emails
set role = 'lead'
where email = 'usuario@gogroup.com';
```

### Desativar acesso

```sql
update public.allowed_emails
set active = false
where email = 'usuario@gogroup.com';
```

### Roles disponiveis

| Role   | Descricao                                  |
|--------|--------------------------------------------|
| admin  | Acesso total, gerencia allowlist            |
| lead   | Ve e edita todas as tarefas da equipe       |
| member | Ve tarefas da equipe, edita as proprias     |

## Estrutura de pastas

```
src/
  app/              # Router, providers, App.tsx
  components/
    auth/           # AuthGuard
    kanban/         # KanbanBoard, KanbanColumn, TaskCard (Sprint 3)
    tasks/          # TaskCreateDrawer, TaskDetail (Sprint 2+)
    layout/         # AppShell, Sidebar, Topbar, MobileNav
    shared/         # EmptyState, ErrorState, LoadingState
    ui/             # shadcn/ui base components
  features/
    auth/           # auth.service, AuthProvider
    profiles/       # profile.service
    tasks/          # task.service (Sprint 2)
    categories/     # category.service (Sprint 2)
    projects/       # project.service (Sprint 2)
    comments/       # (Sprint 5)
    activity/       # (Sprint 5)
  hooks/            # useSession, useCurrentProfile
  lib/              # supabase.ts, utils.ts, dates.ts
  pages/            # LoginPage, UnauthorizedPage, Dashboard, Boards...
  schemas/          # Zod schemas
  tests/            # Vitest + RTL tests
  types/            # database.types.ts, domain.ts
supabase/
  migrations/       # SQL migrations (run in order)
```

## Referencia Donnee OS

Este projeto usa `https://github.com/MarioDonnee/donnee-os` como referencia de produto e arquitetura.

## Sprints

| Sprint | Status     | Descricao                                              |
|--------|------------|--------------------------------------------------------|
| 0      | Concluida  | Base: Vite, Tailwind, shadcn, Supabase client, layout  |
| 1      | Concluida  | Schema SQL, RLS, auth Google, allowlist, profiles       |
| Estab. | Concluida  | Hardening RLS/profile, helpers de permissao, E2E smoke  |
| 2      | Concluida  | CRUD de tarefas, services, lista, payloads testados     |
| 3      | Concluida  | Meu Kanban com drag/drop e cache otimista               |
| 4      | Concluida  | Kanban da equipe com filtros avancados e E2E autenticado |
| 5      | Concluida  | Detalhe da tarefa, comentarios, checklist, historico     |
| 6      | Parcial    | Dashboard e KPIs                                        |
| 7      | Parcial    | Projetos, configuracoes, admin da allowlist             |
| 8      | Pendente   | Polimento, responsividade, performance, deploy          |

### Sprint 2 - notas de fechamento

- Payloads de criacao/edicao de tarefas foram isolados em helpers testaveis.
- Criacao inclui fallback de responsavel para o usuario logado.
- Responsaveis adicionais sao deduplicados e incluem sempre o responsavel principal.
- Mudanca para status final preenche `completed_at`; saida de status final limpa o campo.
- Selects Radix nao usam mais `SelectItem value=""`, evitando erro runtime.
- O teste E2E autenticado de criacao fica pulado ate existir `E2E_AUTH_STORAGE_STATE` real.

### Sprint 3 - notas de fechamento

- Movimento Kanban agora resolve drop em coluna e em card de outra coluna.
- Movimento usa atualização otimista em caches de lista e "minhas tarefas".
- Falhas de persistência fazem rollback do cache e exibem toast de erro.
- Cards também são droppables, melhorando a precisão do drag and drop.
- Testes cobrem resolução de destino, aplicação local do movimento e rollback.
- E2E autenticado de Kanban fica preparado, mas depende de `E2E_AUTH_STORAGE_STATE`.

### Sprint 4 - notas de fechamento

- Kanban da equipe usa dados reais de tarefas e aplica filtros combinados.
- Filtros adicionados: responsavel, criador, categoria, projeto, prioridade, status, vencimento e busca textual.
- Filtro de vencimento cobre atrasadas, hoje, proximos 7 dias e sem prazo.
- Empty state aparece quando filtros ativos nao retornam tarefas.
- Contadores por coluna refletem o conjunto filtrado.
- Testes cobrem helpers de filtros, renderizacao da pagina e E2E autenticado da rota `/team-board`.
- Migrations iniciais foram ajustadas para reduzir erros em reruns manuais no SQL Editor.

### Sprint 5 - notas de fechamento

- Pagina de detalhe permite editar titulo, descricao, status, prioridade, categoria, projeto, responsavel, datas e arquivar.
- Comentarios sao salvos no Supabase e registram atividade `comment_added`.
- Checklist permite adicionar, marcar como concluido e remover itens.
- Marcar item como concluido registra atividade `checklist_item_done`.
- Responsaveis adicionais podem ser alterados no detalhe, mantendo o responsavel principal sempre incluido.
- Alteracoes de responsaveis registram `assignee_added` e `assignee_removed`.
- Foi corrigido o relacionamento ambiguo `task_assignees -> profiles` no select de tarefas.
- E2E autenticado cobre detalhe, comentario, checklist, historico e arquivamento.

## Deploy (Vercel)

1. Importe o repositorio no Vercel
2. Configure as variaveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Em Supabase > Authentication > URL Configuration, adicione a URL da Vercel nos Redirect URLs
4. Faca o deploy
