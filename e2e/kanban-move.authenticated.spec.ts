import { expect, test } from '@playwright/test'

test.skip(
  !process.env.E2E_AUTH_STORAGE_STATE,
  'Requires E2E_AUTH_STORAGE_STATE pointing to a Playwright storageState JSON for an allowed Supabase user.',
)

test.use({ storageState: process.env.E2E_AUTH_STORAGE_STATE })

test('authenticated user can access the personal kanban for drag and drop validation', async ({ page }) => {
  await page.goto('/my-board')

  await expect(page.getByRole('heading', { name: /Meu Kanban/i })).toBeVisible()
  await expect(page.getByText(/A Fazer|Backlog|Em andamento/i).first()).toBeVisible()
})
