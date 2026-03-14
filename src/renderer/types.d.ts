import type { FileContext, UploadedFile, Settings } from '@shared/types'

declare global {
  interface Window {
    electronAPI: {
      trigger: (userPrompt: string) => Promise<void>
      addFile: (filePath: string) => Promise<FileContext>
      removeFile: (hash: string) => Promise<void>
      getFiles: () => Promise<UploadedFile[]>
      getSettings: () => Promise<Settings>
      saveSettings: (settings: Partial<Settings>) => Promise<void>
      onStreamToken: (cb: (token: string) => void) => void
      onStreamDone: (cb: () => void) => void
      onStreamError: (cb: (msg: string) => void) => void
      onStreamClear: (cb: () => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

export {}
