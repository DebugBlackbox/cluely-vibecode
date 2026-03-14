import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import crypto from 'crypto'
import pathMod from 'path'
import type { FileContext } from '../../shared/types'
import { IPC } from '../../shared/constants'
import type { getStore } from '../store/persistentStore'

type Store = ReturnType<typeof getStore>

interface HandlerDeps {
  captureScreen: () => Promise<string>
  buildMessages: (params: {
    systemPrompt: string
    userPrompt: string
    screenshotBase64: string
    fileContexts: FileContext[]
  }) => any[]
  streamResponse: (
    msgs: any[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ) => Promise<void>
  parseFile: (filePath: string) => Promise<FileContext>
  store: Store
  getOverlayWindow: () => BrowserWindow | null
}

export function registerHandlers(deps: HandlerDeps): void {
  const { captureScreen, buildMessages, streamResponse, parseFile, store, getOverlayWindow } = deps

  // --- TRIGGER ---
  ipcMain.handle(IPC.TRIGGER, async (_event, payload: { userPrompt: string }) => {
    const apiKey = store.get('geminiApiKey')

    if (!apiKey) {
      const overlayWin = getOverlayWindow()
      overlayWin?.webContents.send(IPC.STREAM_ERROR, { message: 'API key not set' })
      return
    }

    let screenshotBase64: string
    try {
      screenshotBase64 = await captureScreen()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const overlayWin = getOverlayWindow()
      overlayWin?.webContents.send(IPC.STREAM_ERROR, { message: `Screen capture failed: ${msg}` })
      return
    }

    const systemPrompt = store.get('systemPrompt')
    const uploadedFiles: Array<{ path: string; filename: string; hash: string; contentPreview: string; addedAt: string }> =
      store.get('uploadedFiles')
    const parsedFileCache: Record<string, string> = store.get('parsedFileCache')

    // Build FileContext from uploaded files using cached parsed content
    const fileContexts: FileContext[] = uploadedFiles
      .map((f) => {
        const content = parsedFileCache[f.hash]
        if (!content) return null
        return { filename: f.filename, content }
      })
      .filter((fc): fc is FileContext => fc !== null)

    const messages = buildMessages({
      systemPrompt,
      userPrompt: payload?.userPrompt ?? '',
      screenshotBase64,
      fileContexts,
    })

    const overlayWin = getOverlayWindow()

    // Clear previous response before starting new one
    overlayWin?.webContents.send(IPC.STREAM_CLEAR)

    await streamResponse(
      messages,
      (token: string) => {
        overlayWin?.webContents.send(IPC.STREAM_TOKEN, { token })
      },
      () => {
        overlayWin?.webContents.send(IPC.STREAM_DONE)
      },
      (err: Error) => {
        overlayWin?.webContents.send(IPC.STREAM_ERROR, { message: err.message })
      }
    )
  })

  // --- ADD_FILE ---
  ipcMain.handle(IPC.ADD_FILE, async (_event, payload: { filePath: string }) => {
    const buffer = fs.readFileSync(payload.filePath)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const fileContext = await parseFile(payload.filePath)

    const uploadedFiles: Array<{ path: string; filename: string; hash: string; contentPreview: string; addedAt: string }> =
      store.get('uploadedFiles')

    // Avoid duplicates
    const exists = uploadedFiles.some((f) => f.hash === hash)
    if (!exists) {
      const newFile = {
        path: payload.filePath,
        filename: pathMod.basename(payload.filePath),
        hash,
        contentPreview: fileContext.content.slice(0, 100),
        addedAt: new Date().toISOString(),
      }
      store.set('uploadedFiles', [...uploadedFiles, newFile])
    }

    return fileContext
  })

  // --- REMOVE_FILE ---
  ipcMain.handle(IPC.REMOVE_FILE, (_event, payload: { hash: string }) => {
    const uploadedFiles: Array<{ path: string; filename: string; hash: string; contentPreview: string; addedAt: string }> =
      store.get('uploadedFiles')
    store.set(
      'uploadedFiles',
      uploadedFiles.filter((f) => f.hash !== payload.hash)
    )
  })

  // --- GET_FILES ---
  ipcMain.handle(IPC.GET_FILES, () => {
    return store.get('uploadedFiles')
  })

  // --- GET_SETTINGS ---
  ipcMain.handle(IPC.GET_SETTINGS, () => {
    return {
      geminiApiKey: store.get('geminiApiKey'),
      systemPrompt: store.get('systemPrompt'),
      uploadedFiles: store.get('uploadedFiles'),
      preferences: store.get('preferences'),
    }
  })

  // --- SAVE_SETTINGS ---
  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial: {
    geminiApiKey?: string
    systemPrompt?: string
    preferences?: Partial<import('../../shared/types').Preferences>
  }) => {
    if (partial.geminiApiKey !== undefined) {
      store.set('geminiApiKey', partial.geminiApiKey)
    }
    if (partial.systemPrompt !== undefined) {
      store.set('systemPrompt', partial.systemPrompt)
    }
    if (partial.preferences !== undefined) {
      const current = store.get('preferences')
      store.set('preferences', { ...current, ...partial.preferences })
    }
  })

  // --- OVERLAY_DRAG ---
  ipcMain.on(IPC.OVERLAY_DRAG, (_event, payload: { deltaX: number; deltaY: number }) => {
    const overlayWin = getOverlayWindow()
    if (!overlayWin) return

    const [currentX, currentY] = overlayWin.getPosition()
    const newX = currentX + payload.deltaX
    const newY = currentY + payload.deltaY
    overlayWin.setPosition(newX, newY)
    store.set('overlayPosition', { x: newX, y: newY })
  })

  // --- OVERLAY_MOUSE_ENTER ---
  ipcMain.on(IPC.OVERLAY_MOUSE_ENTER, () => {
    const overlayWin = getOverlayWindow()
    if (!overlayWin) return
    overlayWin.setIgnoreMouseEvents(false)
    overlayWin.setFocusable(true)
    overlayWin.focus()
  })

  // --- OVERLAY_MOUSE_LEAVE ---
  ipcMain.on(IPC.OVERLAY_MOUSE_LEAVE, () => {
    const overlayWin = getOverlayWindow()
    if (!overlayWin) return
    overlayWin.setFocusable(false)
    overlayWin.setIgnoreMouseEvents(true, { forward: true })
  })
}
