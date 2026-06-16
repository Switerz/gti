# MCP GTI - Sprint 0 Seguranca e Escopo

Status: concluida localmente

Este documento registra as decisoes da Sprint MCP 0 antes da implementacao do servidor MCP de dominio do GTI.

## Resultado da Auditoria

- O arquivo `.mcp.json` existia apenas localmente e ja estava ignorado pelo Git.
- `.env` e variantes locais tambem ja estavam no `.gitignore`.
- `.mcp.json` e `.env` nao aparecem como arquivos rastreados no Git.
- Nao foi encontrado historico Git para `.mcp.json` ou `.env`.
- Foi encontrado um token Supabase local no `.mcp.json`; ele foi removido do arquivo.
- O `.mcp.json` local agora usa a variavel de ambiente `SUPABASE_ACCESS_TOKEN`.
- Foi criado `.mcp.example.json` sem segredos para documentar o formato esperado.
- As migrations mostram RLS habilitado nas tabelas principais de tarefas, perfis, projetos, OKRs, KPIs e notificacoes.
- Ja existe hardening de funcoes `security definer` em `supabase/migrations/20240101000019_security_hardening.sql`.

## Acao Obrigatoria Fora do Repositorio

Rotacionar o token Supabase que estava salvo localmente antes de usar o MCP em fluxo real.

Motivo: mesmo que o arquivo nao esteja rastreado no Git, o token ficou exposto em texto puro no ambiente local e pode ter sido copiado para logs, historico de terminal, backups ou ferramentas de sincronizacao.

## Variaveis de Ambiente

Para usar o Supabase MCP atual:

```powershell
$env:SUPABASE_ACCESS_TOKEN="seu_token_rotacionado"
```

Para o futuro MCP de dominio do GTI, a configuracao esperada deve usar variaveis separadas:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
GTI_MCP_USER_ACCESS_TOKEN=
```

Observacoes:
- `SUPABASE_ACCESS_TOKEN` e o token pessoal usado pelo MCP oficial do Supabase.
- `GTI_MCP_USER_ACCESS_TOKEN` deve representar uma sessao de usuario real quando o MCP de dominio precisar executar acoes no GTI.
- Nao usar `service_role` como credencial padrao do MCP.

## Usuario/Perfil do MCP

Decisao inicial:
- O MCP de dominio deve agir como um usuario autenticado real do GTI.
- As escritas devem respeitar RLS via `auth.uid()`.
- O usuario deve existir em `profiles`, estar ativo e ter permissao adequada para as acoes desejadas.

Pendente antes das sprints de escrita:
- Definir se o MCP usara o usuario do operador atual ou um usuario tecnico dedicado.
- Se for usuario tecnico, cadastrar e documentar esse profile no Supabase com role minima necessaria.

## Ferramentas Permitidas no MVP

Leitura:
- `gti_healthcheck`
- `gti_get_site_context`
- `gti_list_task_statuses`
- `gti_list_categories`
- `gti_list_projects`
- `gti_list_profiles`
- `gti_search_profiles`
- `gti_list_tasks`
- `gti_search_tasks`
- `gti_get_task`

Escrita controlada:
- `gti_create_task`
- `gti_update_task`
- `gti_move_task_status`
- `gti_add_checklist_item`
- `gti_update_checklist_item`
- `gti_toggle_checklist_item`
- `gti_add_comment`

## Acoes Proibidas no MVP

- Deletar tarefas.
- Deletar comentarios.
- Deletar projetos.
- Deletar usuarios ou profiles.
- Editar allowlist.
- Editar roles.
- Alterar categorias/status globais.
- Executar SQL arbitrario.
- Usar `service_role` para contornar RLS.
- Fazer atualizacoes em massa sem limite explicito.

## Acoes Que Exigem Confirmacao Humana

- Arquivar tarefa.
- Deletar item de checklist.
- Alterar responsavel principal.
- Mover tarefa para status finalizado.
- Alterar mais de uma tarefa em uma mesma solicitacao.
- Criar tarefa atribuida a outra pessoa.
- Fazer comentarios em nome de usuario tecnico.

## RPCs e RLS

RPC existente:
- `public.create_task_with_assignees(...)`

Uso recomendado:
- Reutilizar essa RPC para criacao de tarefas porque ela cria tarefa, responsaveis e activity log em uma transacao.
- Manter `auth.uid()` como fonte da autoria.
- Antes de criar novas RPCs, preferir services estreitos e RLS existente.

Cuidados:
- Toda nova RPC com `security definer` deve definir `set search_path = public`.
- Toda RPC sensivel deve revogar execucao de `anon` quando nao for necessaria.
- Toda escrita operacional deve registrar activity log quando aplicavel.

## Checklist de Seguranca para as Proximas Sprints

- Validar inputs com Zod em todas as ferramentas.
- Definir limites de retorno para listas.
- Nao retornar segredos, tokens ou configuracoes internas em respostas MCP.
- Evitar logs com payload completo quando houver dados sensiveis.
- Logar acoes de escrita com ferramenta, usuario, entidade e timestamp.
- Testar com usuario sem permissao administrativa.
- Testar falta de autenticacao.
- Testar tentativa de acao proibida.
- Manter `.mcp.json`, `.env`, auth states e traces fora do Git.

## Definicao de Pronto da Sprint 0

- Token hardcoded removido do `.mcp.json` local.
- Exemplo seguro criado em `.mcp.example.json`.
- Escopo permitido/proibido documentado.
- Acoes com confirmacao humana documentadas.
- Risco de rotacao registrado.
- Roadmap atualizado.
