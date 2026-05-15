import { describe, expect, it } from 'vitest'

import { formatDate, isPastDue } from '@/lib/dates'

// ─── isPastDue ────────────────────────────────────────────────────────────────

describe('isPastDue', () => {
  it('returns false when dueDate is null', () => {
    expect(isPastDue(null)).toBe(false)
  })

  it('returns false when dueDate is undefined', () => {
    expect(isPastDue(undefined)).toBe(false)
  })

  it('returns false when task is in a final status', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    expect(isPastDue(yesterday, true, false)).toBe(false)
  })

  it('returns false when task is archived', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    expect(isPastDue(yesterday, false, true)).toBe(false)
  })

  it('returns true for a past due date on an active task', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    expect(isPastDue(yesterday, false, false)).toBe(true)
  })

  it('returns false for a future due date', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    expect(isPastDue(tomorrow, false, false)).toBe(false)
  })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "Sem prazo" for null input', () => {
    expect(formatDate(null)).toBe('Sem prazo')
  })

  it('returns "Sem prazo" for undefined input', () => {
    expect(formatDate(undefined)).toBe('Sem prazo')
  })

  it('formats a valid ISO date string', () => {
    const result = formatDate('2025-01-15')
    expect(result).toBe('15 de jan')
  })
})

// ─── Role helpers (pure logic) ────────────────────────────────────────────────

describe('role permission logic', () => {
  type Role = 'admin' | 'lead' | 'member'

  function isAdmin(role: Role) {
    return role === 'admin'
  }

  function isLeadOrAdmin(role: Role) {
    return role === 'admin' || role === 'lead'
  }

  function canManageAllowlist(role: Role) {
    return isAdmin(role)
  }

  function canViewAllTasks(role: Role) {
    return isLeadOrAdmin(role)
  }

  it('admin can manage allowlist', () => {
    expect(canManageAllowlist('admin')).toBe(true)
    expect(canManageAllowlist('lead')).toBe(false)
    expect(canManageAllowlist('member')).toBe(false)
  })

  it('only lead and admin can view all tasks', () => {
    expect(canViewAllTasks('admin')).toBe(true)
    expect(canViewAllTasks('lead')).toBe(true)
    expect(canViewAllTasks('member')).toBe(false)
  })

  it('isAdmin is exclusive to admin role', () => {
    expect(isAdmin('admin')).toBe(true)
    expect(isAdmin('lead')).toBe(false)
    expect(isAdmin('member')).toBe(false)
  })
})
