import { expect, test } from '@playwright/test'

test.skip(
  !process.env.E2E_AUTH_STORAGE_STATE,
  'Requires E2E_AUTH_STORAGE_STATE pointing to a Playwright storageState JSON for an allowed Supabase user.',
)

test.use({ storageState: process.env.E2E_AUTH_STORAGE_STATE })

test('authenticated user can open the task creation flow', async ({ page }) => {
  await page.goto('/tasks')

  await expect(page.getByRole('heading', { name: /Lista de Tarefas/i })).toBeVisible()

  await page.getByRole('button', { name: /Nova tarefa/i }).click()

  await expect(page.getByRole('heading', { name: /Nova tarefa/i })).toBeVisible()
  await expect(page.getByLabel(/Titulo|Título/i)).toBeVisible()
})
