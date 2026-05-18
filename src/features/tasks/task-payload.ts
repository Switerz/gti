import type { TaskFormValues, TaskStatus, TaskWithRelations } from '@/types/domain'

export function getCreateTaskDefaults(currentProfileId: string, statuses: TaskStatus[]): TaskFormValues {
  const initialStatus =
    statuses.find((status) => status.slug === 'todo') ??
    statuses.find((status) => status.slug !== 'archived')

  return {
    title: '',
    description: '',
    statusId: initialStatus?.id ?? '',
    ownerId: currentProfileId,
    assigneeIds: [],
    priority: 'medium',
    categoryId: '',
    projectId: '',
    startDate: '',
    dueDate: '',
    recurrenceType: 'none',
  }
}

export function buildEditTaskDefaults(task: TaskWithRelations): TaskFormValues {
  const assigneeProfileIds = task.assignees.map((a) => a.profile.id)
  return {
    title: task.title,
    description: task.description ?? '',
    statusId: task.status_id,
    ownerId: task.owner_id ?? '',
    assigneeIds: assigneeProfileIds.filter((id) => id !== task.owner_id),
    categoryId: task.category_id ?? '',
    projectId: task.project_id ?? '',
    priority: task.priority,
    startDate: task.start_date ?? '',
    dueDate: task.due_date ?? '',
    recurrenceType: (task.recurrence_type as TaskFormValues['recurrenceType']) ?? 'none',
  }
}

export function buildDuplicateTaskDefaults(task: TaskWithRelations): TaskFormValues {
  const assigneeProfileIds = task.assignees.map((a) => a.profile.id)
  return {
    title: `Cópia de: ${task.title}`,
    description: task.description ?? '',
    statusId: task.status_id,
    ownerId: task.owner_id ?? '',
    assigneeIds: assigneeProfileIds.filter((id) => id !== task.owner_id),
    categoryId: task.category_id ?? '',
    projectId: task.project_id ?? '',
    priority: task.priority,
    startDate: '',
    dueDate: '',
    recurrenceType: (task.recurrence_type as TaskFormValues['recurrenceType']) ?? 'none',
  }
}

export function buildCreateTaskPayload(values: TaskFormValues, creatorId: string) {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || null,
    status_id: values.statusId,
    category_id: values.categoryId || null,
    project_id: values.projectId || null,
    creator_id: creatorId,
    owner_id: values.ownerId || creatorId,
    priority: values.priority,
    due_date: values.dueDate || null,
    start_date: values.startDate || null,
    recurrence_type: values.recurrenceType ?? 'none',
  }
}

export function buildUpdateTaskPayload(
  values: Partial<TaskFormValues>,
  status?: Pick<TaskStatus, 'id' | 'is_final'> | null,
  now = new Date().toISOString(),
) {
  const updatePayload: Record<string, unknown> = {}

  if (values.title !== undefined) updatePayload.title = values.title.trim()
  if (values.description !== undefined) updatePayload.description = values.description?.trim() || null
  if (values.statusId !== undefined) {
    updatePayload.status_id = values.statusId
    updatePayload.completed_at = status?.is_final ? now : null
  }
  if (values.categoryId !== undefined) updatePayload.category_id = values.categoryId || null
  if (values.projectId !== undefined) updatePayload.project_id = values.projectId || null
  if (values.ownerId !== undefined) updatePayload.owner_id = values.ownerId || null
  if (values.priority !== undefined) updatePayload.priority = values.priority
  if (values.dueDate !== undefined) updatePayload.due_date = values.dueDate || null
  if (values.startDate !== undefined) updatePayload.start_date = values.startDate || null
  if (values.recurrenceType !== undefined) updatePayload.recurrence_type = values.recurrenceType

  return updatePayload
}

export function buildTaskAssigneeRows({
  taskId,
  actorId,
  ownerId,
  assigneeIds = [],
}: {
  taskId: string
  actorId: string
  ownerId: string
  assigneeIds?: string[]
}) {
  return Array.from(new Set([ownerId, ...assigneeIds].filter(Boolean))).map((profileId) => ({
    task_id: taskId,
    profile_id: profileId,
    assigned_by: actorId,
  }))
}
