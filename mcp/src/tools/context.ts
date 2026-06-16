import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { getTaskContext, readAgentContext } from '../context.js'

const SiteContextOutputSchema = z.object({
  siteContext: z.string(),
  taskContext: z.string(),
  resources: z.array(z.string()),
})

export const registerContextTools = (server: McpServer) => {
  server.registerTool(
    'gti_get_site_context',
    {
      title: 'Get GTI site context',
      description: 'Returns stable GTI domain context for agents before taking action.',
      outputSchema: SiteContextOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const structuredContent = {
        siteContext: await readAgentContext(),
        taskContext: getTaskContext(),
        resources: ['gti://context/site', 'gti://context/tasks'],
      }

      return {
        structuredContent,
        content: [
          {
            type: 'text',
            text: JSON.stringify(structuredContent, null, 2),
          },
        ],
      }
    },
  )
}
