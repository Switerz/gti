import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !process.env.E2E_AUTH_STORAGE_STATE,
  workers: process.env.E2E_AUTH_STORAGE_STATE ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5175',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  },
})
