import Store from 'electron-store'
import type { UploadedFile, Preferences } from '../../shared/types'
import { DEFAULT_PREFERENCES } from '../../shared/constants'

interface StoreSchema {
  geminiApiKey: string
  systemPrompt: string
  uploadedFiles: UploadedFile[]
  parsedFileCache: Record<string, string>
  overlayPosition: { x: number; y: number } | null
  preferences: Preferences
}

const store = new Store<StoreSchema>({
  encryptionKey: 'cluely-store-key',
  defaults: {
    geminiApiKey: '',
    systemPrompt: '',
    uploadedFiles: [],
    parsedFileCache: {},
    overlayPosition: null,
    preferences: { ...DEFAULT_PREFERENCES },
  },
})

// Expose raw store for dependency injection in handlers
export function getStore(): Store<StoreSchema> {
  return store
}

// --- API Key ---
export function getApiKey(): string {
  return store.get('geminiApiKey')
}

export function setApiKey(key: string): void {
  store.set('geminiApiKey', key)
}

// --- System Prompt ---
export function getSystemPrompt(): string {
  return store.get('systemPrompt')
}

export function setSystemPrompt(prompt: string): void {
  store.set('systemPrompt', prompt)
}

// --- Uploaded Files ---
export function getUploadedFiles(): UploadedFile[] {
  return store.get('uploadedFiles')
}

export function addUploadedFile(file: UploadedFile): void {
  const current = store.get('uploadedFiles')
  // Avoid duplicates by hash
  const filtered = current.filter((f) => f.hash !== file.hash)
  store.set('uploadedFiles', [...filtered, file])
}

export function removeUploadedFileByHash(hash: string): void {
  const current = store.get('uploadedFiles')
  store.set(
    'uploadedFiles',
    current.filter((f) => f.hash !== hash)
  )
}

// --- Parsed File Cache ---
export function getParsedFileCache(): Record<string, string> {
  return store.get('parsedFileCache')
}

export function getCachedParsedFile(hash: string): string | undefined {
  const cache = store.get('parsedFileCache')
  return cache[hash]
}

export function setCachedParsedFile(hash: string, content: string): void {
  const cache = store.get('parsedFileCache')
  store.set('parsedFileCache', { ...cache, [hash]: content })
}

// --- Overlay Position ---
export function getOverlayPosition(): { x: number; y: number } | null {
  return store.get('overlayPosition')
}

export function setOverlayPosition(pos: { x: number; y: number }): void {
  store.set('overlayPosition', pos)
}

// --- Preferences ---
export function getPreferences(): Preferences {
  return store.get('preferences')
}

export function setPreferences(prefs: Partial<Preferences>): void {
  const current = store.get('preferences')
  store.set('preferences', { ...current, ...prefs })
}

// --- Settings (combined) ---
export function saveSettings(partial: {
  geminiApiKey?: string
  systemPrompt?: string
  preferences?: Partial<Preferences>
}): void {
  if (partial.geminiApiKey !== undefined) {
    store.set('geminiApiKey', partial.geminiApiKey)
  }
  if (partial.systemPrompt !== undefined) {
    store.set('systemPrompt', partial.systemPrompt)
  }
  if (partial.preferences !== undefined) {
    setPreferences(partial.preferences)
  }
}
