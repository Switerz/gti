import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20240101000005_profile_security_hardening.sql',
)

describe('RLS migration hardening', () => {
  it('adds a trigger that blocks self-service profile privilege escalation', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('prevent_profile_privilege_escalation')
    expect(sql).toContain('new.role is distinct from old.role')
    expect(sql).toContain('new.active is distinct from old.active')
    expect(sql).toContain('new.email is distinct from old.email')
    expect(sql).toContain('new.id is distinct from old.id')
    expect(sql).toContain('before update on public.profiles')
  })
})
