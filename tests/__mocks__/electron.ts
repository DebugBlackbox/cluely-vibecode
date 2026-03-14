import { vi } from 'vitest'

// Mock NativeImage
const mockNativeImage = {
  toPNG: vi.fn(() => Buffer.from('fake-png-data')),
  toDataURL: vi.fn(() => 'data:image/png;base64,ZmFrZS1wbmctZGF0YQ=='),
  toBitmap: vi.fn(() => Buffer.from('fake-bitmap')),
  getSize: vi.fn(() => ({ width: 1920, height: 1080 })),
  resize: vi.fn(function (this: any) { return this }),
  isEmpty: vi.fn(() => false),
}

// Mock desktopCapturer
export const desktopCapturer = {
  getSources: vi.fn(async () => [
    {
      id: 'screen:0',
      name: 'Entire Screen',
      thumbnail: mockNativeImage,
      display_id: '1',
      appIcon: null,
    },
  ]),
}

// Mock nativeImage
export const nativeImage = {
  createFromBuffer: vi.fn(() => mockNativeImage),
  createEmpty: vi.fn(() => mockNativeImage),
  createFromPath: vi.fn(() => mockNativeImage),
  createFromDataURL: vi.fn(() => mockNativeImage),
}

// Mock ipcMain
const ipcMainHandlers: Record<string, Function> = {}
const ipcMainListeners: Record<string, Function[]> = {}

export const ipcMain = {
  handle: vi.fn((channel: string, handler: Function) => {
    ipcMainHandlers[channel] = handler
  }),
  on: vi.fn((channel: string, listener: Function) => {
    if (!ipcMainListeners[channel]) ipcMainListeners[channel] = []
    ipcMainListeners[channel].push(listener)
  }),
  removeAllListeners: vi.fn(),
  // Helper for tests
  _getHandler: (channel: string) => ipcMainHandlers[channel],
  _getListeners: (channel: string) => ipcMainListeners[channel] || [],
  _emit: (channel: string, event: any, ...args: any[]) => {
    const handler = ipcMainHandlers[channel]
    if (handler) return handler(event, ...args)
  },
}

// Mock ipcRenderer
export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  removeListener: vi.fn(),
}

// Mock webContents
const mockWebContents = {
  send: vi.fn(),
  executeJavaScript: vi.fn(),
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
}

// Mock BrowserWindow
export class BrowserWindow {
  static getAllWindows = vi.fn(() => [])
  static getFocusedWindow = vi.fn(() => null)

  webContents = mockWebContents
  id = 1

  loadURL = vi.fn()
  loadFile = vi.fn()
  show = vi.fn()
  hide = vi.fn()
  focus = vi.fn()
  close = vi.fn()
  destroy = vi.fn()
  isDestroyed = vi.fn(() => false)
  isVisible = vi.fn(() => true)
  setPosition = vi.fn()
  getPosition = vi.fn(() => [100, 100])
  setSize = vi.fn()
  getSize = vi.fn(() => [480, 600])
  setAlwaysOnTop = vi.fn()
  setIgnoreMouseEvents = vi.fn()
  setFocusable = vi.fn()
  setContentProtection = vi.fn()
  setSkipTaskbar = vi.fn()
  on = vi.fn()
  once = vi.fn()
  removeAllListeners = vi.fn()
  emit = vi.fn()

  constructor(_options?: any) {}
}

// Mock app
export const app = {
  whenReady: vi.fn(() => Promise.resolve()),
  quit: vi.fn(),
  exit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  isPackaged: false,
  getPath: vi.fn((name: string) => `/mock/user/data/${name}`),
  getName: vi.fn(() => 'Cluely'),
  getVersion: vi.fn(() => '1.0.0'),
  dock: {
    hide: vi.fn(),
    show: vi.fn(),
    setIcon: vi.fn(),
  },
}

// Mock screen
export const screen = {
  getPrimaryDisplay: vi.fn(() => ({
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1,
  })),
  getAllDisplays: vi.fn(() => []),
}

// Mock globalShortcut
export const globalShortcut = {
  register: vi.fn(() => true),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
  isRegistered: vi.fn(() => false),
}

// Mock Tray
export class Tray {
  setToolTip = vi.fn()
  setContextMenu = vi.fn()
  on = vi.fn()
  destroy = vi.fn()

  constructor(_icon?: any) {}
}

// Mock Menu
export const Menu = {
  buildFromTemplate: vi.fn((template: any[]) => ({ template })),
  setApplicationMenu: vi.fn(),
}

// Mock dialog
export const dialog = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  showMessageBox: vi.fn(),
  showErrorBox: vi.fn(),
}

// Mock shell
export const shell = {
  openExternal: vi.fn(),
  openPath: vi.fn(),
}

// Mock contextBridge
export const contextBridge = {
  exposeInMainWorld: vi.fn(),
}

// Default export for CJS-style imports
export default {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  desktopCapturer,
  nativeImage,
  screen,
  globalShortcut,
  Tray,
  Menu,
  dialog,
  shell,
  contextBridge,
}
