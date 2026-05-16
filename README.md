# GTI - Planner Kanban de Transportes

Aplicacao web interna do Gogroup para planejamento operacional da equipe de Transportes. O produto combina planner, Kanban e lista de tarefas com autenticacao privada, allowlist, permissoes por perfil, Supabase RLS e dados reais no banco.

O projeto usa o [Donnee OS](https://github.com/MarioDonnee/donnee-os) como referencia de produto e arquitetura, sem copiar tudo literalmente. A prioridade aqui e manter um MVP robusto, simples de operar e pronto para evoluir.

## Stack

- Vite + React + TypeScript
- TailwindCSS + shadcn/ui
- React Router
- TanStack Query
- Supabase Auth, PostgreSQL, Realtime e RLS
- React Hook Form + Zod
- dnd-kit
- date-fns
- lucide-react
- Vitest + React Testing Library
- Playwright
- Vercel

## Funcionalidades atuais

- Login privado via Supabase Auth com Google OAuth.
- Verificacao de allowlist por e-mail.
- Criacao e atualizacao automatica de `profiles`.
- RLS para profiles, allowlist, tarefas, comentarios, checklist e historico.
- Dashboard com KPIs operacionais.
- Meu Kanban com drag and drop e atualizacao otimista.
- Kanban da equipe com filtros combinados.
- Lista de tarefas com criacao, edicao e arquivamento.
- Detalhe de tarefa com comentarios, checklist, atividade e edicao completa.
- Projetos, detalhe de projeto e Kanban filtrado por projeto.
- Configuracoes com gestao de allowlist para admin.
- Sincronizacao basica via Supabase Realtime para tarefas, responsaveis, comentarios, checklist e atividades.
- Notificacoes em tempo real quando o usuario e adicionado como responsavel.
- Exportacao CSV de tarefas para admins e leads, respeitando filtros ativos da lista.
- Seed demo opcional com tarefas realistas para avaliacao visual.

## Rotas

| Rota | Descricao |
| --- | --- |
| `/login` | Login com Google |
| `/unauthorized` | Acesso negado por allowlist |
| `/` | Redireciona para `/dashboard` |
| `/dashboard` | Visao executiva |
| `/my-board` | Kanban individual |
| `/team-board` | Kanban da equipe |
| `/tasks` | Lista de tarefas |
| `/tasks/:id` | Detalhe da tarefa |
| `/projects` | Lista e criacao de projetos |
| `/projects/:id` | Detalhe, edicao e Kanban do projeto |
| `/settings` | Configuracoes e allowlist |

## Setup local

1. Instale as dependencias:

```bash
npm install
```

2. Copie as variaveis de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Nunca use `service_role` no frontend. Essa chave ignora RLS e deve ficar apenas em ambientes server-side controlados.

4. Rode o app:

```bash
npm run dev
```

A URL local padrao e `http://localhost:5173`.

## Supabase

Execute as migrations no SQL Editor do Supabase, em ordem:

```txt
supabase/migrations/20240101000001_init_schema.sql
supabase/migrations/20240101000002_rls_policies.sql
supabase/migrations/20240101000003_seeds.sql
supabase/migrations/20240101000004_triggers.sql
supabase/migrations/20240101000005_profile_security_hardening.sql
```

As migrations criam:

- `profiles`
- `allowed_emails`
- `task_statuses`
- `categories`
- `projects`
- `tasks`
- `task_assignees`
- `task_comments`
- `task_checklist_items`
- `task_activity_logs`
- helpers SQL de permissao
- policies RLS
- triggers de updated_at, conclusao e hardening de profile
- seeds iniciais de status, categorias e projetos

### Google OAuth

No Supabase:

1. Va em `Authentication > Providers`.
2. Ative Google OAuth.
3. Configure as credenciais do Google Cloud Console.
4. Em `Authentication > URL Configuration`, configure:

```txt
Site URL: http://localhost:5173
Redirect URLs:
http://localhost:5173/dashboard
https://SUA_URL_VERCEL/dashboard
```

### Allowlist inicial

Antes de logar, cadastre pelo menos um admin:

```sql
insert into public.allowed_emails (email, role, active)
values ('seu.email@gogroup.com', 'admin', true);
```

Roles:

| Role | Permissoes principais |
| --- | --- |
| `admin` | Acesso total, allowlist, categorias, projetos e edicao ampla |
| `lead` | Visao de equipe, criacao para terceiros e edicao operacional ampla |
| `member` | Visao de equipe, criacao, edicao das tarefas relacionadas e comentarios |

## Seed demo

Existe um seed opcional em:

```txt
supabase/seed_demo.sql
```

Ele cria 28 tarefas realistas, comentarios, checklists e logs para o primeiro profile ativo encontrado. Use apenas para avaliacao visual/local.

Atencao:

- O seed demo ainda nao e idempotente.
- Rodar mais de uma vez duplica tarefas.
- Nao use em producao sem adaptar para um usuario especifico e sem criar protecao contra duplicidade.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:watch
npm run build
npm run preview
npm run test:e2e
npm run test:e2e:refresh-auth
npm run format
npm run format:check
```

## Testes e TDD

O projeto deve continuar evoluindo em ciclos TDD:

1. Escrever teste do criterio de aceite.
2. Ver o teste falhar.
3. Implementar o minimo necessario.
4. Refatorar.
5. Rodar a validacao.

Validacao local recomendada:

```bash
npm run lint
npm run test
npm run build
```

Estado atual validado:

- 147 testes Vitest/RTL passando.
- TypeScript build passando.
- Lint passando.
- Build Vite passando.

### E2E sem autenticacao

```bash
npm run test:e2e
```

Os testes publicos validam redirecionamento para login e botao de Google.

### E2E autenticado

Os fluxos autenticados usam uma sessao real do Supabase. Defina `E2E_AUTH_STORAGE_STATE`:

```powershell
$env:E2E_AUTH_STORAGE_STATE="playwright/.auth/allowed-user.json"; npm run test:e2e
```

Quando esse modo esta ativo, o Playwright roda com um worker para evitar concorrencia no refresh token.

Para renovar a sessao:

```powershell
$env:E2E_AUTH_STORAGE_STATE="playwright/.auth/allowed-user.json"; npm run test:e2e:refresh-auth
```

Os E2E autenticados podem criar, mover, comentar e arquivar tarefas no Supabase configurado.

## Estrutura

```txt
src/
  app/                  # App, providers e router
  components/
    auth/               # AuthGuard
    kanban/             # KanbanBoard, KanbanColumn, filtros e DnD
    layout/             # AppShell, Sidebar, Topbar, MobileNav, UserMenu
    shared/             # EmptyState, ErrorState, LoadingState
    tasks/              # Cards, drawer unificado, badges e detalhe
    ui/                 # shadcn/ui
  features/
    activity/           # activity.service
    allowlist/          # allowlist.service
    auth/               # auth.service, AuthProvider, profile-sync
    categories/         # category.service
    checklist/          # checklist.service
    comments/           # comment.service
    profiles/           # profile.service
    projects/           # project.service
    tasks/              # task.service, payloads, filtros e Kanban helpers
  hooks/                # hooks de dados, auth, mutations e realtime
  lib/                  # supabase, dates, permissions, utils
  pages/                # paginas de rota
  schemas/              # validacoes Zod
  tests/                # Vitest + RTL
  types/                # tipos de dominio e database
supabase/
  migrations/           # SQL versionado
  seed_demo.sql         # seed visual opcional
e2e/                    # Playwright
scripts/                # utilitarios de E2E
```

## Status das sprints

| Sprint | Status | Entrega |
| --- | --- | --- |
| 0 | Concluida | Setup Vite, Tailwind, shadcn, Supabase client, router e layout |
| 1 | Concluida | Schema, seeds, RLS, Google OAuth, allowlist e profiles |
| 2 | Concluida | CRUD de tarefas, services, hooks, lista e payloads testados |
| 3 | Concluida | Meu Kanban com drag and drop e cache otimista |
| 4 | Concluida | Kanban da equipe com filtros combinados |
| 5 | Concluida | Detalhe completo, comentarios, checklist e historico |
| 6 | Concluida | Dashboard com KPIs, prazos e distribuicao por status |
| 7 | Concluida | Projetos, settings e allowlist admin |
| 8 | Parcial | Polimento, responsividade, performance e documentacao |
| 12 | Concluida | Security hardening em edicao e allowlist |
| 13 | Concluida | Cache, performance e reducao de N+1 em tarefas |
| 14 | Concluida | Pagina `/projects/:id` com stats e Kanban do projeto |
| 15 | Concluida | Consolidacao de create/edit em `TaskFormDrawer` |
| 16 | Concluida | Notificacoes em tempo real para novas atribuicoes |
| 17 | Concluida | Exportacao CSV de tarefas com filtros por periodo |
| 18 | Concluida | Acessibilidade, CI/CD, indices de performance e polish final |

Observacao: a numeracao pulou porque algumas etapas foram feitas em sprints internas pelo Claude. O codigo atual reflete as entregas 12 a 18.

## Correcoes recentes

- Auth agora usa leitura sincronica segura do token local do Supabase como estado inicial.
- Sessao local expirada ou corrompida e limpa e redireciona para `/login`, evitando spinner infinito.
- `AuthProvider` continua atualizando o cache via eventos do Supabase.
- `useSession` nao precisa bloquear a UI esperando refresh de token.
- `TaskFormDrawer` substitui drawers separados de criacao e edicao.
- `getMyTasks` evita N+1 com consultas agrupadas.
- Kanban foi redesenhado para grid sem scroll horizontal fixo no desktop.
- Sino de notificacoes exibe novas atribuicoes recebidas via `task_assignees`.
- Atualizacao de responsaveis agora insere/remove apenas diferencas, evitando notificacoes falsas.
- Lista de tarefas permite exportar CSV com filtro adicional por criacao ou prazo.

## Pendencias recomendadas

Prioridade alta:

- Tornar `supabase/seed_demo.sql` idempotente antes de versionar como seed oficial.
- Revisar policies de `projects` para alinhar banco e UI sobre quem pode editar projetos.
- Fortalecer todas as funcoes `security definer` antigas com `set search_path = public`.
- Rodar E2E autenticado depois de renovar a sessao Playwright.

Prioridade media:

- Melhorar responsividade do Kanban em telas estreitas.
- Garantir logs transacionais para comentarios/checklist quando necessario.
- Adicionar testes E2E autenticados ao CI.
- Expandir cobertura de testes de acessibilidade com jest-axe.

Planejamento futuro:

- Continuar melhorias de acessibilidade (skip links, focus traps nos modais).
- Testes E2E autenticados no CI com Playwright.

## Troubleshooting

### App preso no spinner inicial

Esse sintoma geralmente acontece quando o navegador tem uma sessao Supabase antiga, expirada ou corrompida no `localStorage`.

Com a correcao atual, o app deve limpar essa sessao e redirecionar para `/login`. Se ainda ficar preso durante desenvolvimento:

1. Pare servidores Vite antigos.
2. Limpe storage do site em `localhost:5173`.
3. Rode novamente `npm run dev`.
4. Faca login outra vez com um e-mail ativo na allowlist.

### Usuario loga mas vai para acesso negado

Confirme se o e-mail existe e esta ativo:

```sql
select email, role, active
from public.allowed_emails
where email = 'seu.email@gogroup.com';
```

### Profile nao aparece apos login

Confirme se a migration 005 foi aplicada. Ela permite self-update seguro do profile sem permitir escalada de role.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

3. No Supabase, adicione a URL da Vercel em `Authentication > URL Configuration > Redirect URLs`.
4. Rode `npm run build` localmente antes do deploy.
5. Confirme que RLS esta ativo nas tabelas sensiveis.

## Definition of Done atual

O projeto esta em estado funcional de MVP interno quando:

- Usuario autorizado consegue logar.
- Usuario fora da allowlist e bloqueado.
- Tarefas podem ser criadas para si e para outras pessoas.
- Tarefas aparecem no Kanban individual e da equipe.
- Drag and drop persiste status.
- Comentarios, checklist e historico funcionam.
- Arquivamento funciona.
- Dashboard carrega indicadores reais.
- Filtros da equipe funcionam.
- RLS esta ativo.
- Lint, testes e build passam.
