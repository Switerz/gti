-- archive_project: função SECURITY DEFINER que contorna o check de visibilidade
-- do RLS SELECT ao fazer soft-delete (active = false).
-- O problema: setar active=false torna a linha invisível via SELECT policy
-- ("active users can read active projects"), e o PostgreSQL rejeita a UPDATE
-- com "new row violates row-level security policy".
-- A solução correta é rodar o UPDATE como o owner do banco (SECURITY DEFINER),
-- contornando o check de visibilidade pós-update.

create or replace function public.archive_project(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_lead_or_admin()
    or exists (select 1 from public.projects where id = p_id and created_by = auth.uid())
  ) then
    raise exception 'insufficient privileges to archive project';
  end if;

  update public.projects
  set active = false, updated_at = now()
  where id = p_id;
end;
$$;

revoke execute on function public.archive_project(uuid) from public;
grant  execute on function public.archive_project(uuid) to authenticated;
