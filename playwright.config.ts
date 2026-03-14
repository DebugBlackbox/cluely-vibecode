import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    headless: false,
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Playwright electron tests launch the app themselves
      },
    },
  ],
})
