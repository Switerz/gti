import { format, formatDistanceToNow, isBefore, parseISO, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(value?: string | null) {
  if (!value) return 'Sem prazo'
  return format(parseISO(value), "dd 'de' MMM", { locale: ptBR })
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return format(parseISO(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(value?: string | null) {
  if (!value) return '—'
  return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: ptBR })
}

export function isPastDue(dueDate?: string | null, isFinal = false, isArchived = false) {
  if (!dueDate || isFinal || isArchived) return false
  return isBefore(parseISO(dueDate), startOfToday())
}
