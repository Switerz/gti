import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { getTaskContext, readAgentContext } from '../context.js'

export const registerContextResources = (server: McpServer) => {
  server.registerResource(
    'gti_site_context',
    'gti://context/site',
    {
      title: 'GTI site context',
      description: 'Stable context for agents working with the GTI application.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: await readAgentContext(),
        },
      ],
    }),
  )

  server.registerResource(
    'gti_tasks_context',
    'gti://context/tasks',
    {
      title: 'GTI tasks context',
      description: 'Task-specific domain rules and fields for GTI agents.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: getTaskContext(),
        },
      ],
    }),
  )
}
