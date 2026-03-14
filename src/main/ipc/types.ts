// Re-export IPC channel constants
export { IPC } from '../../shared/constants'

// Re-export all payload types
export type {
  FileContext,
  UploadedFile,
  Preferences,
  Settings,
  GeminiMessage,
  GeminiPart,
  StreamTokenPayload,
  StreamErrorPayload,
  TriggerPayload,
  AddFilePayload,
  RemoveFilePayload,
  OverlayDragPayload,
} from '../../shared/types'

export { UnsupportedFileTypeError } from '../../shared/types'
