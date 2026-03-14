import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { getApiKey } from '../store/persistentStore'
import type { GeminiMessage } from '../../shared/types'
import {
  GEMINI_MODEL,
  RATE_LIMIT_RETRY_DELAY_MS,
  TEST_TOKEN_DELAY_MS,
} from '../../shared/constants'

// Track the current abort controller so we can cancel in-flight requests
let currentAbortController: AbortController | null = null

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function streamWithRetry(
  genAI: GoogleGenerativeAI,
  messages: GeminiMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  signal: AbortSignal,
  isRetry: boolean
): Promise<void> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  // Build chat history (all but last message) and the current user message
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: m.parts,
  }))

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) {
    onError(new Error('streamResponse: messages array is empty'))
    return
  }

  try {
    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMessage.parts)

    for await (const chunk of result.stream) {
      if (signal.aborted) {
        // Request was cancelled — exit silently
        return
      }

      const text = chunk.text()
      if (text) {
        onToken(text)
      }
    }

    if (!signal.aborted) {
      onDone()
    }
  } catch (err: unknown) {
    if (signal.aborted) {
      // Cancelled intentionally — don't surface as error
      return
    }

    const error = err instanceof Error ? err : new Error(String(err))

    // Detect HTTP 429 rate limit
    const is429 =
      error.message.includes('429') ||
      error.message.toLowerCase().includes('resource_exhausted') ||
      error.message.toLowerCase().includes('rate limit')

    if (is429 && !isRetry) {
      console.warn('geminiClient: rate limit hit (429), retrying in', RATE_LIMIT_RETRY_DELAY_MS, 'ms')
      await sleep(RATE_LIMIT_RETRY_DELAY_MS)

      if (signal.aborted) return

      return streamWithRetry(genAI, messages, onToken, onDone, onError, signal, true)
    }

    onError(error)
  }
}

async function streamTestMode(
  onToken: (token: string) => void,
  onDone: () => void,
  signal: AbortSignal
): Promise<void> {
  const fixturePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'fixtures',
    'mock-gemini-response.txt'
  )

  let text: string
  try {
    text = fs.readFileSync(fixturePath, 'utf-8')
  } catch {
    text = 'Mock response: fixture file not found.'
  }

  // Stream token by token with delay
  for (const char of text) {
    if (signal.aborted) return
    onToken(char)
    await sleep(TEST_TOKEN_DELAY_MS)
  }

  if (!signal.aborted) {
    onDone()
  }
}

export async function streamResponse(
  messages: GeminiMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  // Cancel any in-flight request
  if (currentAbortController) {
    currentAbortController.abort()
  }

  const controller = new AbortController()
  currentAbortController = controller
  const { signal } = controller

  const isTestMode = process.env.ELECTRON_IS_TEST === '1'

  if (isTestMode) {
    await streamTestMode(onToken, onDone, signal)
    return
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    onError(new Error('Gemini API key is not set'))
    return
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  await streamWithRetry(genAI, messages, onToken, onDone, onError, signal, false)
}
