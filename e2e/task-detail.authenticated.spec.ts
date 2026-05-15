import fs from 'node:fs'

import { expect, type Page, test } from '@playwright/test'

test.skip(
  !process.env.E2E_AUTH_STORAGE_STATE,
  'Requires E2E_AUTH_STORAGE_STATE pointing to a Playwright storageState JSON for an allowed Supabase user.',
)

test.use({ storageState: process.env.E2E_AUTH_STORAGE_STATE })

function readLocalEnv(name: string) {
  const localEnv = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''
  const match = localEnv.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return process.env[name] ?? match?.[1]?.trim()
}

async function createSeedTaskInBrowser(page: Page, title: string) {
  const supabaseUrl = readLocalEnv('VITE_SUPABASE_URL')
  const anonKey = readLocalEnv('VITE_SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase env vars')

  return page.evaluate(
    async ({ title, supabaseUrl, anonKey }) => {
      const authKey = Object.keys(localStorage).find((key) => key.includes('auth-token'))
      if (!authKey) throw new Error('Supabase auth token not found')

      const token = JSON.parse(localStorage.getItem(authKey) ?? '{}')
      const session = token.currentSession ?? token
      const accessToken = session.access_token
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userId = payload.sub

      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }

      const statusResponse = await fetch(`${supabaseUrl}/rest/v1/task_statuses?slug=eq.todo&select=id`, {
        headers,
      })
      if (!statusResponse.ok) throw new Error(await statusResponse.text())
      const [status] = await statusResponse.json()

      const taskResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?select=id`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          title,
          status_id: status.id,
          creator_id: userId,
          owner_id: userId,
          priority: 'medium',
        }),
      })
      if (!taskResponse.ok) throw new Error(await taskResponse.text())
      const [task] = await taskResponse.json()

      const assigneeResponse = await fetch(`${supabaseUrl}/rest/v1/task_assignees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          task_id: task.id,
          profile_id: userId,
          assigned_by: userId,
        }),
      })
      if (!assigneeResponse.ok) throw new Error(await assigneeResponse.text())

      const activityResponse = await fetch(`${supabaseUrl}/rest/v1/task_activity_logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          task_id: task.id,
          actor_id: userId,
          action: 'task_created',
        }),
      })
      if (!activityResponse.ok) throw new Error(await activityResponse.text())

      return task.id as string
    },
    { title, supabaseUrl, anonKey },
  )
}

test('authenticated user can use task detail comments checklist and archive flow', async ({ page }) => {
  const suffix = Date.now()
  const title = `E2E detalhe ${suffix}`
  const comment = `Comentario E2E ${suffix}`
  const checklistItem = `Checklist E2E ${suffix}`

  await page.goto('/tasks')
  await expect(page.getByRole('heading', { name: /Lista de Tarefas/i })).toBeVisible()
  const taskId = await createSeedTaskInBrowser(page, title)

  await page.goto(`/tasks/${taskId}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByPlaceholder(/Escreva/i).fill(comment)
  await page.getByRole('button', { name: /Comentar/i }).click()
  await expect(page.getByText(comment)).toBeVisible()

  await page.getByRole('button', { name: /Adicionar/i }).click()
  await page.getByPlaceholder('Novo item...').fill(checklistItem)
  await page.getByRole('button', { name: /Salvar/i }).click()
  await expect(page.getByText(checklistItem)).toBeVisible()

  await page.getByRole('checkbox', { name: checklistItem }).click()
  await expect(page.getByText(/marcou item no checklist/i)).toBeVisible()

  await page.getByRole('button', { name: /Arquivar tarefa/i }).click()
  await page.getByRole('button', { name: /^Arquivar$/i }).click()

  await expect(page.getByRole('heading', { name: /Lista de Tarefas/i })).toBeVisible()
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
})
