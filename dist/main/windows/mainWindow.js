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
        },
    });
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
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
