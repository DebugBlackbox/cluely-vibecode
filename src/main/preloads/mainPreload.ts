// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { IPC } = require('../../shared/constants') as typeof import('../../shared/constants')

export {}

contextBridge.exposeInMainWorld('electronAPI', {
  trigger: (userPrompt: string) =>
    ipcRenderer.invoke(IPC.TRIGGER, { userPrompt }),

  addFile: (filePath: string) =>
    ipcRenderer.invoke(IPC.ADD_FILE, { filePath }),

  removeFile: (hash: string) =>
    ipcRenderer.invoke(IPC.REMOVE_FILE, { hash }),

  getFiles: () =>
    ipcRenderer.invoke(IPC.GET_FILES),

  getSettings: () =>
    ipcRenderer.invoke(IPC.GET_SETTINGS),

  saveSettings: (settings: any) =>
    ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),

  onStreamToken: (cb: (token: string) => void) => {
    ipcRenderer.on(IPC.STREAM_TOKEN, (_: any, payload: { token: string }) => cb(payload.token))
  },

  onStreamDone: (cb: () => void) => {
    ipcRenderer.on(IPC.STREAM_DONE, () => cb())
  },

  onStreamError: (cb: (msg: string) => void) => {
    ipcRenderer.on(IPC.STREAM_ERROR, (_: any, payload: { message: string }) => cb(payload.message))
  },

  onStreamClear: (cb: () => void) => {
    ipcRenderer.on(IPC.STREAM_CLEAR, () => cb())
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
