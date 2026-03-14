"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOverlayWindow = createOverlayWindow;
exports.getOverlayWindow = getOverlayWindow;
exports.showOverlay = showOverlay;
exports.hideOverlay = hideOverlay;
exports.toggleOverlay = toggleOverlay;
const electron_1 = require("electron");
const persistentStore_1 = require("../store/persistentStore");
let overlayWindow = null;
function createOverlayWindow(preloadPath) {
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const windowWidth = 480;
    const windowHeight = 600;
    // Use persisted position or default to bottom-right
    const savedPosition = (0, persistentStore_1.getOverlayPosition)();
    const defaultX = screenWidth - windowWidth - 20;
    const defaultY = screenHeight - windowHeight - 20;
    const startX = savedPosition?.x ?? defaultX;
    const startY = savedPosition?.y ?? defaultY;
    overlayWindow = new electron_1.BrowserWindow({
        x: startX,
        y: startY,
        width: windowWidth,
        height: windowHeight,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        focusable: false,
        skipTaskbar: true,
        hasShadow: false,
        resizable: false,
        webPreferences: {
            contextIsolation: true,
            preload: preloadPath,
            nodeIntegration: false,
        },
    });
    // Ignore mouse events by default (overlay is pass-through)
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    // Set content protection after the window is first shown to avoid constructor issues
    overlayWindow.once('show', () => {
        if (overlayWindow) {
            overlayWindow.setContentProtection(true);
            // On Windows: attempt to use WDA_EXCLUDEFROMCAPTURE via native addon (graceful fallback)
            if (process.platform === 'win32') {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const nativeAddon = require('win-capture-exclusion');
                    nativeAddon.excludeFromCapture(overlayWindow.getNativeWindowHandle());
                }
                catch {
                    // Native addon not available — setContentProtection(true) is sufficient fallback
                }
            }
        }
    });
    // Persist position when the window is moved
    overlayWindow.on('moved', () => {
        if (overlayWindow) {
            const [x, y] = overlayWindow.getPosition();
            (0, persistentStore_1.setOverlayPosition)({ x, y });
        }
    });
    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
    return overlayWindow;
}
function getOverlayWindow() {
    return overlayWindow;
}
function showOverlay() {
    if (overlayWindow) {
        overlayWindow.show();
    }
}
function hideOverlay() {
    if (overlayWindow) {
        overlayWindow.hide();
    }
}
function toggleOverlay() {
    if (!overlayWindow)
        return;
    if (overlayWindow.isVisible()) {
        hideOverlay();
    }
    else {
        showOverlay();
    }
}
