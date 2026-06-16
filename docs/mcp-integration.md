# MCP GTI - Integracao com Codex e Claude

Este guia mostra como conectar o MCP de dominio do GTI em clientes MCP locais.

## Pre-requisitos

Compile o servidor:

```powershell
npm run mcp:build
```

Rode o smoke test:

```powershell
npm run mcp:smoke
```

O smoke test valida:
- servidor inicia via stdio
- ferramentas registradas
- recursos `gti://context/site` e `gti://context/tasks`
- `gti_healthcheck`

Ele nao faz escrita no Supabase.

## Variaveis

O MCP carrega `.env` local automaticamente quando iniciado a partir da raiz do projeto.

Obrigatorias para contexto local:
- nenhuma

Obrigatorias para leitura/escrita no Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GTI_MCP_USER_ACCESS_TOKEN=
```

Tambem pode usar:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
GTI_MCP_USER_ACCESS_TOKEN=
```

`GTI_MCP_USER_ACCESS_TOKEN` deve ser um access token de usuario logado no GTI. Nao use `refresh_token`.

## Codex

O arquivo local `.mcp.json` na raiz do projeto ja deve conter:

```json
{
  "mcpServers": {
    "gti": {
      "command": "node",
      "args": ["mcp/dist/server.js"]
    }
  }
}
```

Como o servidor carrega `.env`, nao e necessario colocar tokens no `.mcp.json`.

Fluxo recomendado:
1. Atualize `.env` com `GTI_MCP_USER_ACCESS_TOKEN` quando for testar dados reais.
2. Rode `npm run mcp:build`.
3. Rode `npm run mcp:smoke`.
4. Reinicie o cliente MCP se ele ja estava aberto.
5. Peca ao agente para chamar `gti_healthcheck`.

## Claude Desktop

Use caminho absoluto para evitar problemas de diretório de trabalho. Exemplo:

```json
{
  "mcpServers": {
    "gti": {
      "command": "node",
      "args": ["C:\\Users\\Notebook\\Desktop\\gti\\mcp\\dist\\server.js"],
      "env": {
        "VITE_SUPABASE_URL": "https://SEU_PROJETO.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "sua_anon_key",
        "GTI_MCP_USER_ACCESS_TOKEN": "access_token_do_usuario"
      }
    }
  }
}
```

Nao inclua `SUPABASE_ACCESS_TOKEN` aqui, a menos que tambem esteja configurando o MCP oficial do Supabase.

## Prompts de Teste

Contexto:

```text
Use o MCP do GTI e leia o contexto do site antes de responder.
```

Healthcheck:

```text
Chame gti_healthcheck e me diga se o MCP esta pronto para leituras do Supabase.
```

Listas de referencia:

```text
Liste os status, categorias e projetos disponiveis no GTI. Nao invente IDs.
```

Tarefas urgentes:

```text
Liste minhas tarefas urgentes abertas no GTI. Traga titulo, status, projeto, prazo e progresso de checklist.
```

Resumo operacional:

```text
Resuma minhas tarefas no GTI. Traga contagens por status/prioridade, tarefas atrasadas, proximas de vencer e progresso medio de checklist.
```

Resumo de projeto:

```text
Resuma o projeto <projectId> no GTI. Destaque status, prioridades, atrasos, proximos vencimentos e progresso de checklist.
```

Proximas acoes:

```text
Sugira proximas acoes para minhas tarefas no GTI. Use apenas tarefas reais, cite os IDs e explique o criterio usado. Nao crie tarefas, nao mova status e nao comente automaticamente.
```

KPIs fora da meta:

```text
Liste os KPIs fora da meta na semana atual e destaque quais estao sem valor informado.
```

OKRs:

```text
Liste os OKRs do GTI com progresso por objetivo, key result e marcos.
```

Busca:

```text
Procure tarefas com "transportadora" no titulo e resuma as 10 primeiras.
```

Detalhe:

```text
Abra a tarefa <id> e resuma descricao, responsaveis, checklist, comentarios recentes e atividade recente.
```

Criacao:

```text
Crie uma tarefa no GTI com titulo "...", prioridade medium, status <statusId> e projeto <projectId>. Antes, confirme que os IDs existem.
```

Checklist:

```text
Adicione os seguintes itens de checklist na tarefa <id>: ...
```

Comentario:

```text
Adicione um comentario na tarefa <id> dizendo: ...
```

## Fluxo Completo de Teste

1. `gti_get_site_context`
2. `gti_healthcheck`
3. `gti_list_task_statuses`
4. `gti_list_projects`
5. `gti_summarize_my_tasks`
6. `gti_suggest_next_actions`
7. `gti_summarize_kpis_off_track`
8. `gti_list_okrs`
9. `gti_list_tasks`
10. `gti_get_task`
11. `gti_add_checklist_item`
12. `gti_add_comment`

Para os passos 11 e 12, use uma tarefa de teste e confira `logs/mcp-audit.jsonl`.

## Troubleshooting

Erro: `GTI_MCP_USER_ACCESS_TOKEN is required`

Solucao:
- copie o `access_token` de uma sessao logada no GTI
- adicione em `.env`
- reinicie o cliente MCP

Erro: `Authenticated GTI user not found`

Possiveis causas:
- token expirado
- token de outro projeto Supabase
- usuario fora da allowlist
- usuario sem profile ativo

Erro: ferramenta de escrita pede confirmacao

Solucao:
- repita a chamada com a flag exigida, por exemplo `confirmFinalize=true`
- use a flag somente quando o usuario humano tiver confirmado a acao

## Guardrails

Consulte `docs/mcp-permissions.md` para permissoes, limites e auditoria.
