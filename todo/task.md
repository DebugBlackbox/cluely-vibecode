# Claude Code Prompt: Build a Cluely-like AI Overlay Desktop App

## Overview

Build a production-grade Electron desktop application that acts as an invisible AI assistant overlay. The app sits transparently on top of all windows, invisible to screen-share software (Zoom, Google Meet, Teams, etc.).

**Core interaction loop:**
1. User presses `Cmd+Enter` (global hotkey, works from any app) — optionally with a typed prompt in the overlay input
2. App takes a screenshot of the current screen
3. Screenshot + optional user prompt + global system prompt + uploaded context files → sent to Gemini API
4. Gemini streams a response into the overlay in real-time

No continuous capture. No audio. No background polling. Everything is on-demand, triggered explicitly by the user.

The AI backend uses the **Gemini API** (`gemini-2.0-flash` for low latency streaming). Users customize behavior via a global system prompt and by uploading context files (PDF, .txt, .md, .docx). The overlay is always-on-top, click-through by default, draggable, and toggled with a separate hotkey.

---

## Tech Stack

- **Runtime**: Electron (latest stable) + Node.js
- **Frontend**: React + TypeScript + Tailwind CSS (within Electron renderer processes)
- **Build tool**: Vite (renderer), separate Vite config (overlay), electron-builder (packaging)
- **AI**: `@google/generative-ai` SDK — model `gemini-2.0-flash`, streaming
- **File parsing**: `pdf-parse` for PDF, `mammoth` for .docx, native `fs` for .txt/.md
- **State management**: Zustand (renderer), `electron-store` (persistence)
- **IPC**: Typed manual wrappers over `ipcMain`/`ipcRenderer` via `contextBridge`
- **Testing**:
  - Unit: Vitest
  - Integration: Vitest + manual Electron mock
  - E2E: Playwright with `electron` (`@playwright/test`)
- **Linting/formatting**: ESLint + Prettier
- **CI**: GitHub Actions

---

## Project Structure

