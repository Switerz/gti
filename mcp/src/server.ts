import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { getConfig } from './config.js'
import { registerContextResources } from './resources/context.js'
import { registerContextTools } from './tools/context.js'
import { registerHealthcheckTool } from './tools/healthcheck.js'
import { registerKpiOkrTools } from './tools/kpis-okrs.js'
import { registerReferenceDataTools } from './tools/reference-data.js'
import { registerTaskCollaborationTools } from './tools/task-collaboration.js'
import { registerTaskNextActionTools } from './tools/task-next-actions.js'
import { registerTaskReadTools } from './tools/tasks.js'
import { registerTaskSummaryTools } from './tools/task-summaries.js'
import { registerTaskWriteTools } from './tools/task-writes.js'

const config = getConfig()

const server = new McpServer({
  name: 'gti-mcp',
  version: '0.1.0',
})

registerContextResources(server)
registerContextTools(server)
registerHealthcheckTool(server, config)
registerReferenceDataTools(server, config)
registerKpiOkrTools(server, config)
registerTaskReadTools(server, config)
registerTaskSummaryTools(server, config)
registerTaskNextActionTools(server, config)
registerTaskWriteTools(server, config)
registerTaskCollaborationTools(server, config)

const transport = new StdioServerTransport()

try {
  await server.connect(transport)
} catch (error) {
  console.error('[gti-mcp] failed to start', error)
  process.exit(1)
}
