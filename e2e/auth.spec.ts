import { expect, test } from '@playwright/test'

test('redirects protected routes to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('GTI')).toBeVisible()
  await expect(page.getByText(/Acesso restrito/i)).toBeVisible()
})

test('shows the Google login action', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible()
})
