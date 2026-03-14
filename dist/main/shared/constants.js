"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_TOKEN_DELAY_MS = exports.RATE_LIMIT_RETRY_DELAY_MS = exports.SCREENSHOT_MAX_WIDTH = exports.TOTAL_CHAR_WARN_THRESHOLD = exports.MAX_FILE_PROMPT_CHARS = exports.MAX_FILE_CHARS = exports.GEMINI_MODEL = exports.DEFAULT_PREFERENCES = exports.DEFAULT_SYSTEM_PROMPT = exports.IPC = void 0;
exports.IPC = {
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
};
exports.DEFAULT_SYSTEM_PROMPT = "You are an invisible AI assistant observing the user's screen. Be concise and direct.\n" +
    'Use bullet points. Max 5 bullets. If the user asks a specific question, answer it directly.\n' +
    "If no question is given, surface the most relevant insight from what's on screen.";
exports.DEFAULT_PREFERENCES = {
    triggerShortcut: 'CommandOrControl+Return',
    toggleShortcut: 'CommandOrControl+Shift+Space',
    autoDismissMs: 0,
    overlayOpacity: 0.95,
};
exports.GEMINI_MODEL = 'gemini-2.0-flash';
exports.MAX_FILE_CHARS = 8000;
exports.MAX_FILE_PROMPT_CHARS = 4000;
exports.TOTAL_CHAR_WARN_THRESHOLD = 40000;
exports.SCREENSHOT_MAX_WIDTH = 1280;
exports.RATE_LIMIT_RETRY_DELAY_MS = 5000;
exports.TEST_TOKEN_DELAY_MS = 20;
