"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = getStore;
exports.getApiKey = getApiKey;
exports.setApiKey = setApiKey;
exports.getSystemPrompt = getSystemPrompt;
exports.setSystemPrompt = setSystemPrompt;
exports.getUploadedFiles = getUploadedFiles;
exports.addUploadedFile = addUploadedFile;
exports.removeUploadedFileByHash = removeUploadedFileByHash;
exports.getParsedFileCache = getParsedFileCache;
exports.getCachedParsedFile = getCachedParsedFile;
exports.setCachedParsedFile = setCachedParsedFile;
exports.getOverlayPosition = getOverlayPosition;
exports.setOverlayPosition = setOverlayPosition;
exports.getPreferences = getPreferences;
exports.setPreferences = setPreferences;
exports.saveSettings = saveSettings;
const electron_store_1 = __importDefault(require("electron-store"));
const constants_1 = require("../../shared/constants");
const store = new electron_store_1.default({
    encryptionKey: 'cluely-store-key',
    defaults: {
        geminiApiKey: '',
        systemPrompt: '',
        uploadedFiles: [],
        parsedFileCache: {},
        overlayPosition: null,
        preferences: { ...constants_1.DEFAULT_PREFERENCES },
    },
});
// Expose raw store for dependency injection in handlers
function getStore() {
    return store;
}
// --- API Key ---
function getApiKey() {
    return store.get('geminiApiKey');
}
function setApiKey(key) {
    store.set('geminiApiKey', key);
}
// --- System Prompt ---
function getSystemPrompt() {
    return store.get('systemPrompt');
}
function setSystemPrompt(prompt) {
    store.set('systemPrompt', prompt);
}
// --- Uploaded Files ---
function getUploadedFiles() {
    return store.get('uploadedFiles');
}
function addUploadedFile(file) {
    const current = store.get('uploadedFiles');
    // Avoid duplicates by hash
    const filtered = current.filter((f) => f.hash !== file.hash);
    store.set('uploadedFiles', [...filtered, file]);
}
function removeUploadedFileByHash(hash) {
    const current = store.get('uploadedFiles');
    store.set('uploadedFiles', current.filter((f) => f.hash !== hash));
}
// --- Parsed File Cache ---
function getParsedFileCache() {
    return store.get('parsedFileCache');
}
function getCachedParsedFile(hash) {
    const cache = store.get('parsedFileCache');
    return cache[hash];
}
function setCachedParsedFile(hash, content) {
    const cache = store.get('parsedFileCache');
    store.set('parsedFileCache', { ...cache, [hash]: content });
}
// --- Overlay Position ---
function getOverlayPosition() {
    return store.get('overlayPosition');
}
function setOverlayPosition(pos) {
    store.set('overlayPosition', pos);
}
// --- Preferences ---
function getPreferences() {
    return store.get('preferences');
}
function setPreferences(prefs) {
    const current = store.get('preferences');
    store.set('preferences', { ...current, ...prefs });
}
// --- Settings (combined) ---
function saveSettings(partial) {
    if (partial.geminiApiKey !== undefined) {
        store.set('geminiApiKey', partial.geminiApiKey);
    }
    if (partial.systemPrompt !== undefined) {
        store.set('systemPrompt', partial.systemPrompt);
    }
    if (partial.preferences !== undefined) {
        setPreferences(partial.preferences);
    }
}
