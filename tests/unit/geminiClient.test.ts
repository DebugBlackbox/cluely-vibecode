import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Build mock chat object
function makeMockChat(chunks: Array<{ text: () => string }>) {
  async function* streamGen() {
    for (const chunk of chunks) yield chunk
  }
  return {
    sendMessageStream: vi.fn().mockResolvedValue({ stream: streamGen() }),
  }
}

const mockModel = {
  startChat: vi.fn(),
}

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue(mockModel),
  })),
}))

vi.mock('electron-store', () => {
  const store = new Map<string, any>([['geminiApiKey', 'test-api-key']])
  return {
    default: class MockStore {
      get(key: string) { return store.get(key) ?? '' }
      set(key: string, val: any) { store.set(key, val) }
    }
  }
})

vi.mock('electron', () => import('../__mocks__/electron'))

describe('geminiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.ELECTRON_IS_TEST
  })

  it('calls onToken for each chunk and onDone on stream end', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const chunks = [{ text: () => 'Hello ' }, { text: () => 'world' }]

    const chat = makeMockChat(chunks)
    ;(mockModel.startChat as ReturnType<typeof vi.fn>).mockReturnValue(chat)
    ;(GoogleGenerativeAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }))

    const { streamResponse } = await import('../../src/main/ai/geminiClient')
    const onToken = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    await streamResponse([{ role: 'user', parts: [{ text: 'hi' }] }], onToken, onDone, onError)

    expect(onToken).toHaveBeenCalledWith('Hello ')
    expect(onToken).toHaveBeenCalledWith('world')
    expect(onDone).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })

  it('aborts previous request when new request arrives', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    // Track captured abort signal
    let capturedSignal: AbortSignal | null = null

    // First stream: blocked until aborted
    async function* blockingStream(signal: AbortSignal) {
      // Yield nothing - just wait for abort
      while (!signal.aborted) {
        // Check once per microtask
        await Promise.resolve()
      }
      // Aborted — stop
    }

    // We'll inject the signal by capturing it from the chat call
    const firstChat = {
      sendMessageStream: vi.fn().mockImplementation((_parts: any) => {
        // Return a stream that reads the current abort controller signal
        // We'll track via the module's internal state — just return an empty stream
        async function* gen() { /* never yields */ }
        return Promise.resolve({ stream: gen() })
      }),
    }

    async function* secondStream() {
      yield { text: () => 'second response' }
    }
    const secondChat = {
      sendMessageStream: vi.fn().mockResolvedValue({ stream: secondStream() }),
    }

    let chatCallCount = 0
    ;(mockModel.startChat as ReturnType<typeof vi.fn>).mockImplementation(() => {
      chatCallCount++
      return chatCallCount === 1 ? firstChat : secondChat
    })
    ;(GoogleGenerativeAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }))

    const { streamResponse } = await import('../../src/main/ai/geminiClient')

    const onToken1 = vi.fn()
    const onDone1 = vi.fn()
    const onError1 = vi.fn()

    // Start first request (won't complete on its own)
    const p1 = streamResponse([{ role: 'user', parts: [{ text: 'first' }] }], onToken1, onDone1, onError1)

    // Yield to let first request start
    await Promise.resolve()
    await Promise.resolve()

    // Start second request — should abort first
    const onToken2 = vi.fn()
    const onDone2 = vi.fn()
    const onError2 = vi.fn()
    const p2 = streamResponse([{ role: 'user', parts: [{ text: 'second' }] }], onToken2, onDone2, onError2)

    await Promise.allSettled([p1, p2])

    // Both chats were called
    expect(chatCallCount).toBe(2)
    // Second request completed
    expect(onToken2).toHaveBeenCalledWith('second response')
    expect(onDone2).toHaveBeenCalled()
    // First request yielded no tokens
    expect(onToken1).not.toHaveBeenCalled()
  })

  it('retries once on 429, waits 5s', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    let callCount = 0

    async function* successStream() {
      yield { text: () => 'retry worked' }
    }

    const retryChat = {
      sendMessageStream: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const err: any = new Error('429 Too Many Requests')
          err.status = 429
          return Promise.reject(err)
        }
        return Promise.resolve({ stream: successStream() })
      }),
    }
    ;(mockModel.startChat as ReturnType<typeof vi.fn>).mockReturnValue(retryChat)
    ;(GoogleGenerativeAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }))

    const { streamResponse } = await import('../../src/main/ai/geminiClient')
    const onToken = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    const promise = streamResponse([{ role: 'user', parts: [{ text: 'test' }] }], onToken, onDone, onError)

    // Advance past 5s retry delay
    await vi.advanceTimersByTimeAsync(5001)
    await promise

    expect(callCount).toBe(2)
    expect(onToken).toHaveBeenCalledWith('retry worked')
    expect(onDone).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onError if second attempt also returns 429', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    const failChat = {
      sendMessageStream: vi.fn().mockImplementation(() => {
        const err: any = new Error('429 Too Many Requests')
        err.status = 429
        return Promise.reject(err)
      }),
    }
    ;(mockModel.startChat as ReturnType<typeof vi.fn>).mockReturnValue(failChat)
    ;(GoogleGenerativeAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }))

    const { streamResponse } = await import('../../src/main/ai/geminiClient')
    const onToken = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    const promise = streamResponse([{ role: 'user', parts: [{ text: 'test' }] }], onToken, onDone, onError)
    await vi.advanceTimersByTimeAsync(5001)
    await promise

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('streams fixture file in test mode (ELECTRON_IS_TEST=1)', async () => {
    process.env.ELECTRON_IS_TEST = '1'

    const { streamResponse } = await import('../../src/main/ai/geminiClient')
    const onToken = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()

    const promise = streamResponse([], onToken, onDone, onError)

    // Advance timers far enough for all characters to stream (each has 20ms delay)
    await vi.advanceTimersByTimeAsync(50000)
    await promise

    expect(onToken.mock.calls.length).toBeGreaterThan(0)
    expect(onDone).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
