-- Allow lead and admin to manage categories (previously admin-only)
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Lead or admin can manage categories"
  on public.categories for all
  using (public.is_lead_or_admin())
  with check (public.is_lead_or_admin());
