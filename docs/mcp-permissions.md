# MCP GTI - Politica de Permissao e Guardrails

Este documento registra os guardrails operacionais do MCP de dominio do GTI.

## Credenciais

- O MCP usa `SUPABASE_URL`/`SUPABASE_ANON_KEY` ou os fallbacks `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.
- Leituras e escritas de dados do GTI exigem `GTI_MCP_USER_ACCESS_TOKEN`.
- O token deve ser de uma sessao de usuario real do GTI.
- Nao usar `service_role` como credencial padrao do MCP.
- Nao versionar `.env` ou `.mcp.json`.

## Autorizacao

- A autorizacao principal continua no Supabase RLS.
- O MCP nao deve fazer autorizacao apenas por filtro client-side.
- O MCP age como o usuario de `GTI_MCP_USER_ACCESS_TOKEN`.
- Escritas devem manter autoria em `auth.uid()` ou no actor resolvido pela sessao.
- Ferramentas de perfis sao somente leitura e devem ser usadas para obter IDs reais antes de atribuir tarefas.
- `gti_suggest_next_actions` e somente leitura e nao deve executar automaticamente as sugestoes retornadas.

## Confirmacoes Obrigatorias

- Criar tarefa atribuida a outra pessoa ou com assignees: `confirmAssignedToOther=true`.
- Alterar responsavel principal: `confirmOwnerChange=true`.
- Mover tarefa para status final: `confirmFinalize=true`.
- Arquivar tarefa: `confirmArchive=true`.
- Deletar item de checklist: `confirmDelete=true`.

## Acoes Bloqueadas no MVP

- Deletar tarefas.
- Deletar comentarios.
- Deletar projetos.
- Editar allowlist.
- Editar roles.
- Alterar categorias/status globais.
- Executar SQL arbitrario.
- Contornar RLS.
- Atualizacoes em massa.

## Limites

- `gti_list_tasks`: limite padrao `20`, maximo `50`.
- `gti_search_tasks`: limite padrao `20`, maximo `50`.
- `gti_get_task`: comentarios/atividades recentes com maximo `20`.
- `gti_list_profiles`: limite padrao `20`, maximo `50`, apenas ativos por padrao.
- `gti_search_profiles`: limite padrao `20`, maximo `50`, apenas ativos por padrao.
- `gti_summarize_my_tasks`: consulta ate `200` tarefas por padrao, maximo `500`, e retorna listas com `topN` maximo `10`.
- `gti_summarize_project`: consulta ate `200` tarefas por padrao, maximo `500`, e retorna listas com `topN` maximo `10`.
- `gti_summarize_category`: consulta ate `200` tarefas por padrao, maximo `500`, e retorna listas com `topN` maximo `10`.
- `gti_suggest_next_actions`: consulta ate `200` tarefas por padrao, maximo `500`, e retorna ate `20` sugestoes.
- Comentarios: maximo `4000` caracteres.
- Titulo de tarefa: maximo `140` caracteres.
- Item de checklist: maximo `500` caracteres.
- Escritas atuais operam em uma entidade por chamada.
- `gti_archive_task` arquiva uma unica tarefa por chamada e nao aceita lotes.

## Auditoria Local

Chamadas de escrita registram eventos em:

```txt
logs/mcp-audit.jsonl
```

Cada evento inclui:
- `requestId`
- timestamp
- ferramenta
- status: `started`, `succeeded` ou `failed`
- campos de entrada sanitizados
- resumo de resultado ou erro

O log nao deve conter:
- tokens
- refresh tokens
- corpo de comentario
- titulo de tarefa/checklist
- descricao de tarefa

## Erros

Erros de ferramentas auditadas incluem o `requestId` no formato:

```txt
[requestId] mensagem do erro
```

Use esse id para correlacionar uma falha com `logs/mcp-audit.jsonl`.
