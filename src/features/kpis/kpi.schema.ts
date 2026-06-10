import { z } from 'zod'

export const kpiTargetOperatorSchema = z.enum(['gte', 'lte', 'eq', 'informational'])
export const kpiFormatKindSchema = z.enum(['percent', 'number', 'integer', 'days', 'currency', 'text'])
export const kpiChartTypeSchema = z.enum(['line', 'bar', 'none'])
export const kpiActionPlanStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
])

export const kpiFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe um nome.').max(160, 'Use até 160 caracteres.'),
    description: z.string().trim().max(4000).optional(),
    groupId: z.string().min(1, 'Selecione um grupo.'),
    product: z.string().trim().max(120).optional(),
    ownerId: z.string().optional(),
    ownerLabel: z.string().trim().max(160).optional(),
    assigneeIds: z.array(z.string()).default([]),
    categoryId: z.string().optional(),
    projectId: z.string().optional(),
    formatKind: kpiFormatKindSchema.default('number'),
    decimalPlaces: z.coerce.number().int().min(0).max(6).default(1),
    targetOperator: kpiTargetOperatorSchema.default('informational'),
    targetValue: z.coerce.number().optional(),
    targetLabel: z.string().trim().max(80).optional(),
    unitLabel: z.string().trim().max(40).optional(),
    chartType: kpiChartTypeSchema.default('line'),
  })
  .superRefine((values, ctx) => {
    if (values.targetOperator !== 'informational' && values.targetValue == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetValue'],
        message: 'Informe a meta numérica.',
      })
    }
  })

export const kpiWeeklyValueSchema = z.object({
  kpiId: z.string().min(1),
  isoYear: z.coerce.number().int().min(2000).max(2100),
  isoWeek: z.coerce.number().int().min(1).max(53),
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
  value: z.coerce.number().optional(),
  valueText: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(4000).optional(),
})

export const kpiActionPlanSchema = z.object({
  kpiId: z.string().min(1),
  kpiWeeklyValueId: z.string().optional(),
  restrictionText: z.string().trim().max(4000).optional(),
  actionText: z.string().trim().max(4000).optional(),
  dueDate: z.string().optional(),
  status: kpiActionPlanStatusSchema.default('in_progress'),
  ownerId: z.string().optional(),
  position: z.coerce.number().int().min(0).default(0),
})

export const kpiOffenderSchema = z.object({
  kpiId: z.string().min(1),
  kpiWeeklyValueId: z.string().optional(),
  label: z.string().trim().min(1, 'Informe o ofensor.').max(160),
  impactValue: z.coerce.number(),
  impactLabel: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  position: z.coerce.number().int().min(0).default(0),
})

export type KpiFormValues = z.infer<typeof kpiFormSchema>
export type KpiWeeklyValueFormValues = z.infer<typeof kpiWeeklyValueSchema>
export type KpiActionPlanFormValues = z.infer<typeof kpiActionPlanSchema>
export type KpiOffenderFormValues = z.infer<typeof kpiOffenderSchema>
