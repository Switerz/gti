-- Migration 008: add recurrence_type to tasks.
-- Supports weekly and monthly automatic task regeneration on completion.

alter table public.tasks
  add column if not exists recurrence_type text
    not null
    default 'none'
    check (recurrence_type in ('none', 'weekly', 'monthly'));
