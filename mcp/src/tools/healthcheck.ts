import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { getConfigStatus, type GtiMcpConfig } from '../config.js'

const HealthcheckOutputSchema = z.object({
  ok: z.boolean(),
  service: z.literal('gti-mcp'),
  version: z.string(),
  config: z.object({
    hasSupabaseUrl: z.boolean(),
    hasSupabaseAnonKey: z.boolean(),
    hasUserAccessToken: z.boolean(),
    isReadyForReads: z.boolean(),
    isReadyForUserScopedWrites: z.boolean(),
  }),
})

export const registerHealthcheckTool = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_healthcheck',
    {
      title: 'GTI MCP healthcheck',
      description: 'Checks whether the GTI MCP server is running and whether required env vars are present.',
      outputSchema: HealthcheckOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const structuredContent = {
        ok: true,
        service: 'gti-mcp' as const,
        version: '0.1.0',
        config: getConfigStatus(config),
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
