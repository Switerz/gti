import { randomUUID } from 'node:crypto'
import { mkdir, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const auditLogPath = resolve(process.cwd(), 'logs', 'mcp-audit.jsonl')
const sensitiveKeys = new Set([
  'body',
  'description',
  'title',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
])

type AuditStatus = 'started' | 'succeeded' | 'failed'

type AuditRecord = {
  requestId: string
  timestamp: string
  tool: string
  status: AuditStatus
  input?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
}

const redactValue = (key: string, value: unknown): unknown => {
  if (sensitiveKeys.has(key) || key.toLowerCase().includes('token')) return '[redacted]'
  if (Array.isArray(value)) return value.length <= 10 ? value : `[array:${value.length}]`
  if (typeof value === 'string' && value.length > 120) return `${value.slice(0, 120)}...`
  return value
}

export const sanitizeAuditInput = (input: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactValue(key, value)]))

const appendAuditRecord = async (record: AuditRecord) => {
  await mkdir(resolve(process.cwd(), 'logs'), { recursive: true })
  await appendFile(auditLogPath, `${JSON.stringify(record)}\n`, 'utf8')
}

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

export const startAudit = async (tool: string, input: Record<string, unknown>) => {
  const requestId = randomUUID()

  await appendAuditRecord({
    requestId,
    timestamp: new Date().toISOString(),
    tool,
    status: 'started',
    input: sanitizeAuditInput(input),
  })

  return {
    requestId,
    async success(result?: Record<string, unknown>) {
      await appendAuditRecord({
        requestId,
        timestamp: new Date().toISOString(),
        tool,
        status: 'succeeded',
        result,
      })
    },
    async failure(error: unknown) {
      await appendAuditRecord({
        requestId,
        timestamp: new Date().toISOString(),
        tool,
        status: 'failed',
        error: toErrorMessage(error),
      })
    },
    error(error: unknown) {
      return new Error(`[${requestId}] ${toErrorMessage(error)}`)
    },
  }
}
