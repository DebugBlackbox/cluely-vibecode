"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const mainWindow_1 = require("./windows/mainWindow");
const overlayWindow_1 = require("./windows/overlayWindow");
const handlers_1 = require("./ipc/handlers");
const globalShortcuts_1 = require("./shortcuts/globalShortcuts");
const screenCapture_1 = require("./capture/screenCapture");
const promptBuilder_1 = require("./ai/promptBuilder");
const geminiClient_1 = require("./ai/geminiClient");
const fileParser_1 = require("./files/fileParser");
const persistentStore_1 = require("./store/persistentStore");
let tray = null;
function getPreloadPath(filename) {
    // In dev the compiled preloads live at dist/main/preloads/<name>.js
    // In production same path relative to app.getAppPath()
    return path_1.default.join(__dirname, 'preloads', filename);
}
function getRendererURL(port, htmlFile) {
    if (!electron_1.app.isPackaged) {
        return `http://localhost:${port}`;
    }
    return `file://${path_1.default.join(electron_1.app.getAppPath(), 'dist', 'renderer', htmlFile)}`;
}
function getOverlayURL() {
    if (!electron_1.app.isPackaged) {
        return 'http://localhost:5174';
    }
    return `file://${path_1.default.join(electron_1.app.getAppPath(), 'dist', 'overlay', 'index.html')}`;
}
function createTray() {
    // Use an empty 16x16 image if no icon is available
    let trayIcon = electron_1.nativeImage.createEmpty();
    try {
        const iconPath = path_1.default.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
        trayIcon = electron_1.nativeImage.createFromPath(iconPath);
    }
    catch {
        // Use empty icon as fallback
    }
    tray = new electron_1.Tray(trayIcon);
    tray.setToolTip('Cluely');
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show / Hide',
            click: () => {
                const win = (0, mainWindow_1.getMainWindow)();
                if (win) {
                    if (win.isVisible()) {
                        win.hide();
                    }
                    else {
                        win.show();
                        win.focus();
                    }
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                // Remove close prevention so the app actually quits
                const win = (0, mainWindow_1.getMainWindow)();
                if (win) {
                    win.removeAllListeners('close');
                }
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        const win = (0, mainWindow_1.getMainWindow)();
        if (win) {
            if (!win.isVisible()) {
                win.show();
            }
            win.focus();
        }
    });
}
async function onTrigger() {
    // Show the overlay before streaming starts
    (0, overlayWindow_1.showOverlay)();
    const overlayWin = (0, overlayWindow_1.getOverlayWindow)();
    if (!overlayWin)
        return;
    const store = (0, persistentStore_1.getStore)();
    const apiKey = store.get('geminiApiKey');
    if (!apiKey) {
        overlayWin.webContents.send('stream:error', { message: 'API key not set' });
        return;
    }
    let screenshotBase64;
    try {
        screenshotBase64 = await (0, screenCapture_1.captureScreen)();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        overlayWin.webContents.send('stream:error', { message: `Screen capture failed: ${msg}` });
        return;
    }
    const systemPrompt = store.get('systemPrompt');
    const uploadedFiles = store.get('uploadedFiles');
    const parsedFileCache = store.get('parsedFileCache');
    const fileContexts = uploadedFiles
        .map((f) => {
        const content = parsedFileCache[f.hash];
        if (!content)
            return null;
        return { filename: f.filename, content };
    })
        .filter((fc) => fc !== null);
    const messages = (0, promptBuilder_1.buildMessages)({
        systemPrompt,
        userPrompt: '',
        screenshotBase64,
        fileContexts,
    });
    overlayWin.webContents.send('stream:clear');
    await (0, geminiClient_1.streamResponse)(messages, (token) => overlayWin.webContents.send('stream:token', { token }), () => overlayWin.webContents.send('stream:done'), (err) => overlayWin.webContents.send('stream:error', { message: err.message }));
}
electron_1.app.whenReady().then(() => {
    const mainPreloadPath = getPreloadPath('mainPreload.js');
    const overlayPreloadPath = getPreloadPath('overlayPreload.js');
    const mainWin = (0, mainWindow_1.createMainWindow)(mainPreloadPath);
    const overlayWin = (0, overlayWindow_1.createOverlayWindow)(overlayPreloadPath);
    // Load renderer content
    const mainURL = getRendererURL(5173, 'index.html');
    mainWin.loadURL(mainURL);
    const overlayURL = getOverlayURL();
    overlayWin.loadURL(overlayURL);
    // Register all IPC handlers via dependency injection
    (0, handlers_1.registerHandlers)({
        captureScreen: screenCapture_1.captureScreen,
        buildMessages: promptBuilder_1.buildMessages,
        streamResponse: geminiClient_1.streamResponse,
        parseFile: fileParser_1.parseFile,
        store: (0, persistentStore_1.getStore)(),
        getOverlayWindow: overlayWindow_1.getOverlayWindow,
    });
    // Register global shortcuts
    (0, globalShortcuts_1.registerShortcuts)({
        onTrigger: () => {
            onTrigger().catch((err) => {
                console.error('onTrigger error:', err);
            });
        },
        onToggleOverlay: () => (0, overlayWindow_1.toggleOverlay)(),
        getPreferences: persistentStore_1.getPreferences,
        mainWindow: mainWin,
    });
    createTray();
});
// Restore main window on macOS dock click
electron_1.app.on('activate', () => {
    const win = (0, mainWindow_1.getMainWindow)();
    if (win) {
        win.show();
        win.focus();
    }
});
// Unregister shortcuts before quit
electron_1.app.on('will-quit', () => {
    (0, globalShortcuts_1.unregisterAll)();
});
// macOS: handle drag-and-drop file open
electron_1.app.on('open-file', (event, filePath) => {
    event.preventDefault();
    (0, fileParser_1.parseFile)(filePath)
        .then((fileContext) => {
        const win = (0, mainWindow_1.getMainWindow)();
        if (win) {
            win.webContents.send('file:added', fileContext);
        }
    })
        .catch((err) => {
        console.error('open-file parse error:', err);
    });
});
// Prevent default quit behavior — tray keeps app alive on non-macOS platforms
electron_1.app.on('window-all-closed', () => {
    // On macOS, window-all-closed should not quit (standard behavior)
    // On Windows/Linux: do nothing here; the tray keeps the app alive
    // (Electron only auto-quits on window-all-closed on non-macOS if not prevented)
});
