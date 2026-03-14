"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../../../shared/constants');
contextBridge.exposeInMainWorld('electronAPI', {
    trigger: (userPrompt) => ipcRenderer.invoke(IPC.TRIGGER, { userPrompt }),
    addFile: (filePath) => ipcRenderer.invoke(IPC.ADD_FILE, { filePath }),
    removeFile: (hash) => ipcRenderer.invoke(IPC.REMOVE_FILE, { hash }),
    getFiles: () => ipcRenderer.invoke(IPC.GET_FILES),
    getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),
    onStreamToken: (cb) => {
        ipcRenderer.on(IPC.STREAM_TOKEN, (_, payload) => cb(payload.token));
    },
    onStreamDone: (cb) => {
        ipcRenderer.on(IPC.STREAM_DONE, () => cb());
    },
    onStreamError: (cb) => {
        ipcRenderer.on(IPC.STREAM_ERROR, (_, payload) => cb(payload.message));
    },
    onStreamClear: (cb) => {
        ipcRenderer.on(IPC.STREAM_CLEAR, () => cb());
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
});
