"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../shared/constants");
function registerHandlers(deps) {
    const { captureScreen, buildMessages, streamResponse, parseFile, store, getOverlayWindow } = deps;
    // --- TRIGGER ---
    electron_1.ipcMain.handle(constants_1.IPC.TRIGGER, async (_event, payload) => {
        const apiKey = store.get('geminiApiKey');
        if (!apiKey) {
            const overlayWin = getOverlayWindow();
            overlayWin?.webContents.send(constants_1.IPC.STREAM_ERROR, { message: 'API key not set' });
            return;
        }
        let screenshotBase64;
        try {
            screenshotBase64 = await captureScreen();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const overlayWin = getOverlayWindow();
            overlayWin?.webContents.send(constants_1.IPC.STREAM_ERROR, { message: `Screen capture failed: ${msg}` });
            return;
        }
        const systemPrompt = store.get('systemPrompt');
        const uploadedFiles = store.get('uploadedFiles');
        const parsedFileCache = store.get('parsedFileCache');
        // Build FileContext from uploaded files using cached parsed content
        const fileContexts = uploadedFiles
            .map((f) => {
            const content = parsedFileCache[f.hash];
            if (!content)
                return null;
            return { filename: f.filename, content };
        })
            .filter((fc) => fc !== null);
        const messages = buildMessages({
            systemPrompt,
            userPrompt: payload?.userPrompt ?? '',
            screenshotBase64,
            fileContexts,
        });
        const overlayWin = getOverlayWindow();
        // Clear previous response before starting new one
        overlayWin?.webContents.send(constants_1.IPC.STREAM_CLEAR);
        await streamResponse(messages, (token) => {
            overlayWin?.webContents.send(constants_1.IPC.STREAM_TOKEN, { token });
        }, () => {
            overlayWin?.webContents.send(constants_1.IPC.STREAM_DONE);
        }, (err) => {
            overlayWin?.webContents.send(constants_1.IPC.STREAM_ERROR, { message: err.message });
        });
    });
    // --- ADD_FILE ---
    electron_1.ipcMain.handle(constants_1.IPC.ADD_FILE, async (_event, payload) => {
        const buffer = fs_1.default.readFileSync(payload.filePath);
        const hash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
        const fileContext = await parseFile(payload.filePath);
        const uploadedFiles = store.get('uploadedFiles');
        // Avoid duplicates
        const exists = uploadedFiles.some((f) => f.hash === hash);
        if (!exists) {
            const newFile = {
                path: payload.filePath,
                filename: path_1.default.basename(payload.filePath),
                hash,
                contentPreview: fileContext.content.slice(0, 100),
                addedAt: new Date().toISOString(),
            };
            store.set('uploadedFiles', [...uploadedFiles, newFile]);
        }
        return fileContext;
    });
    // --- REMOVE_FILE ---
    electron_1.ipcMain.handle(constants_1.IPC.REMOVE_FILE, (_event, payload) => {
        const uploadedFiles = store.get('uploadedFiles');
        store.set('uploadedFiles', uploadedFiles.filter((f) => f.hash !== payload.hash));
    });
    // --- GET_FILES ---
    electron_1.ipcMain.handle(constants_1.IPC.GET_FILES, () => {
        return store.get('uploadedFiles');
    });
    // --- GET_SETTINGS ---
    electron_1.ipcMain.handle(constants_1.IPC.GET_SETTINGS, () => {
        return {
            geminiApiKey: store.get('geminiApiKey'),
            systemPrompt: store.get('systemPrompt'),
            uploadedFiles: store.get('uploadedFiles'),
            preferences: store.get('preferences'),
        };
    });
    // --- SAVE_SETTINGS ---
    electron_1.ipcMain.handle(constants_1.IPC.SAVE_SETTINGS, (_event, partial) => {
        if (partial.geminiApiKey !== undefined) {
            store.set('geminiApiKey', partial.geminiApiKey);
        }
        if (partial.systemPrompt !== undefined) {
            store.set('systemPrompt', partial.systemPrompt);
        }
        if (partial.preferences !== undefined) {
            const current = store.get('preferences');
            store.set('preferences', { ...current, ...partial.preferences });
        }
    });
    // --- OVERLAY_DRAG ---
    electron_1.ipcMain.on(constants_1.IPC.OVERLAY_DRAG, (_event, payload) => {
        const overlayWin = getOverlayWindow();
        if (!overlayWin)
            return;
        const [currentX, currentY] = overlayWin.getPosition();
        const newX = currentX + payload.deltaX;
        const newY = currentY + payload.deltaY;
        overlayWin.setPosition(newX, newY);
        store.set('overlayPosition', { x: newX, y: newY });
    });
    // --- OVERLAY_MOUSE_ENTER ---
    electron_1.ipcMain.on(constants_1.IPC.OVERLAY_MOUSE_ENTER, () => {
        const overlayWin = getOverlayWindow();
        if (!overlayWin)
            return;
        overlayWin.setIgnoreMouseEvents(false);
        overlayWin.setFocusable(true);
        overlayWin.focus();
    });
    // --- OVERLAY_MOUSE_LEAVE ---
    electron_1.ipcMain.on(constants_1.IPC.OVERLAY_MOUSE_LEAVE, () => {
        const overlayWin = getOverlayWindow();
        if (!overlayWin)
            return;
        overlayWin.setFocusable(false);
        overlayWin.setIgnoreMouseEvents(true, { forward: true });
    });
}