```
/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, lifecycle, tray
│   │   ├── windows/
│   │   │   ├── mainWindow.ts          # Settings/dashboard BrowserWindow
│   │   │   └── overlayWindow.ts       # Transparent overlay BrowserWindow
│   │   ├── capture/
│   │   │   └── screenCapture.ts       # One-shot screenshot via desktopCapturer
│   │   ├── ai/
│   │   │   ├── geminiClient.ts        # Gemini streaming client
│   │   │   └── promptBuilder.ts       # Assembles full prompt from parts
│   │   ├── files/
│   │   │   └── fileParser.ts          # PDF/docx/txt/md → plain text + cache
│   │   ├── store/
│   │   │   └── persistentStore.ts     # electron-store: keys, files, prefs
│   │   ├── ipc/
│   │   │   ├── handlers.ts            # All ipcMain.handle registrations
│   │   │   └── types.ts               # IPC channel name constants + payload types
│   │   └── shortcuts/
│   │       └── globalShortcuts.ts     # Cmd+Enter (trigger) + Cmd+Shift+Space (toggle)
│   │
│   ├── renderer/                      # React app — settings/dashboard window
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Home: system prompt + quick status
│   │   │   ├── ContextFiles.tsx       # Upload & manage context files
│   │   │   └── Preferences.tsx        # API key, hotkeys, overlay prefs
│   │   ├── components/
│   │   │   ├── PromptEditor.tsx       # Global system prompt textarea
│   │   │   ├── FileUploader.tsx       # Drag-and-drop file upload UI
│   │   │   └── StatusIndicator.tsx    # "AI thinking..." live indicator
│   │   └── store/
│   │       └── uiStore.ts             # Zustand store
│   │
│   ├── overlay/                       # Separate React app — overlay window
│   │   ├── main.tsx
│   │   ├── Overlay.tsx                # Root: input bar + response card
│   │   └── components/
│   │       ├── PromptInput.tsx        # Text input the user types into (optional prompt)
│   │       ├── SuggestionCard.tsx     # Streams Gemini response (markdown rendered)
│   │       └── OverlayControls.tsx    # Pin / dismiss / drag handle
│   │
│   └── shared/
│       ├── types.ts                   # Shared types across processes
│       └── constants.ts               # IPC channel names, default values
│
├── tests/
│   ├── unit/
│   │   ├── screenCapture.test.ts
│   │   ├── promptBuilder.test.ts
│   │   ├── fileParser.test.ts
│   │   └── geminiClient.test.ts
│   ├── integration/
│   │   ├── ipc.test.ts
│   │   └── triggerFlow.test.ts        # Cmd+Enter → screenshot → Gemini → overlay
│   └── e2e/
│       ├── app.spec.ts
│       ├── overlay.spec.ts
│       ├── fileUpload.spec.ts
... (441 lines left)

claude-code-prompt.md
24 KB
﻿
# Claude Code Prompt: Build a Cluely-like AI Overlay Desktop App

## Overview

Build a production-grade Electron desktop application that acts as an invisible AI assistant overlay. The app sits transparently on top of all windows, invisible to screen-share software (Zoom, Google Meet, Teams, etc.).

**Core interaction loop:**
1. User presses `Cmd+Enter` (global hotkey, works from any app) — optionally with a typed prompt in the overlay input
2. App takes a screenshot of the current screen
3. Screenshot + optional user prompt + global system prompt + uploaded context files → sent to Gemini API
4. Gemini streams a response into the overlay in real-time

No continuous capture. No audio. No background polling. Everything is on-demand, triggered explicitly by the user.

The AI backend uses the **Gemini API** (`gemini-2.0-flash` for low latency streaming). Users customize behavior via a global system prompt and by uploading context files (PDF, .txt, .md, .docx). The overlay is always-on-top, click-through by default, draggable, and toggled with a separate hotkey.

---

## Tech Stack

- **Runtime**: Electron (latest stable) + Node.js
- **Frontend**: React + TypeScript + Tailwind CSS (within Electron renderer processes)
- **Build tool**: Vite (renderer), separate Vite config (overlay), electron-builder (packaging)
- **AI**: `@google/generative-ai` SDK — model `gemini-2.0-flash`, streaming
- **File parsing**: `pdf-parse` for PDF, `mammoth` for .docx, native `fs` for .txt/.md
- **State management**: Zustand (renderer), `electron-store` (persistence)
- **IPC**: Typed manual wrappers over `ipcMain`/`ipcRenderer` via `contextBridge`
- **Testing**:
  - Unit: Vitest
  - Integration: Vitest + manual Electron mock
  - E2E: Playwright with `electron` (`@playwright/test`)
- **Linting/formatting**: ESLint + Prettier
- **CI**: GitHub Actions

---

## Project Structure

```
/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, lifecycle, tray
│   │   ├── windows/
│   │   │   ├── mainWindow.ts          # Settings/dashboard BrowserWindow
│   │   │   └── overlayWindow.ts       # Transparent overlay BrowserWindow
│   │   ├── capture/
│   │   │   └── screenCapture.ts       # One-shot screenshot via desktopCapturer
│   │   ├── ai/
│   │   │   ├── geminiClient.ts        # Gemini streaming client
│   │   │   └── promptBuilder.ts       # Assembles full prompt from parts
│   │   ├── files/
│   │   │   └── fileParser.ts          # PDF/docx/txt/md → plain text + cache
│   │   ├── store/
│   │   │   └── persistentStore.ts     # electron-store: keys, files, prefs
│   │   ├── ipc/
│   │   │   ├── handlers.ts            # All ipcMain.handle registrations
│   │   │   └── types.ts               # IPC channel name constants + payload types
│   │   └── shortcuts/
│   │       └── globalShortcuts.ts     # Cmd+Enter (trigger) + Cmd+Shift+Space (toggle)
│   │
│   ├── renderer/                      # React app — settings/dashboard window
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Home: system prompt + quick status
│   │   │   ├── ContextFiles.tsx       # Upload & manage context files
│   │   │   └── Preferences.tsx        # API key, hotkeys, overlay prefs
│   │   ├── components/
│   │   │   ├── PromptEditor.tsx       # Global system prompt textarea
│   │   │   ├── FileUploader.tsx       # Drag-and-drop file upload UI
│   │   │   └── StatusIndicator.tsx    # "AI thinking..." live indicator
│   │   └── store/
│   │       └── uiStore.ts             # Zustand store
│   │
│   ├── overlay/                       # Separate React app — overlay window
│   │   ├── main.tsx
│   │   ├── Overlay.tsx                # Root: input bar + response card
│   │   └── components/
│   │       ├── PromptInput.tsx        # Text input the user types into (optional prompt)
│   │       ├── SuggestionCard.tsx     # Streams Gemini response (markdown rendered)
│   │       └── OverlayControls.tsx    # Pin / dismiss / drag handle
│   │
│   └── shared/
│       ├── types.ts                   # Shared types across processes
│       └── constants.ts               # IPC channel names, default values
│
├── tests/
│   ├── unit/
│   │   ├── screenCapture.test.ts
│   │   ├── promptBuilder.test.ts
│   │   ├── fileParser.test.ts
│   │   └── geminiClient.test.ts
│   ├── integration/
│   │   ├── ipc.test.ts
│   │   └── triggerFlow.test.ts        # Cmd+Enter → screenshot → Gemini → overlay
│   └── e2e/
│       ├── app.spec.ts
│       ├── overlay.spec.ts
│       ├── fileUpload.spec.ts
│       └── triggerFlow.spec.ts
│
├── fixtures/
│   ├── sample.pdf
│   ├── sample.docx
│   ├── sample.txt
│   ├── mock-gemini-response.txt       # Used in E2E test mode
│   └── mock-screenshot.png            # Used in unit/integration tests
│
├── electron-builder.config.js
├── vite.config.ts
├── vite.overlay.config.ts
├── tsconfig.json
├── .eslintrc.js
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── build.yml
└── package.json
```

---

## Detailed Implementation Requirements

### 1. Window Management (`src/main/windows/`)

#### `overlayWindow.ts`
- Create a `BrowserWindow` with:
  ```ts
  {
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    width: 480,
    height: 600,
    webPreferences: { contextIsolation: true, preload: overlayPreloadPath }
  }
  ```
- Default position: bottom-right corner of primary display (persist position in electron-store)
- **Screen share invisibility**:
  - macOS: call `overlayWindow.setContentProtection(true)` **after** the window emits `'show'` (not in constructor — race condition)
  - Windows: call `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` via `electron-disable-screen-capture` npm package
  - Linux: document as best-effort only
- Mouse events: `setIgnoreMouseEvents(true, { forward: true })` by default. When overlay renderer sends `OVERLAY_MOUSE_ENTER` via IPC, call `setIgnoreMouseEvents(false)`. On `OVERLAY_MOUSE_LEAVE`, re-enable ignore.
- Dragging: since the window is `focusable: false`, implement drag via IPC. Overlay sends `OVERLAY_DRAG` with `{ deltaX: number, deltaY: number }`, main process updates position with `overlayWindow.setPosition(...)`.
- Expose: `show()`, `hide()`, `toggle()`, `getWindow(): BrowserWindow`

#### `mainWindow.ts`
- Standard `BrowserWindow` (900×650, resizable)
- On close event: hide to tray, do not quit. Only quit on explicit tray → Quit.
- Show main window on tray icon click if hidden.

### 2. Screen Capture (`src/main/capture/screenCapture.ts`)

**On-demand only — no interval, no background capture.**

```ts
export async function captureScreen(): Promise<string>
```

- Call `desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } })`
- Take the first source (primary display)
- Get `source.thumbnail` as NativeImage
- Downscale to max width 1280px preserving aspect ratio (use NativeImage `.resize()`)
- Return as raw base64 PNG string — **no** `data:image/png;base64,` prefix (Gemini wants raw base64)
- If capture fails, throw a descriptive error (do not silently return empty string)

### 3. Gemini Client (`src/main/ai/geminiClient.ts`)

```ts
export async function streamResponse(
  messages: GeminiMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void>
```

- Use `@google/generative-ai` SDK, model `gemini-2.0-flash`
- Call `generateContentStream(...)` with assembled messages
- For each chunk in the stream, call `onToken(chunk.text())`
- On stream end, call `onDone()`
- **Cancel-on-new-request**: track an `AbortController`. If a request is in-flight when a new one arrives, call `abort()` on the previous controller and start fresh
- On HTTP 429: wait 5 seconds, retry once. If still 429, call `onError` with a clear message
- API key read from `persistentStore`, never hardcoded
- In `ELECTRON_IS_TEST=1` mode: skip real API call, stream `fixtures/mock-gemini-response.txt` token by token with 20ms delay

### 4. Prompt Builder (`src/main/ai/promptBuilder.ts`)

```ts
export function buildMessages(params: {
  systemPrompt: string
  userPrompt: string          // what user typed in the overlay input (may be empty)
  screenshotBase64: string
  fileContexts: FileContext[]
}): GeminiMessage[]
```

Assemble the following structure:

```
[SYSTEM INSTRUCTION]
{systemPrompt if non-empty, otherwise use default}

Default:
"You are an invisible AI assistant observing the user's screen. Be concise and direct.
Use bullet points. Max 5 bullets. If the user asks a specific question, answer it directly.
If no question is given, surface the most relevant insight from what's on screen."

[CONTEXT FILES]   ← omit entirely if fileContexts is empty
Filename: {name}
{content truncated to 4000 chars}
---
(repeat per file)

[USER PROMPT]     ← omit if userPrompt is empty
{userPrompt}

[SCREEN]
{screenshot as vision inlineData part — not embedded in text}
```

- Each file truncated to 4000 chars
- Log a warning if total estimated character count exceeds 40000
- Screenshot passed as Gemini `inlineData` vision part, **not** as text

### 5. File Parser (`src/main/files/fileParser.ts`)

```ts
export async function parseFile(filePath: string): Promise<FileContext>
// FileContext = { filename: string, content: string }
```

- `.pdf` → `pdf-parse`
- `.docx` → `mammoth.extractRawText`
- `.txt`, `.md` → `fs.readFile` utf-8
- Unsupported types: throw `UnsupportedFileTypeError`
- Strip excess whitespace (collapse multiple newlines to max 2)
- Truncate to 8000 chars
- Cache by SHA256 of file contents in electron-store. Cache hit skips re-parsing.

### 6. Persistent Store (`src/main/store/persistentStore.ts`)

`electron-store` schema:
```ts
{
  geminiApiKey: string                  // default: ''
  systemPrompt: string                  // default: ''
  uploadedFiles: Array<{
    path: string
    filename: string
    hash: string
    contentPreview: string              // first 100 chars
    addedAt: string                     // ISO timestamp
  }>
  parsedFileCache: Record<string, string>  // hash → full parsed content
  overlayPosition: { x: number, y: number } | null
  preferences: {
    triggerShortcut: string             // default: 'CommandOrControl+Return'
    toggleShortcut: string              // default: 'CommandOrControl+Shift+Space'
    autoDismissMs: number               // default: 0 (0 = never)
    overlayOpacity: number              // default: 0.95
  }
}
```

API key encrypted at rest via electron-store `encryptionKey` option. Never log it.

### 7. IPC Layer (`src/main/ipc/`)

#### `types.ts`
```ts
export const IPC = {
  // Main → Overlay
  STREAM_TOKEN: 'stream:token',         // { token: string }
  STREAM_DONE: 'stream:done',
  STREAM_ERROR: 'stream:error',         // { message: string }
  STREAM_CLEAR: 'stream:clear',

  // Renderer/Overlay → Main (invoke)
  TRIGGER: 'ai:trigger',               // { userPrompt: string } → void
  ADD_FILE: 'files:add',               // { filePath: string } → FileContext
  REMOVE_FILE: 'files:remove',         // { hash: string } → void
  GET_FILES: 'files:get',              // → UploadedFile[]
  GET_SETTINGS: 'settings:get',        // → Settings
  SAVE_SETTINGS: 'settings:save',      // Partial<Settings> → void

  // Overlay → Main (fire-and-forget)
  OVERLAY_MOUSE_ENTER: 'overlay:mouseEnter',
  OVERLAY_MOUSE_LEAVE: 'overlay:mouseLeave',
  OVERLAY_DRAG: 'overlay:drag',        // { deltaX: number, deltaY: number }
} as const
```

#### `handlers.ts`
- All `ipcMain.handle` registrations
- `TRIGGER` handler: `captureScreen()` → `buildMessages()` → `streamResponse()`, forwarding each token via `overlayWindow.webContents.send(IPC.STREAM_TOKEN, { token })`
- Handlers receive injected dependencies (no direct singleton imports) for testability
- Any unhandled error: send `STREAM_ERROR` to overlay and log

### 8. Global Shortcuts (`src/main/shortcuts/globalShortcuts.ts`)

- **Trigger**: `CommandOrControl+Return` → fires the `TRIGGER` flow with empty `userPrompt`
- **Toggle overlay**: `CommandOrControl+Shift+Space` → show/hide overlay
- Both configurable in preferences, stored in electron-store
- Unregister all on `app.on('will-quit')`
- Failed registration: log warning + show toast in main window

### 9. Overlay UI (`src/overlay/`)

#### `Overlay.tsx`
- Listens to `STREAM_TOKEN`, `STREAM_DONE`, `STREAM_ERROR`, `STREAM_CLEAR`
- Layout (vertical, bottom-anchored):
  1. `SuggestionCard` — top, hidden when empty
  2. `PromptInput` — fixed at bottom, always visible
- Background: `rgba(0,0,0,0.80)`, `backdrop-filter: blur(12px)`, rounded corners
- Window should feel like a floating HUD

#### `PromptInput.tsx`
- Single-line text input, placeholder: `"Ask anything... (⌘↵ to send)"`
- `Cmd+Enter`: send `TRIGGER` IPC with input text, clear input
- `Escape`: clear input, send `STREAM_CLEAR`
- On `OVERLAY_MOUSE_ENTER` received in main → main calls `setFocusable(true)` + `focus()` → input receives focus
- On `OVERLAY_MOUSE_LEAVE` → main calls `setFocusable(false)`
- While streaming: show pulsing indicator dot

#### `SuggestionCard.tsx`
- Renders streaming markdown via `react-markdown` + `remark-gfm`
- Tokens append as they arrive (ref-based, avoid full re-render per token)
- "Pin" toggle: disables auto-dismiss when active
- "Copy" button: copies full response to clipboard
- "Dismiss" (×): sends `STREAM_CLEAR`
- Auto-dismiss: if `autoDismissMs > 0` and not pinned, dismiss after delay from `STREAM_DONE`
- Error state: if `STREAM_ERROR` arrives, show message in red with a retry button (retries `TRIGGER` with last prompt)

#### `OverlayControls.tsx`
- Drag handle at top of overlay
- `mousedown` starts drag tracking, `mousemove` sends `OVERLAY_DRAG` with deltas, `mouseup` stops
- Main process maintains current position and persists to store on drag end

### 10. Settings / Dashboard UI (`src/renderer/`)

#### `Dashboard.tsx`
- Large textarea for global system prompt (auto-saves on blur)
- Uploaded files list with filename, preview, remove button
- Last trigger time and first 80 chars of last response

#### `ContextFiles.tsx`
- `react-dropzone` accepting `.pdf`, `.docx`, `.txt`, `.md`
- On drop: send `ADD_FILE` IPC
- Show parsed content preview under each file
- Inline error if parsing failed

#### `Preferences.tsx`
- Gemini API key: masked input with show/hide toggle
- Trigger shortcut: display + "Change" button with key capture dialog
- Toggle shortcut: same
- Auto-dismiss: slider (0 = never, 5s, 10s, 30s, 60s)
- Overlay opacity: slider (50%–100%)
- "Reset overlay position" button

---

## Testing Requirements

### Unit Tests (`tests/unit/`) — Vitest

#### `screenCapture.test.ts`
- Returns non-empty base64 string (mock `desktopCapturer`)
- Throws descriptive error if `getSources` returns empty array
- Output does not include `data:image/png;base64,` prefix
- Downscales images wider than 1280px (mock NativeImage with known dimensions)

#### `promptBuilder.test.ts`
- Empty `systemPrompt` → uses default instruction text
- Non-empty `systemPrompt` → uses it instead
- Empty `fileContexts` → omits `[CONTEXT FILES]` section
- Files present → each appears, truncated to 4000 chars
- Empty `userPrompt` → omits `[USER PROMPT]` section
- Screenshot present as `inlineData` vision part (not in text)
- Logs warning when total char estimate exceeds 40000

#### `fileParser.test.ts`
- Parses `fixtures/sample.txt` correctly
- Parses `fixtures/sample.pdf` → plain text
- Parses `fixtures/sample.docx` → plain text
- Truncates content > 8000 chars
- Strips excess whitespace
- Throws `UnsupportedFileTypeError` for `.xlsx`
- Same file hash called twice → returns cached result, parse function only called once (spy)

#### `geminiClient.test.ts`
- Calls `onToken` for each chunk
- Calls `onDone` on stream end
- New request while in-flight → cancels previous (verify abort was called)
- Retries once on 429, waits 5s (mock timers with `vi.useFakeTimers()`)
- Calls `onError` if second attempt also 429
- In test mode streams fixture file instead of calling API

---

### Integration Tests (`tests/integration/`) — Vitest with mocked Electron

`tests/__mocks__/electron.ts` stubs: `ipcMain`, `ipcRenderer`, `app`, `BrowserWindow`, `desktopCapturer`, `screen`, `globalShortcut`, `Tray`, `Menu`, `nativeImage`.

`vitest.config.ts`:
```ts
test: {
  alias: { electron: path.resolve('./tests/__mocks__/electron.ts') }
}
```

#### `ipc.test.ts`
- `ADD_FILE`: calls `fileParser.parseFile`, adds to store, returns `FileContext`
- `REMOVE_FILE`: removes from store by hash
- `GET_FILES`: returns files array from store
- `GET_SETTINGS`: returns settings from store
- `SAVE_SETTINGS`: merges partial settings into store
- `TRIGGER` with no API key: sends `STREAM_ERROR` with "API key not set"
- `TRIGGER` with API key: calls `captureScreen`, `buildMessages`, `streamResponse` in sequence

#### `triggerFlow.test.ts`
- Trigger shortcut fires the `TRIGGER` IPC handler
- `TRIGGER` calls `captureScreen()` exactly once
- `buildMessages` called with screenshot, user prompt, system prompt, file contexts from store
- Each token forwarded via `webContents.send(IPC.STREAM_TOKEN, { token })`
- `STREAM_DONE` sent after all tokens
- `captureScreen` throws → `STREAM_ERROR` sent to overlay

---

### E2E Tests (`tests/e2e/`) — Playwright + `electron` package

Launch with `ELECTRON_IS_TEST=1`. App uses fixture responses and mock screenshot in test mode.

#### `app.spec.ts`
- Launches without crashing
- Main window visible with expected title
- System tray icon present
- Closing main window does not quit the process

#### `overlay.spec.ts`
- Overlay window present in window list on launch
- `alwaysOnTop: true`
- `setContentProtection` was called (verify via IPC ping)
- `STREAM_CLEAR` via IPC clears `SuggestionCard`
- `STREAM_TOKEN` tokens appear in `SuggestionCard`

#### `fileUpload.spec.ts`
- Upload `fixtures/sample.pdf` → filename appears in list
- Content preview shown
- Remove file → removed from list
- Upload `.xlsx` → error toast shown

#### `triggerFlow.spec.ts`
- Type prompt in `PromptInput` + press Cmd+Enter → input clears, loading indicator appears, tokens stream into `SuggestionCard`, loading hides on done
- Press `Escape` in `PromptInput` → input cleared, suggestion dismissed
- Dismiss button (×) clears the card

---

## Non-Functional Requirements

- **Startup**: Main window interactive within 3 seconds
- **Trigger latency**: Cmd+Enter to first token < 2 seconds (local overhead < 150ms)
- **Memory**: Main process < 250MB at rest
- **Error handling**: All capture/AI errors surfaced in overlay error state — never silent or blank
- **Security**: API key encrypted at rest. No `nodeIntegration: true`. All IPC through `contextBridge`.
- **Platform**: macOS 12+ (primary), Windows 10+ (secondary), Linux best-effort

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"vite --config vite.overlay.config.ts\" \"wait-on dist/renderer/index.html dist/overlay/index.html && electron .\"",
    "build": "vite build && vite build --config vite.overlay.config.ts && electron-builder",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

---

## GitHub Actions

### `.github/workflows/test.yml`
- Trigger: push + PR to main
- Jobs:
  - `lint`: ESLint + `tsc --noEmit` on ubuntu-latest
  - `unit-tests`: `npm run test:unit` on ubuntu-latest
  - `integration-tests`: `npm run test:integration` on ubuntu-latest
  - `e2e-tests`: `npm run test:e2e` on macos-latest and windows-latest

### `.github/workflows/build.yml`
- Trigger: push to main
- Build macOS `.dmg` + Windows `.exe` (nsis) via electron-builder
- Upload to GitHub Releases

---

## Implementation Notes & Gotchas

1. **Two separate Vite builds**: `vite.config.ts` → `dist/renderer`. `vite.overlay.config.ts` → `dist/overlay`. Each has its own `index.html`. Main process loads each window from its dist path.

2. **Preload scripts**: `src/main/preloads/mainPreload.ts` and `overlayPreload.ts`. Only expose relevant IPC channels per window via `contextBridge.exposeInMainWorld`. Never expose `ipcRenderer` directly.

3. **Gemini Vision format**:
   ```ts
   { inlineData: { mimeType: 'image/png', data: base64String } }
   ```
   Raw base64 only — no `data:image/png;base64,` prefix.

4. **Content protection timing**: Call `setContentProtection(true)` inside `overlayWindow.once('show', ...)`, not in the constructor. Calling it before show is a silent no-op on some macOS versions.

5. **Overlay focus for typing**: Default `focusable: false` means `PromptInput` won't receive keyboard events. On `OVERLAY_MOUSE_ENTER` IPC, main calls `setFocusable(true)` then `focus()`. On `OVERLAY_MOUSE_LEAVE`, calls `setFocusable(false)`. This allows typing inside the overlay without stealing focus from the underlying app when not hovered.

6. **Cmd+Enter: global vs local**: The `globalShortcut` fires even when the overlay isn't focused (sends empty `userPrompt`). The `PromptInput` also handles `Cmd+Enter` locally (sends typed text). Both paths call the same `TRIGGER` IPC handler. The global shortcut is the "quick screenshot + ask" path; the input is the "type a question first" path.

7. **Cancel-on-new-request**: Track an `AbortController` in `geminiClient.ts`. Pass its signal to the SDK call. On new request, call `currentController.abort()` before creating a new one.

8. **Test mocking for Electron**: `tests/__mocks__/electron.ts` must stub `desktopCapturer.getSources` to return a fake source whose `thumbnail.toPNG()` returns a valid PNG Buffer, and stub `nativeImage.createFromBuffer` accordingly.

9. **Overlay drag**: Track drag state in the overlay renderer with `onMouseDown`/`onMouseMove`/`onMouseUp` on the drag handle. Send `OVERLAY_DRAG` deltas only while dragging. Main process adds deltas to current `{ x, y }` and calls `setPosition`. Persist final position to store on `mouseup`.

10. **Rate limiting**: Gemini free tier is 15 RPM. Manual triggers make this unlikely to hit, but the retry-once-on-429 logic in `geminiClient.ts` handles it gracefully if it does.
