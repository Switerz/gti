import { describe, expect, it } from 'vitest'

import { sanitizeAuditInput } from '../src/audit'

describe('sanitizeAuditInput', () => {
  it('redacts tokens and free-text business fields', () => {
    const sanitized = sanitizeAuditInput({
      title: 'Criar tarefa sensivel',
      description: 'Detalhe operacional',
      body: 'Comentario interno',
      access_token: 'secret',
      GTI_MCP_USER_ACCESS_TOKEN: 'secret',
      taskId: '00000000-0000-0000-0000-000000000000',
    })

    expect(sanitized).toEqual({
      title: '[redacted]',
      description: '[redacted]',
      body: '[redacted]',
      access_token: '[redacted]',
      GTI_MCP_USER_ACCESS_TOKEN: '[redacted]',
      taskId: '00000000-0000-0000-0000-000000000000',
    })
  })

  it('summarizes long arrays and truncates long strings', () => {
    const sanitized = sanitizeAuditInput({
      ids: Array.from({ length: 12 }, (_, index) => index),
      note: 'a'.repeat(130),
    })

    expect(sanitized.ids).toBe('[array:12]')
    expect(String(sanitized.note)).toHaveLength(123)
    expect(String(sanitized.note).endsWith('...')).toBe(true)
  })
})
