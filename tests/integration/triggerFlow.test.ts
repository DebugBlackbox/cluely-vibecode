import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => import('../__mocks__/electron'))
vi.mock('electron-store', () => {
  let storeData: Record<string, any> = {
    geminiApiKey: 'valid-api-key',
    systemPrompt: 'Test system prompt',
    uploadedFiles: [],
    parsedFileCache: {},
    overlayPosition: null,
    preferences: {
      triggerShortcut: 'CommandOrControl+Return',
      toggleShortcut: 'CommandOrControl+Shift+Space',
      autoDismissMs: 0,
      overlayOpacity: 0.95,
    },
  }
  return {
    default: class MockStore {
      get(key: string) { return storeData[key] }
      set(key: string, val: any) { storeData[key] = val }
    }
  }
})

describe('Trigger flow (Cmd+Enter → screenshot → Gemini → overlay)', () => {
  let captureScreen: ReturnType<typeof vi.fn>
  let buildMessages: ReturnType<typeof vi.fn>
  let streamResponse: ReturnType<typeof vi.fn>
  let mockOverlayWindow: any
  let tokens: string[]

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    tokens = []
    captureScreen = vi.fn().mockResolvedValue('mock-base64-screenshot')
    buildMessages = vi.fn().mockReturnValue([{ role: 'user', parts: [{ text: 'test' }] }])
    streamResponse = vi.fn().mockImplementation(
      async (_msgs: any, onToken: Function, onDone: Function) => {
        onToken('Token1')
        onToken('Token2')
        onToken('Token3')
        onDone()
      }
    )

    mockOverlayWindow = {
      webContents: { send: vi.fn() },
      setIgnoreMouseEvents: vi.fn(),
      setFocusable: vi.fn(),
      focus: vi.fn(),
      getPosition: vi.fn(() => [100, 100]),
      setPosition: vi.fn(),
    }
  })

  it('captureScreen is called exactly once on TRIGGER', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({
      captureScreen,
      buildMessages,
      streamResponse,
      parseFile: vi.fn(),
      store,
      getOverlayWindow: () => mockOverlayWindow,
    })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: '' })

    expect(captureScreen).toHaveBeenCalledOnce()
  })

  it('buildMessages called with screenshot, userPrompt, systemPrompt, and file contexts from store', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({
      captureScreen,
      buildMessages,
      streamResponse,
      parseFile: vi.fn(),
      store,
      getOverlayWindow: () => mockOverlayWindow,
    })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: 'my question' })

    expect(buildMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        screenshotBase64: 'mock-base64-screenshot',
        userPrompt: 'my question',
        systemPrompt: 'Test system prompt',
      })
    )
  })

  it('each token is forwarded via webContents.send(STREAM_TOKEN)', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({
      captureScreen,
      buildMessages,
      streamResponse,
      parseFile: vi.fn(),
      store,
      getOverlayWindow: () => mockOverlayWindow,
    })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: '' })

    expect(mockOverlayWindow.webContents.send).toHaveBeenCalledWith('stream:token', { token: 'Token1' })
    expect(mockOverlayWindow.webContents.send).toHaveBeenCalledWith('stream:token', { token: 'Token2' })
    expect(mockOverlayWindow.webContents.send).toHaveBeenCalledWith('stream:token', { token: 'Token3' })
  })

  it('STREAM_DONE is sent after all tokens', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    registerHandlers({
      captureScreen,
      buildMessages,
      streamResponse,
      parseFile: vi.fn(),
      store,
      getOverlayWindow: () => mockOverlayWindow,
    })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: '' })

    const calls = mockOverlayWindow.webContents.send.mock.calls
    const doneCall = calls.find((c: any[]) => c[0] === 'stream:done')
    const tokenCalls = calls.filter((c: any[]) => c[0] === 'stream:token')

    expect(doneCall).toBeTruthy()
    // Done should come after all tokens
    expect(calls.indexOf(doneCall)).toBeGreaterThan(calls.indexOf(tokenCalls[tokenCalls.length - 1]))
  })

  it('captureScreen throws → STREAM_ERROR sent to overlay', async () => {
    const { ipcMain } = await import('electron')
    const { registerHandlers } = await import('../../src/main/ipc/handlers')
    const store = (await import('../../src/main/store/persistentStore')).getStore()

    captureScreen.mockRejectedValueOnce(new Error('Screen capture failed'))

    registerHandlers({
      captureScreen,
      buildMessages,
      streamResponse,
      parseFile: vi.fn(),
      store,
      getOverlayWindow: () => mockOverlayWindow,
    })

    const handler = (ipcMain as any)._getHandler('ai:trigger')
    await handler({}, { userPrompt: '' })

    expect(mockOverlayWindow.webContents.send).toHaveBeenCalledWith(
      'stream:error',
      expect.objectContaining({ message: expect.stringContaining('Screen capture failed') })
    )
  })
})
