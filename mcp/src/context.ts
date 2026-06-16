import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const agentContextPath = resolve(process.cwd(), 'docs', 'agent-context.md')

export const readAgentContext = async () => readFile(agentContextPath, 'utf8')

export const getTaskContext = () => `# GTI - Contexto de Tarefas

Tarefas sao a entidade operacional principal do GTI.

Campos principais:
- id
- title
- description
- status_id
- category_id
- project_id
- creator_id
- owner_id
- priority
- due_date
- start_date
- completed_at
- position
- is_archived
- recurrence_type
- estimated_hours
- actual_hours

Relacionamentos importantes:
- status: task_statuses
- category: categories
- project: projects
- creator: profiles
- owner: profiles
- assignees: task_assignees + profiles
- comments: task_comments
- checklist: task_checklist_items
- activity: task_activity_logs

Regras:
- Nao listar arquivadas por padrao.
- Nao inventar status, categoria, projeto ou profile.
- Preferir a RPC create_task_with_assignees para criacao completa.
- Toda escrita operacional deve respeitar RLS e registrar activity log quando aplicavel.
`
