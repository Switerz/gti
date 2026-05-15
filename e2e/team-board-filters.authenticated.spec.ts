import { expect, test } from '@playwright/test'

test.skip(
  !process.env.E2E_AUTH_STORAGE_STATE,
  'Requires E2E_AUTH_STORAGE_STATE pointing to a Playwright storageState JSON for an allowed Supabase user.',
)

test.use({ storageState: process.env.E2E_AUTH_STORAGE_STATE })

test('authenticated user can access team board advanced filters', async ({ page }) => {
  await page.goto('/team-board')

  await expect(page.getByRole('heading', { name: /Kanban da Equipe/i })).toBeVisible()
  await expect(page.getByPlaceholder('Buscar tarefas...')).toBeVisible()
  await expect(page.getByRole('button', { name: /Apenas minhas/i })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por prioridade' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por responsável' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por criador' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por categoria' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por projeto' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por status' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Filtrar por vencimento' })).toBeVisible()
})
