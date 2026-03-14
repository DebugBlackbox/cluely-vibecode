"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShortcuts = registerShortcuts;
exports.unregisterAll = unregisterAll;
const electron_1 = require("electron");
function registerShortcuts(deps) {
    const { onTrigger, onToggleOverlay, getPreferences } = deps;
    const prefs = getPreferences();
    // Register trigger shortcut
    const triggerShortcut = prefs.triggerShortcut;
    const triggerRegistered = electron_1.globalShortcut.register(triggerShortcut, () => {
        onTrigger();
    });
    if (!triggerRegistered) {
        console.warn(`globalShortcuts: failed to register trigger shortcut "${triggerShortcut}"`);
    }
    // Register toggle overlay shortcut
    const toggleShortcut = prefs.toggleShortcut;
    const toggleRegistered = electron_1.globalShortcut.register(toggleShortcut, () => {
        onToggleOverlay();
    });
    if (!toggleRegistered) {
        console.warn(`globalShortcuts: failed to register toggle shortcut "${toggleShortcut}"`);
    }
    // Unregister all on app quit
    electron_1.app.on('will-quit', () => {
        unregisterAll();
    });
}
function unregisterAll() {
    electron_1.globalShortcut.unregisterAll();
}
