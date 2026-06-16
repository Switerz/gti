import type { IncomingMessage, ServerResponse } from 'node:http'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { createGtiMcpServer } from '../mcp/src/create-server.js'
import type { GtiMcpConfig } from '../mcp/src/config.js'

type VercelRequest = IncomingMessage & {
  body?: unknown
  method?: string
}

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse
  json: (body: unknown) => void
}

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

const getBearerToken = (authorizationHeader: string | string[] | undefined) => {
  const value = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader
  const match = value?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim()
}

const sendJson = (res: VercelResponse, statusCode: number, body: unknown) => {
  res.status(statusCode).json(body)
}

const sendUnauthorized = (res: VercelResponse) => {
  res.setHeader('WWW-Authenticate', 'Bearer realm="GTI MCP"')
  sendJson(res, 401, {
    error: 'unauthorized',
    message: 'Authorization: Bearer <GTI access token> is required.',
  })
}

const buildConfig = (userAccessToken: string): GtiMcpConfig => ({
  supabaseUrl: readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL') ?? '',
  supabaseAnonKey: readEnv('SUPABASE_ANON_KEY') ?? readEnv('VITE_SUPABASE_ANON_KEY') ?? '',
  userAccessToken,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    sendJson(res, 405, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    })
    return
  }

  const bearerToken = getBearerToken(req.headers.authorization)
  if (!bearerToken) {
    sendUnauthorized(res)
    return
  }

  const server = createGtiMcpServer(buildConfig(bearerToken))
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  })

  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('[gti-mcp-http] request failed', error)
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error.',
        },
        id: null,
      })
    }
  } finally {
    await transport.close()
    await server.close()
  }
}
