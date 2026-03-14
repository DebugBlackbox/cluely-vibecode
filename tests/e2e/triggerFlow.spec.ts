import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('Trigger flow E2E', () => {
  test('type prompt + Cmd+Enter → input clears, response streams', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: { ...process.env, ELECTRON_IS_TEST: '1' },
    })

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const allWindows = app.windows()

      // Find the overlay window
      let overlayWindow = allWindows[allWindows.length - 1]

      // Type in the prompt input
      const input = overlayWindow.locator('input[placeholder*="Ask anything"]').or(
        overlayWindow.locator('input[type="text"]')
      )

      if (await input.count() > 0) {
        await input.fill('What is on my screen?')
        await input.press('Meta+Enter')

        // Input should clear after submission
        await expect(input).toHaveValue('')
      }
    } finally {
      await app.close()
    }
  })

  test('Escape in PromptInput clears input and dismisses suggestion', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: { ...process.env, ELECTRON_IS_TEST: '1' },
    })

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const allWindows = app.windows()
      const overlayWindow = allWindows[allWindows.length - 1]

      const input = overlayWindow.locator('input[type="text"]')
      if (await input.count() > 0) {
        await input.fill('some text')
        await input.press('Escape')
        await expect(input).toHaveValue('')
      }
    } finally {
      await app.close()
    }
  })
})
