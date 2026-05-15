import { describe, expect, it } from 'vitest'

import { formatDateTime, formatRelative } from '@/lib/dates'

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('returns "—" for null', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('formats a valid ISO datetime string with date and time', () => {
    // 2025-03-15T14:30:00.000Z → "15/03/25 às 14:30" (UTC; test env is local but we pin the date)
    const result = formatDateTime('2025-03-15T00:00:00.000Z')
    // verify the structural shape: two digits / two digits / two digits
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{2} às \d{2}:\d{2}/)
  })

  it('includes the literal "às" separator', () => {
    expect(formatDateTime('2025-06-01T10:20:00.000Z')).toContain(' às ')
  })
})

// ─── formatRelative ───────────────────────────────────────────────────────────

describe('formatRelative', () => {
  it('returns "—" for null', () => {
    expect(formatRelative(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatRelative(undefined)).toBe('—')
  })

  it('returns a non-empty relative string for a recent timestamp', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const result = formatRelative(fiveMinutesAgo)
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('—')
  })

  it('adds a temporal suffix for past dates (ptBR "há" prefix)', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelative(oneDayAgo)
    // date-fns ptBR adds "há X" prefix for past dates
    expect(result).toMatch(/há/)
  })
})
