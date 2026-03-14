export const IPC = {
  // Main → Overlay
  STREAM_TOKEN: 'stream:token',
  STREAM_DONE: 'stream:done',
  STREAM_ERROR: 'stream:error',
  STREAM_CLEAR: 'stream:clear',

  // Renderer/Overlay → Main (invoke)
  TRIGGER: 'ai:trigger',
  ADD_FILE: 'files:add',
  REMOVE_FILE: 'files:remove',
  GET_FILES: 'files:get',
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',

  // Overlay → Main (fire-and-forget)
  OVERLAY_MOUSE_ENTER: 'overlay:mouseEnter',
  OVERLAY_MOUSE_LEAVE: 'overlay:mouseLeave',
  OVERLAY_DRAG: 'overlay:drag',

  // Main → Renderer
  CONTENT_PROTECTION_SET: 'overlay:contentProtectionSet',
} as const

export const DEFAULT_SYSTEM_PROMPT =
  "You are an invisible AI assistant observing the user's screen. Be concise and direct.\n" +
  'Use bullet points. Max 5 bullets. If the user asks a specific question, answer it directly.\n' +
  "If no question is given, surface the most relevant insight from what's on screen."

export const DEFAULT_PREFERENCES = {
  triggerShortcut: 'CommandOrControl+Return',
  toggleShortcut: 'CommandOrControl+Shift+Space',
  autoDismissMs: 0,
  overlayOpacity: 0.95,
} as const

export const GEMINI_MODEL = 'gemini-2.0-flash'
export const MAX_FILE_CHARS = 8000
export const MAX_FILE_PROMPT_CHARS = 4000
export const TOTAL_CHAR_WARN_THRESHOLD = 40000
export const SCREENSHOT_MAX_WIDTH = 1280
export const RATE_LIMIT_RETRY_DELAY_MS = 5000
export const TEST_TOKEN_DELAY_MS = 20
