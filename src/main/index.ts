import { app, Tray, Menu, nativeImage } from 'electron'
import path from 'path'

import { createMainWindow, getMainWindow } from './windows/mainWindow'
import { createOverlayWindow, getOverlayWindow, showOverlay, toggleOverlay } from './windows/overlayWindow'
import { registerHandlers } from './ipc/handlers'
import { registerShortcuts, unregisterAll } from './shortcuts/globalShortcuts'
import { captureScreen } from './capture/screenCapture'
import { buildMessages } from './ai/promptBuilder'
import { streamResponse } from './ai/geminiClient'
import { parseFile } from './files/fileParser'
import { getStore, getPreferences } from './store/persistentStore'

let tray: Tray | null = null

function getPreloadPath(filename: string): string {
  // In dev the compiled preloads live at dist/main/preloads/<name>.js
  // In production same path relative to app.getAppPath()
  return path.join(__dirname, 'preloads', filename)
}

function getRendererURL(port: number, htmlFile: string): string {
  if (!app.isPackaged) {
    return `http://localhost:${port}`
  }
  return `file://${path.join(app.getAppPath(), 'dist', 'renderer', htmlFile)}`
}

function getOverlayURL(): string {
  if (!app.isPackaged) {
    return 'http://localhost:5174'
  }
  return `file://${path.join(app.getAppPath(), 'dist', 'overlay', 'index.html')}`
}

function createTray(): void {
  // Use an empty 16x16 image if no icon is available
  let trayIcon = nativeImage.createEmpty()
  try {
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png')
    trayIcon = nativeImage.createFromPath(iconPath)
  } catch {
    // Use empty icon as fallback
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('Cluely')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        const win = getMainWindow()
        if (win) {
          if (win.isVisible()) {
            win.hide()
          } else {
            win.show()
            win.focus()
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        // Remove close prevention so the app actually quits
        const win = getMainWindow()
        if (win) {
          win.removeAllListeners('close')
        }
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    const win = getMainWindow()
    if (win) {
      if (!win.isVisible()) {
        win.show()
      }
      win.focus()
    }
  })
}

async function onTrigger(): Promise<void> {
  // Show the overlay before streaming starts
  showOverlay()

  const overlayWin = getOverlayWindow()
  if (!overlayWin) return

  const store = getStore()
  const apiKey = store.get('geminiApiKey')

  if (!apiKey) {
    overlayWin.webContents.send('stream:error', { message: 'API key not set' })
    return
  }

  let screenshotBase64: string
  try {
    screenshotBase64 = await captureScreen()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    overlayWin.webContents.send('stream:error', { message: `Screen capture failed: ${msg}` })
    return
  }

  const systemPrompt = store.get('systemPrompt')
  const uploadedFiles = store.get('uploadedFiles')
  const parsedFileCache = store.get('parsedFileCache')

  const fileContexts = uploadedFiles
    .map((f: { hash: string; filename: string }) => {
      const content = parsedFileCache[f.hash]
      if (!content) return null
      return { filename: f.filename, content }
    })
    .filter((fc: { filename: string; content: string } | null): fc is { filename: string; content: string } => fc !== null)

  const messages = buildMessages({
    systemPrompt,
    userPrompt: '',
    screenshotBase64,
    fileContexts,
  })

  overlayWin.webContents.send('stream:clear')

  await streamResponse(
    messages,
    (token) => overlayWin.webContents.send('stream:token', { token }),
    () => overlayWin.webContents.send('stream:done'),
    (err) => overlayWin.webContents.send('stream:error', { message: err.message })
  )
}

app.whenReady().then(() => {
  const mainPreloadPath = getPreloadPath('mainPreload.js')
  const overlayPreloadPath = getPreloadPath('overlayPreload.js')

  const mainWin = createMainWindow(mainPreloadPath)
  const overlayWin = createOverlayWindow(overlayPreloadPath)

  // Load renderer content
  const mainURL = getRendererURL(5173, 'index.html')
  mainWin.loadURL(mainURL)

  const overlayURL = getOverlayURL()
  overlayWin.loadURL(overlayURL)

  // Register all IPC handlers via dependency injection
  registerHandlers({
    captureScreen,
    buildMessages,
    streamResponse,
    parseFile,
    store: getStore(),
    getOverlayWindow,
  })

  // Register global shortcuts
  registerShortcuts({
    onTrigger: () => {
      onTrigger().catch((err) => {
        console.error('onTrigger error:', err)
      })
    },
    onToggleOverlay: () => toggleOverlay(),
    getPreferences,
    mainWindow: mainWin,
  })

  createTray()
})

// Restore main window on macOS dock click
app.on('activate', () => {
  const win = getMainWindow()
  if (win) {
    win.show()
    win.focus()
  }
})

// Unregister shortcuts before quit
app.on('will-quit', () => {
  unregisterAll()
})

// macOS: handle drag-and-drop file open
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  parseFile(filePath)
    .then((fileContext) => {
      const win = getMainWindow()
      if (win) {
        win.webContents.send('file:added', fileContext)
      }
    })
    .catch((err) => {
      console.error('open-file parse error:', err)
    })
})

// Prevent default quit behavior — tray keeps app alive on non-macOS platforms
app.on('window-all-closed', () => {
  // On macOS, window-all-closed should not quit (standard behavior)
  // On Windows/Linux: do nothing here; the tray keeps the app alive
  // (Electron only auto-quits on window-all-closed on non-macOS if not prevented)
})
