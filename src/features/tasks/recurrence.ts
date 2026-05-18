import { addDays, addMonths, getISOWeek, getMonth, getYear } from 'date-fns'

export type RecurrenceType = 'none' | 'weekly' | 'monthly'

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Sem recorrência',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Matches " — Sem. 22/2026" or " — Jun/2026" at end of title
const SUFFIX_RE = / — (?:Sem\. \d+|\w{3})\/\d{4}$/

export function stripRecurrenceSuffix(title: string): string {
  return title.replace(SUFFIX_RE, '').trimEnd()
}

export function generateRecurrenceSuffix(type: RecurrenceType, date = new Date()): string {
  if (type === 'weekly') {
    return ` — Sem. ${getISOWeek(date)}/${getYear(date)}`
  }
  if (type === 'monthly') {
    return ` — ${PT_MONTHS[getMonth(date)]}/${getYear(date)}`
  }
  return ''
}

export function buildRecurringTitle(title: string, type: RecurrenceType): string {
  return stripRecurrenceSuffix(title) + generateRecurrenceSuffix(type)
}

export function getNextDueDate(type: RecurrenceType, from = new Date()): string {
  if (type === 'weekly') return addDays(from, 7).toISOString().split('T')[0]
  if (type === 'monthly') return addMonths(from, 1).toISOString().split('T')[0]
  return ''
}
