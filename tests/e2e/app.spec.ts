import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('App launch', () => {
  test('launches without crashing and main window is visible', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: {
        ...process.env,
        ELECTRON_IS_TEST: '1',
      },
    })

    try {
      const window = await app.firstWindow()
      await window.waitForLoadState('domcontentloaded')

      const title = await window.title()
      expect(title).toBe('Cluely')

      const isVisible = await window.isVisible('body')
      expect(isVisible).toBe(true)
    } finally {
      await app.close()
    }
  })

  test('closing main window does not quit the process', async () => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), 'dist/main/index.js')],
      env: { ...process.env, ELECTRON_IS_TEST: '1' },
    })

    try {
      const window = await app.firstWindow()
      await window.waitForLoadState('domcontentloaded')

      await window.close()

      // Give it a moment
      await new Promise(resolve => setTimeout(resolve, 500))

      // App should still be running (not exited)
      const isRunning = !app.process().killed
      expect(isRunning).toBe(true)
    } finally {
      await app.close()
    }
  })
})
