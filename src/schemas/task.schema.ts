import { z } from 'zod'

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(140, 'Use até 140 caracteres.'),
  description: z.string().trim().max(4000).optional(),
  statusId: z.string().min(1, 'Selecione um status.'),
  ownerId: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  projectId: z.string().optional(),
  priority: taskPrioritySchema.default('medium'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
