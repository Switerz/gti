-- WITH CHECK explícito na política de UPDATE de projetos.
-- Sem WITH CHECK, o Supabase usa a expressão USING como fallback, mas
-- ao setar active=false a linha deixa de satisfazer a política de SELECT
-- (active = true), o que pode fazer o PostgREST rejeitar o UPDATE com 403.
-- A solução é separar a restrição de QUEM pode atualizar (USING)
-- da restrição sobre O RESULTADO da atualização (WITH CHECK).

drop policy if exists "Lead or admin can update projects" on public.projects;

create policy "Lead or admin can update projects"
  on public.projects for update
  using  (public.is_lead_or_admin() or created_by = auth.uid())
  with check (public.is_lead_or_admin() or created_by = auth.uid());
