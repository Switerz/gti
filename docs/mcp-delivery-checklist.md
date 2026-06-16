# MCP GTI - Checklist de Entrega

Este checklist resume o estado minimo para operar o MCP do GTI com seguranca.

## Build e Validacao

Comandos recomendados antes de usar em fluxo real:

```powershell
npm run mcp:build
npm run mcp:smoke
npm run test
npm run lint
npm run build
```

Atalho para o MCP:

```powershell
npm run mcp:check
```

## Configuracao Local

- `.env` existe localmente e nao e versionado.
- `.mcp.json` existe localmente e nao e versionado.
- `.mcp.example.json` nao contem valores reais.
- `VITE_SUPABASE_URL` ou `SUPABASE_URL` esta configurado.
- `VITE_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY` esta configurado.
- `GTI_MCP_USER_ACCESS_TOKEN` esta configurado quando leituras/escritas reais forem testadas.
- `SUPABASE_ACCESS_TOKEN` so e necessario para o MCP oficial do Supabase.

## Smoke Test Esperado

`npm run mcp:smoke` deve retornar:

```json
{
  "ok": true,
  "tools": 23,
  "resources": 2
}
```

Para uso completo com banco:

```json
{
  "hasUserAccessToken": true,
  "isReadyForReads": true,
  "isReadyForUserScopedWrites": true
}
```

## Ferramentas Disponiveis

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

## Guardrails

- Escritas operam em uma entidade por chamada.
- Tarefas arquivadas ficam fora das listas por padrao.
- Perfis inativos ficam fora de `gti_list_profiles` e `gti_search_profiles` por padrao.
- Atribuicoes devem usar IDs reais retornados por `gti_list_profiles` ou `gti_search_profiles`.
- Resumos operacionais excluem arquivadas e limitam listas de tarefas por `topN`.
- Sugestoes de proximas acoes sao somente leitura e citam IDs reais de tarefas.
- Mover para status final exige `confirmFinalize=true`.
- Trocar responsavel principal exige `confirmOwnerChange=true`.
- Criar tarefa para outra pessoa ou com assignees exige `confirmAssignedToOther=true`.
- Arquivar tarefa exige `confirmArchive=true`.
- Deletar item de checklist exige `confirmDelete=true`.
- Nao ha ferramenta para deletar tarefa, deletar comentario, editar allowlist, editar roles ou executar SQL arbitrario.

## Auditoria

- Escritas registram eventos em `logs/mcp-audit.jsonl`.
- Logs incluem `requestId`, ferramenta, status e resumo sanitizado.
- Logs nao devem conter tokens, titulos, descricoes ou corpos de comentario.
- `logs/` fica ignorado pelo Git.

## Teste Controlado Recomendado

1. Rodar `npm run mcp:check`.
2. Chamar `gti_healthcheck`.
3. Chamar `gti_list_task_statuses`.
4. Chamar `gti_list_profiles` com `limit: 5`.
5. Chamar `gti_search_profiles` por nome ou email conhecido.
6. Chamar `gti_summarize_my_tasks` com `topN: 3`.
7. Chamar `gti_suggest_next_actions` com `maxSuggestions: 3`.
8. Chamar `gti_list_tasks` com `limit: 5`.
9. Criar ou escolher uma tarefa de teste.
10. Chamar `gti_add_checklist_item`.
11. Chamar `gti_add_comment`.
12. Chamar `gti_archive_task` somente em tarefa de teste, com `confirmArchive=true`.
13. Conferir a tarefa no GTI.
14. Conferir `logs/mcp-audit.jsonl`.
