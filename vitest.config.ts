import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['tests/e2e/**', 'node_modules/**'],
    alias: {
      electron: path.resolve('./tests/__mocks__/electron.ts'),
      '@shared': path.resolve('./src/shared'),
    },
    setupFiles: [],
  },
  resolve: {
    alias: {
      electron: path.resolve('./tests/__mocks__/electron.ts'),
      '@shared': path.resolve('./src/shared'),
    },
  },
})
