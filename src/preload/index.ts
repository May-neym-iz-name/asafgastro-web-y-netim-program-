import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC, type IpcResult, type AppVersionInfo, type ConfigStatus } from '@shared/ipc'

/**
 * Renderer'a açılan güvenli API. nodeIntegration kapalı, contextIsolation açık.
 * Renderer doğrudan Node/Electron'a erişemez; yalnız buradaki yüzeyi kullanır.
 */
const api = {
  app: {
    getVersion: (): Promise<IpcResult<AppVersionInfo>> => ipcRenderer.invoke(IPC.app.getVersion),
    checkForUpdates: (): Promise<IpcResult<string | null>> =>
      ipcRenderer.invoke(IPC.app.checkForUpdates)
  },
  config: {
    getStatus: (): Promise<IpcResult<ConfigStatus>> => ipcRenderer.invoke(IPC.config.getStatus)
  }
}

export type AsafApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (contextIsolation kapalıysa fallback — normalde kullanılmaz)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
