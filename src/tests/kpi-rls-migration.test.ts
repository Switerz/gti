import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20240101000024_allow_active_members_edit_kpis.sql',
)

describe('KPI RLS permissions', () => {
  it('allows active members through the shared KPI edit helper', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('create or replace function public.can_edit_kpi(kpi_id uuid)')
    expect(sql).toContain('select public.is_active_user()')
    expect(sql).toContain('revoke execute on function public.can_edit_kpi(uuid) from anon')
    expect(sql).toContain('grant execute on function public.can_edit_kpi(uuid) to authenticated')
  })
})
