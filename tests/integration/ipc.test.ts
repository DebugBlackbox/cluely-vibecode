import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

vi.mock('electron', () => import('../__mocks__/electron'))
vi.mock('electron-store', () => {
  const storeData = new Map<string, any>([
    ['geminiApiKey', 'test-key-123'],
    ['systemPrompt', 'Test system prompt'],
    ['uploadedFiles', []],
    ['parsedFileCache', {}],
    ['overlayPosition', null],
    ['preferences', {
      triggerShortcut: 'CommandOrControl+Return',
      toggleShortcut: 'CommandOrControl+Shift+Space',
      autoDismissMs: 0,
      overlayOpacity: 0.95,
    }],
  ])
  return {
    default: class MockStore {
      get(key: string) { return storeData.get(key) }
      set(key: string, val: any) { storeData.set(key, val) }
    }
  }
})

describe('IPC handlers', () => {
  let mockDeps: any
  let mockOverlayWindow: any
  const tempFiles: string[] = []

  afterEach(() => {
    for (const f of tempFiles) {
      try { fs.unlinkSync(f) } catch { /* ignore */ }
    }
    tempFiles.length = 0
  })

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockOverlayWindow = {
      webContents: { send: vi.fn() },
      setIgnoreMouseEvents: vi.fn(),
      setFocusable: vi.fn(),
      focus: vi.fn(),
      getPosition: vi.fn(() => [100, 100]),
      setPosition: vi.fn(),
    }

    mockDeps = {
      captureScreen: vi.fn().mockResolvedValue('base64screenshot'),
      buildMessages: vi.fn().mockReturnValue([{ role: 'user', parts: [{ text: 'test' }] }]),
      streamResponse: vi.fn().mockImplementation(async (_msgs: any, onToken: any, onDone: any) => {
        onToken('Hello')
        onToken(' world')
        onDone()
      }),
      parseFile: vi.fn().mockImplementation(async (fp: string) => ({
        filename: path.basename(fp),
        content: 'parsed content',
      })),
      getOverlayWindow: vi.fn(() => mockOverlayWindow),
    }
  })

  it('ADD_FILE: calls parseFile and returns FileContext', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')

    const store = (await import('../../src/main/store/persistentStore')).getStore()
    registerHandlers({ ...mockDeps, store })

    // Need a real file so handlers.ts can readFileSync it for hashing
    const tmpPath = path.join(os.tmpdir(), `ipc-test-${Date.now()}.txt`)
    fs.writeFileSync(tmpPath, 'test content for ipc handler')
    tempFiles.push(tmpPath)

    const handler = (ipcMain as any)._getHandler('files:add')
    expect(handler).toBeTruthy()

    const result = await handler({}, { filePath: tmpPath })

    expect(mockDeps.parseFile).toHaveBeenCalledWith(tmpPath)
    expect(result).toMatchObject({ filename: path.basename(tmpPath), content: 'parsed content' })
  })

  it('REMOVE_FILE: removes file from store by hash', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    // Pre-add a file
    store.set('uploadedFiles', [{
      path: '/fake/test.txt',
      filename: 'test.txt',
      hash: 'abc123',
      contentPreview: 'parsed',
      addedAt: new Date().toISOString(),
    }])

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('files:remove')
    await handler({}, { hash: 'abc123' })

    const files = store.get('uploadedFiles')
    expect(files.find((f: any) => f.hash === 'abc123')).toBeUndefined()
  })

  it('GET_FILES: returns uploadedFiles from store', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    const mockFiles = [{ path: '/fake/a.txt', filename: 'a.txt', hash: 'h1', contentPreview: 'x', addedAt: '2024-01-01' }]
    store.set('uploadedFiles', mockFiles)

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('files:get')
    const result = await handler({})

    expect(result).toEqual(mockFiles)
  })

  it('GET_SETTINGS: returns settings from store', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('settings:get')
    const result = await handler({})

    expect(result).toHaveProperty('geminiApiKey')
    expect(result).toHaveProperty('systemPrompt')
    expect(result).toHaveProperty('uploadedFiles')
    expect(result).toHaveProperty('preferences')
  })

  it('SAVE_SETTINGS: merges partial settings into store', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('settings:save')
    await handler({}, { systemPrompt: 'New prompt', geminiApiKey: 'new-key' })

    expect(store.get('systemPrompt')).toBe('New prompt')
    expect(store.get('geminiApiKey')).toBe('new-key')
  })

  it('TRIGGER with no API key sends STREAM_ERROR', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    store.set('geminiApiKey', '')

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: 'test' })

    expect(mockOverlayWindow.webContents.send).toHaveBeenCalledWith(
      'stream:error',
      expect.objectContaining({ message: expect.stringMatching(/api key/i) })
    )
    expect(mockDeps.captureScreen).not.toHaveBeenCalled()
  })

  it('TRIGGER with API key calls captureScreen, buildMessages, streamResponse', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    store.set('geminiApiKey', 'test-key-123')

    registerHandlers({ ...mockDeps, store })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: 'hello' })

    expect(mockDeps.captureScreen).toHaveBeenCalledOnce()
    expect(mockDeps.buildMessages).toHaveBeenCalledOnce()
    expect(mockDeps.streamResponse).toHaveBeenCalledOnce()
  })
})
