import { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null

export function createMainWindow(preloadPath: string): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    resizable: true,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      nodeIntegration: false,
    },
  })

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools()

  // Hide to tray on close instead of quitting
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
