# GTI MCP

Servidor MCP de dominio do GTI. Ele expoe contexto estavel do projeto e ferramentas controladas para agentes trabalharem com tarefas, projetos e dados operacionais.

## Variaveis

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
GTI_MCP_USER_ACCESS_TOKEN=
```

Tambem sao aceitas as variaveis do frontend como fallback:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`GTI_MCP_USER_ACCESS_TOKEN` deve representar uma sessao de usuario real do GTI quando ferramentas de escrita forem adicionadas.
As ferramentas de leitura do Supabase tambem usam esse token porque as policies RLS dependem de `auth.uid()`.

## Comandos

```bash
npm run mcp:build
npm run mcp:check
npm run mcp:smoke
npm run mcp:start
```

## Recursos

- `gti://context/site`
- `gti://context/tasks`

## Ferramentas atuais

- `gti_healthcheck`
- `gti_get_site_context`
- `gti_list_task_statuses`
- `gti_list_categories`
- `gti_list_projects`
- `gti_list_profiles`
- `gti_search_profiles`
- `gti_list_kpis`
- `gti_get_kpi`
- `gti_summarize_kpis_off_track`
- `gti_list_kpi_action_plans`
- `gti_list_okrs`
- `gti_list_tasks`
- `gti_search_tasks`
- `gti_get_task`
- `gti_summarize_my_tasks`
- `gti_summarize_project`
- `gti_summarize_category`
- `gti_suggest_next_actions`
- `gti_create_task`
- `gti_update_task`
- `gti_move_task_status`
- `gti_archive_task`
- `gti_add_checklist_item`
- `gti_update_checklist_item`
- `gti_toggle_checklist_item`
- `gti_delete_checklist_item`
- `gti_add_comment`

## Confirmacoes de escrita

Algumas acoes exigem flags explicitas:

- `confirmAssignedToOther=true` para criar tarefa atribuida a outra pessoa ou com assignees.
- `confirmOwnerChange=true` para trocar o responsavel principal.
- `confirmFinalize=true` para mover uma tarefa para status final.
- `confirmArchive=true` para arquivar uma tarefa.
- `confirmDelete=true` para remover item de checklist.

## Resolucao de pessoas

Use `gti_list_profiles` ou `gti_search_profiles` para encontrar `id`, `full_name`, `email`, `role` e `active` antes de atribuir tarefas.
Ferramentas de criacao/atualizacao de tarefas devem receber IDs reais retornados por essas consultas.

## Resumos operacionais

Use `gti_summarize_my_tasks`, `gti_summarize_project` e `gti_summarize_category` para obter contagens por status/prioridade, tarefas atrasadas, tarefas proximas de vencer e progresso de checklist.
Os resumos excluem tarefas arquivadas e retornam apenas top N tarefas em listas operacionais.

## Sugestoes de proximas acoes

Use `gti_suggest_next_actions` para receber sugestoes textuais baseadas em tarefas reais atrasadas, urgentes, sem responsavel, sem checklist, proximas de vencer ou paradas em status inicial.
A ferramenta e somente leitura: ela nao cria tarefas, nao move status e nao adiciona comentarios automaticamente.

## Auditoria

Ferramentas de escrita registram eventos locais em:

```txt
logs/mcp-audit.jsonl
```

O log usa `requestId` e sanitiza campos sensiveis como tokens, descricoes, titulos e comentarios.
Detalhes completos estao em `docs/mcp-permissions.md`.

## Integracao

Endpoint remoto para usuarios finais:

```txt
https://go-gti.vercel.app/api/mcp
```

Clientes MCP HTTP devem enviar `Authorization: Bearer <access_token_do_usuario>`.

Guia para Codex, Claude Desktop e prompts de teste:

```txt
docs/mcp-integration.md
docs/mcp-manual.html
```

Checklist de entrega:

```txt
docs/mcp-delivery-checklist.md
```

## Cliente MCP

Exemplo para `.mcp.json` local:

```json
{
  "mcpServers": {
    "gti": {
      "command": "node",
      "args": ["mcp/dist/server.js"],
      "env": {
        "SUPABASE_URL": "https://SEU_PROJETO.supabase.co",
        "SUPABASE_ANON_KEY": "sua_anon_key",
        "GTI_MCP_USER_ACCESS_TOKEN": "token_de_usuario"
      }
    }
  }
}
```

Nao versionar `.mcp.json` com valores reais.
