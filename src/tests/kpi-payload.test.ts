import { describe, expect, it } from 'vitest'

import {
  buildCreateKpiPayload,
  buildUpdateKpiPayload,
  buildKpiAssignmentRows,
  buildWeeklyValuePayload,
  diffKpiAssignmentIds,
  slugifyKpiName,
} from '@/features/kpis/kpi-payload'
import type { Kpi } from '@/types/domain'

describe('kpi payloads', () => {
  it('slugifies KPI names', () => {
    expect(slugifyKpiName('SLA B2C — Ápice')).toBe('sla-b2c-apice')
  })

  it('builds create payload with visual percent scale', () => {
    const payload = buildCreateKpiPayload(
      {
        name: 'SLA Cliente',
        description: '',
        groupId: 'group-1',
        product: 'Gocase e Gobeaute',
        ownerId: 'owner-1',
        ownerLabel: '',
        assigneeIds: [],
        categoryId: '',
        projectId: '',
        formatKind: 'percent',
        decimalPlaces: 1,
        targetOperator: 'gte',
        targetValue: 93,
        targetLabel: '>= 93%',
        unitLabel: '%',
        chartType: 'line',
      },
      'creator-1',
    )

    expect(payload).toMatchObject({
      name: 'SLA Cliente',
      slug: 'sla-cliente',
      target_value: 93,
      target_operator: 'gte',
      format_kind: 'percent',
      created_by: 'creator-1',
    })
  })

  it('does not change the internal slug when updating the KPI name', () => {
    const payload = buildUpdateKpiPayload({ name: 'SLA Site (venda)' })

    expect(payload).toEqual({ name: 'SLA Site (venda)' })
  })

  it('builds unique assignment rows with owner included', () => {
    expect(
      buildKpiAssignmentRows({
        kpiId: 'kpi-1',
        actorId: 'actor-1',
        ownerId: 'owner-1',
        assigneeIds: ['owner-1', 'user-2'],
      }),
    ).toEqual([
      { kpi_id: 'kpi-1', profile_id: 'owner-1', assigned_by: 'actor-1' },
      { kpi_id: 'kpi-1', profile_id: 'user-2', assigned_by: 'actor-1' },
    ])
  })

  it('diffs assignment ids', () => {
    expect(diffKpiAssignmentIds(['a', 'b'], ['b', 'c'])).toEqual({
      added: ['c'],
      removed: ['a'],
    })
  })

  it('builds weekly value payload with target snapshot and status', () => {
    const kpi = {
      target_value: 96,
      target_operator: 'gte',
      format_kind: 'percent',
    } as Kpi

    const payload = buildWeeklyValuePayload(
      {
        kpiId: 'kpi-1',
        isoYear: 2026,
        isoWeek: 20,
        weekStart: '2026-05-11',
        weekEnd: '2026-05-17',
        value: 95,
        valueText: '',
        notes: 'queda pontual',
      },
      kpi,
      'user-1',
    )

    expect(payload).toMatchObject({
      kpi_id: 'kpi-1',
      target_value_snapshot: 96,
      target_operator_snapshot: 'gte',
      status: 'off_track',
      created_by: 'user-1',
      updated_by: 'user-1',
    })
  })

  it('marks textual weekly values as neutral when text is present', () => {
    const kpi = {
      target_value: null,
      target_operator: 'informational',
      format_kind: 'text',
    } as Kpi

    const payload = buildWeeklyValuePayload(
      {
        kpiId: 'kpi-1',
        isoYear: 2026,
        isoWeek: 20,
        weekStart: '2026-05-11',
        weekEnd: '2026-05-17',
        valueText: 'Sem desvio relevante',
      },
      kpi,
      'user-1',
    )

    expect(payload).toMatchObject({
      value: null,
      value_text: 'Sem desvio relevante',
      status: 'neutral',
    })
  })
})
