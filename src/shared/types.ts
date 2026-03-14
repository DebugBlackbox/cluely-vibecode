export interface FileContext {
  filename: string
  content: string
}

export interface UploadedFile {
  path: string
  filename: string
  hash: string
  contentPreview: string
  addedAt: string
}

export interface Preferences {
  triggerShortcut: string
  toggleShortcut: string
  autoDismissMs: number
  overlayOpacity: number
}

export interface Settings {
  geminiApiKey: string
  systemPrompt: string
  uploadedFiles: UploadedFile[]
  preferences: Preferences
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

export interface StreamTokenPayload {
  token: string
}

export interface StreamErrorPayload {
  message: string
}

export interface TriggerPayload {
  userPrompt: string
}

export interface AddFilePayload {
  filePath: string
}

export interface RemoveFilePayload {
  hash: string
}

export interface OverlayDragPayload {
  deltaX: number
  deltaY: number
}

export class UnsupportedFileTypeError extends Error {
  constructor(ext: string) {
    super(`Unsupported file type: ${ext}`)
    this.name = 'UnsupportedFileTypeError'
  }
}
