# MCP GTI - Matriz de Permissoes por Papel

Sprint MCP 17 prepara a validacao real de comportamento com usuarios `member`, `lead` e `admin`.

## Como Rodar

Compile o MCP:

```powershell
npm run mcp:build
```

Configure tokens de sessoes reais e curtas no `.env` local:

```env
GTI_MCP_MEMBER_ACCESS_TOKEN=
GTI_MCP_LEAD_ACCESS_TOKEN=
GTI_MCP_ADMIN_ACCESS_TOKEN=
```

Rode a matriz:

```powershell
npm run mcp:permissions
```

Por padrao, o script executa somente leituras. Para validar escritas reais em tarefas de teste:

```env
GTI_MCP_PERMISSION_TEST_WRITES=true
GTI_MCP_PERMISSION_TEST_OTHER_PROFILE_ID=
```

Use `GTI_MCP_PERMISSION_TEST_WRITES=true` somente em ambiente controlado.

## Cobertura

Leituras por papel:
- `gti_healthcheck`
- `gti_list_profiles`
- `gti_list_tasks`
- `gti_summarize_my_tasks`
- `gti_list_kpis`
- `gti_list_okrs`

Escritas opcionais por papel:
- criar tarefa para si
- adicionar checklist em tarefa de teste
- adicionar comentario em tarefa de teste
- arquivar tarefa de teste
- criar tarefa atribuida a outro perfil, se `GTI_MCP_PERMISSION_TEST_OTHER_PROFILE_ID` estiver definido

## Matriz Esperada

| Acao | member | lead | admin |
| --- | --- | --- | --- |
| Ler contexto/listas permitidas | permitido | permitido | permitido |
| Criar tarefa para si | permitido | permitido | permitido |
| Criar tarefa para outro perfil com confirmacao | depende de RLS real | depende de RLS real | depende de RLS real |
| Atualizar tarefa relacionada | permitido | permitido | permitido |
| Atualizar tarefa nao relacionada | bloqueado | permitido pela policy atual | permitido |
| Comentarios/checklist em tarefa editavel | permitido | permitido | permitido |
| Arquivar tarefa relacionada | permitido | permitido se criador/responsavel/assignee; admin sempre | permitido |
| Ler KPIs/OKRs | permitido | permitido | permitido |

## Status Atual

Estrutura de validacao criada localmente.

Validacao real com `member`, `lead` e `admin` ainda depende de tokens validos para cada papel.
