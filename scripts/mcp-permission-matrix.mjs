import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loadLocalEnv = () => {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue
    const name = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[name] ??= value
  }
}

loadLocalEnv()

const roles = [
  ['member', process.env.GTI_MCP_MEMBER_ACCESS_TOKEN],
  ['lead', process.env.GTI_MCP_LEAD_ACCESS_TOKEN],
  ['admin', process.env.GTI_MCP_ADMIN_ACCESS_TOKEN],
]

const writesEnabled = process.env.GTI_MCP_PERMISSION_TEST_WRITES === 'true'
const otherProfileId = process.env.GTI_MCP_PERMISSION_TEST_OTHER_PROFILE_ID

const unwrap = (result) => result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? '{}')

const runTool = async (client, name, args = {}) => {
  try {
    const result = unwrap(await client.callTool({ name, arguments: args }))
    return { ok: true, result }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const connectForRole = async (role, token) => {
  const client = new Client({ name: `gti-mcp-permissions-${role}`, version: '0.1.0' })
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp/dist/server.js'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      GTI_MCP_USER_ACCESS_TOKEN: token,
    },
    stderr: 'pipe',
  })

  await client.connect(transport)
  return client
}

const runReadChecks = async (client) => ({
  healthcheck: await runTool(client, 'gti_healthcheck'),
  listProfiles: await runTool(client, 'gti_list_profiles', { limit: 3 }),
  listTasks: await runTool(client, 'gti_list_tasks', { limit: 5 }),
  summarizeMyTasks: await runTool(client, 'gti_summarize_my_tasks', { topN: 3, fetchLimit: 50 }),
  listKpis: await runTool(client, 'gti_list_kpis', { limit: 5 }),
  listOkrs: await runTool(client, 'gti_list_okrs', {}),
})

const runWriteChecks = async (client, role) => {
  if (!writesEnabled) return { skipped: true, reason: 'Set GTI_MCP_PERMISSION_TEST_WRITES=true to run real writes.' }

  const statuses = await runTool(client, 'gti_list_task_statuses')
  if (!statuses.ok) return { setup: statuses }

  const status = statuses.result.taskStatuses?.find((item) => !item.is_final)
  if (!status) return { setup: { ok: false, error: 'No non-final task status found.' } }

  const title = `[TESTE MCP PERMISSOES] ${role} ${new Date().toISOString()}`
  const createSelf = await runTool(client, 'gti_create_task', {
    title,
    statusId: status.id,
    priority: 'low',
  })

  const taskId = createSelf.result?.task?.id
  const collaboration = taskId
    ? {
        addChecklist: await runTool(client, 'gti_add_checklist_item', {
          taskId,
          title: 'Validar permissao de checklist',
        }),
        addComment: await runTool(client, 'gti_add_comment', {
          taskId,
          body: 'Validacao automatizada de permissao MCP.',
        }),
        archive: await runTool(client, 'gti_archive_task', {
          id: taskId,
          confirmArchive: true,
        }),
      }
    : { skipped: true, reason: 'Task creation failed.' }

  const createForOther = otherProfileId
    ? await runTool(client, 'gti_create_task', {
        title: `${title} para outro perfil`,
        statusId: status.id,
        ownerId: otherProfileId,
        priority: 'low',
        confirmAssignedToOther: true,
      })
    : { skipped: true, reason: 'Set GTI_MCP_PERMISSION_TEST_OTHER_PROFILE_ID to test assigned-to-other creation.' }

  return { createSelf, collaboration, createForOther }
}

const main = async () => {
  const matrix = []

  for (const [role, token] of roles) {
    if (!token) {
      matrix.push({ role, skipped: true, reason: `Missing GTI_MCP_${role.toUpperCase()}_ACCESS_TOKEN.` })
      continue
    }

    const client = await connectForRole(role, token)
    try {
      matrix.push({
        role,
        skipped: false,
        reads: await runReadChecks(client),
        writes: await runWriteChecks(client, role),
      })
    } finally {
      await client.close()
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        writesEnabled,
        generatedAt: new Date().toISOString(),
        matrix,
      },
      null,
      2,
    ),
  )
}

await main()
