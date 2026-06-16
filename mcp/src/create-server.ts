import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { GtiMcpConfig } from './config.js'
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

export const createGtiMcpServer = (config: GtiMcpConfig) => {
  const server = new McpServer(
    {
      name: 'gti-mcp',
      version: '0.2.0',
    },
    {
      instructions:
        'Use the GTI tools to read and update tasks, projects, KPIs, and OKRs. Respect user intent, summarize before risky writes, and never expose bearer tokens or secrets.',
    },
  )

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

  return server
}
