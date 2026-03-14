"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
exports.getMainWindow = getMainWindow;
const electron_1 = require("electron");
let mainWindow = null;
function createMainWindow(preloadPath) {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 650,
        resizable: true,
        webPreferences: {
            contextIsolation: true,
            preload: preloadPath,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    // Log renderer console messages to main process stdout for debugging
    mainWindow.webContents.on('console-message', (_e, level, msg, line, sourceId) => {
        console.log(`[renderer:${level}] ${msg} (${sourceId}:${line})`);
    });
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.error(`[main-window] did-fail-load: ${code} ${desc} url=${url}`);
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[main-window] did-finish-load');
    });
    // Hide to tray on close instead of quitting
    mainWindow.on('close', (e) => {
        e.preventDefault();
        mainWindow?.hide();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    return mainWindow;
}
function getMainWindow() {
    return mainWindow;
}
