import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { getConfig } from './config.js'
import { createGtiMcpServer } from './create-server.js'

const config = getConfig()
const server = createGtiMcpServer(config)
const transport = new StdioServerTransport()

try {
  await server.connect(transport)
} catch (error) {
  console.error('[gti-mcp] failed to start', error)
  process.exit(1)
}
