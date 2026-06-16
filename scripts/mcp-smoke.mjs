import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const expectedTools = [
  'gti_get_site_context',
  'gti_healthcheck',
  'gti_list_task_statuses',
  'gti_list_categories',
  'gti_list_projects',
  'gti_list_profiles',
  'gti_search_profiles',
  'gti_list_tasks',
  'gti_search_tasks',
  'gti_get_task',
  'gti_summarize_my_tasks',
  'gti_summarize_project',
  'gti_summarize_category',
  'gti_suggest_next_actions',
  'gti_create_task',
  'gti_update_task',
  'gti_move_task_status',
  'gti_archive_task',
  'gti_add_checklist_item',
  'gti_update_checklist_item',
  'gti_toggle_checklist_item',
  'gti_delete_checklist_item',
  'gti_add_comment',
]

const expectedResources = ['gti://context/site', 'gti://context/tasks']

const fail = (message) => {
  console.error(message)
  process.exitCode = 1
}

const client = new Client({ name: 'gti-mcp-smoke', version: '0.1.0' })
const transport = new StdioClientTransport({
  command: 'node',
  args: ['mcp/dist/server.js'],
  cwd: process.cwd(),
  stderr: 'pipe',
})

try {
  await client.connect(transport)

  const [toolsResult, resourcesResult, healthcheckResult, siteContext, tasksContext] =
    await Promise.all([
      client.listTools(),
      client.listResources(),
      client.callTool({ name: 'gti_healthcheck', arguments: {} }),
      client.readResource({ uri: 'gti://context/site' }),
      client.readResource({ uri: 'gti://context/tasks' }),
    ])

  const tools = toolsResult.tools.map((tool) => tool.name).sort()
  const resources = resourcesResult.resources.map((resource) => resource.uri).sort()

  const missingTools = expectedTools.filter((tool) => !tools.includes(tool))
  const missingResources = expectedResources.filter((resource) => !resources.includes(resource))

  if (missingTools.length > 0) fail(`Missing MCP tools: ${missingTools.join(', ')}`)
  if (missingResources.length > 0) fail(`Missing MCP resources: ${missingResources.join(', ')}`)

  const healthcheck = healthcheckResult.structuredContent ?? {}
  if (healthcheck.service !== 'gti-mcp') fail('Unexpected healthcheck service.')
  if (siteContext.contents[0]?.text?.length < 1000) fail('Site context resource looks too small.')
  if (tasksContext.contents[0]?.text?.length < 300) fail('Tasks context resource looks too small.')

  console.log(
    JSON.stringify(
      {
        ok: process.exitCode !== 1,
        tools: tools.length,
        resources: resources.length,
        healthcheck: {
          service: healthcheck.service,
          version: healthcheck.version,
          config: healthcheck.config,
        },
      },
      null,
      2,
    ),
  )
} finally {
  await client.close()
}
