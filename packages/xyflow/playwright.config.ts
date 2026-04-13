import { defineConfig } from '@playwright/test'

const port = Number(process.env.PORT) || 3099

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `bun run e2e/serve.ts`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
})
