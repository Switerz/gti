import type { ComponentType } from 'react'

import type { Database } from './database.types'

// ─── Primitive domain types ───────────────────────────────────────────────────

export type UserRole = 'admin' | 'lead' | 'member'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type { RecurrenceType } from '@/features/tasks/recurrence'
export type TaskActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'assignee_added'
  | 'assignee_removed'
  | 'comment_added'
  | 'checklist_item_done'
  | 'task_archived'
  | 'task_deleted'

// ─── Table row types (direct DB shapes) ──────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type AllowedEmail = Database['public']['Tables']['allowed_emails']['Row']
export type TaskStatus = Database['public']['Tables']['task_statuses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskAssignee = Database['public']['Tables']['task_assignees']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type TaskChecklistItem = Database['public']['Tables']['task_checklist_items']['Row']
export type TaskActivityLog = Database['public']['Tables']['task_activity_logs']['Row']
export type KpiGroup = Database['public']['Tables']['kpi_groups']['Row']
export type Kpi = Database['public']['Tables']['kpis']['Row']
export type KpiAssignment = Database['public']['Tables']['kpi_assignments']['Row']
export type KpiWeeklyValue = Database['public']['Tables']['kpi_weekly_values']['Row']
export type KpiActionPlan = Database['public']['Tables']['kpi_action_plans']['Row']
export type KpiOffender = Database['public']['Tables']['kpi_offenders']['Row']
export type KpiComment = Database['public']['Tables']['kpi_comments']['Row']
export type KpiActivityLog = Database['public']['Tables']['kpi_activity_logs']['Row']

// ─── Composite / relational types ────────────────────────────────────────────

export type ProfileSummary = Pick<Profile, 'id' | 'full_name' | 'avatar_url'>

export type TaskWithRelations = Task & {
  status: Pick<TaskStatus, 'id' | 'name' | 'slug' | 'color' | 'is_final'>
  category: Pick<Category, 'id' | 'name' | 'color'> | null
  project: Pick<Project, 'id' | 'name'> | null
  creator: ProfileSummary | null
  owner: ProfileSummary | null
  assignees: Array<{ profile: ProfileSummary }>
  _comments: Array<{ id: string }>
  _checklist: Array<{ id: string; is_done: boolean; title: string; position: number }>
}

// Convenience helpers derived from TaskWithRelations
export type CommentCount = TaskWithRelations['_comments']['length']
export type ChecklistProgress = { done: number; total: number }

export type CommentWithAuthor = TaskComment & {
  author: ProfileSummary | null
}

export type ActivityLogWithActor = TaskActivityLog & {
  actor: ProfileSummary | null
}

// ─── Form types ───────────────────────────────────────────────────────────────

export type { TaskFormValues } from '@/schemas/task.schema'

export type ProjectWithCategory = Project & {
  category: Pick<Category, 'id' | 'name' | 'color'> | null
}

// ─── OKR types ───────────────────────────────────────────────────────────────

export type OkrObjective = Database['public']['Tables']['okr_objectives']['Row']
export type OkrKeyResult = Database['public']['Tables']['okr_key_results']['Row']
export type OkrMilestone = Database['public']['Tables']['okr_milestones']['Row']

export type OkrKeyResultWithMilestones = OkrKeyResult & {
  milestones: OkrMilestone[]
}

export type OkrObjectiveWithKRs = OkrObjective & {
  key_results: OkrKeyResultWithMilestones[]
}

// ─── KPI types ───────────────────────────────────────────────────────────────

export type KpiTargetOperator = 'gte' | 'lte' | 'eq' | 'informational'
export type KpiFormatKind = 'percent' | 'number' | 'integer' | 'days' | 'currency' | 'text'
export type KpiStatus = 'on_track' | 'off_track' | 'neutral' | 'missing'
export type KpiChartType = 'line' | 'bar' | 'none'
export type KpiActionPlanStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'cancelled'
export type KpiActivityAction =
  | 'kpi_created'
  | 'kpi_updated'
  | 'weekly_value_created'
  | 'weekly_value_updated'
  | 'action_plan_created'
  | 'action_plan_updated'
  | 'offender_created'
  | 'offender_updated'
  | 'comment_added'
  | 'kpi_archived'

export type KpiWithRelations = Kpi & {
  group: Pick<KpiGroup, 'id' | 'name' | 'slug' | 'position'> | null
  category: Pick<Category, 'id' | 'name' | 'color'> | null
  project: Pick<Project, 'id' | 'name'> | null
  owner: ProfileSummary | null
  created_by_profile: ProfileSummary | null
  assignments: Array<{ profile: ProfileSummary }>
  weekly_values: KpiWeeklyValue[]
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type NavigationItem = {
  title: string
  shortTitle?: string
  href: string
  icon: ComponentType<{ className?: string }>
}
