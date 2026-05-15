import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'lead', 'member'])

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  role: userRoleSchema.default('member'),
  active: z.boolean().default(true),
})

export type Profile = z.infer<typeof profileSchema>
