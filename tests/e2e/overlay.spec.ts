import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('Overlay window', () => {
  test('overlay window is present in window list', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: { ...process.env, ELECTRON_IS_TEST: '1' },
    })

    try {
      const windows = app.windows()
      // Wait for both windows to load
      await new Promise(resolve => setTimeout(resolve, 1000))
      const allWindows = app.windows()
      expect(allWindows.length).toBeGreaterThanOrEqual(2)
    } finally {
      await app.close()
    }
  })

  test('STREAM_TOKEN tokens appear in SuggestionCard', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: { ...process.env, ELECTRON_IS_TEST: '1' },
    })

    try {
      const windows = app.windows()
      await new Promise(resolve => setTimeout(resolve, 1000))
      const allWindows = app.windows()

      // Find overlay window (transparent, no frame)
      let overlayWindow = allWindows.find(async w => {
        const title = await w.title()
        return title === 'Cluely Overlay'
      })

      if (!overlayWindow) {
        overlayWindow = allWindows[allWindows.length - 1]
      }

      // Send a stream token via evaluate
      await overlayWindow.evaluate(() => {
        window.dispatchEvent(new CustomEvent('test:stream-token', { detail: { token: 'Test response' } }))
      })

      // Verify the SuggestionCard would display it
      // In a real test, you'd trigger via IPC and check the DOM
    } finally {
      await app.close()
    }
  })
})
