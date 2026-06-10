import { describe, expect, it } from 'vitest'

// ─── slugify (mirrored from category.service) ─────────────────────────────────

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Gestão de Frotas')).toBe('gestao-de-frotas')
  })

  it('handles already-ascii names', () => {
    expect(slugify('Compliance')).toBe('compliance')
  })

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('Manutenção  Preventiva')).toBe('manutencao-preventiva')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  Backend  ')).toBe('backend')
  })

  it('handles single-word names', () => {
    expect(slugify('TI')).toBe('ti')
  })
})

// ─── permissions ──────────────────────────────────────────────────────────────

import { canManageCategories } from '@/lib/permissions'
import type { Profile } from '@/types/domain'

function profile(role: 'admin' | 'lead' | 'member'): Profile {
  return { id: 'u1', role, active: true } as Profile
}

describe('canManageCategories', () => {
  it('allows admin', () => expect(canManageCategories(profile('admin'))).toBe(true))
  it('allows lead', () => expect(canManageCategories(profile('lead'))).toBe(true))
  it('blocks member', () => expect(canManageCategories(profile('member'))).toBe(false))
  it('blocks null profile', () => expect(canManageCategories(null)).toBe(false))
})
