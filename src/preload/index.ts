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
  },
  ticimax: {
    selectUrun: (filtre?: unknown, sayfalama?: unknown): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ticimax.selectUrun, filtre, sayfalama),
    selectUrunCount: (filtre?: unknown): Promise<IpcResult<number>> =>
      ipcRenderer.invoke(IPC.ticimax.selectUrunCount, filtre),
    selectParaBirimi: (): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ticimax.selectParaBirimi),
    selectKategori: (kategoriID?: number, parentID?: number): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ticimax.selectKategori, kategoriID, parentID),
    selectMarka: (): Promise<IpcResult<unknown[]>> => ipcRenderer.invoke(IPC.ticimax.selectMarka),
    selectTedarikci: (): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ticimax.selectTedarikci),
    saveUrun: (
      urunKartlari: unknown[],
      ukAyar: unknown,
      vAyar: unknown
    ): Promise<IpcResult<{ ok: boolean; raw: unknown }>> =>
      ipcRenderer.invoke(IPC.ticimax.saveUrun, urunKartlari, ukAyar, vAyar),
    selectSiparis: (filtre?: unknown, sayfalama?: unknown): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ticimax.selectSiparis, filtre, sayfalama)
  },
  ups: {
    track: (trackingNo: string): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.ups.track, trackingNo),
    listCities: (): Promise<IpcResult<{ cityId: number; cityName: string }[]>> =>
      ipcRenderer.invoke(IPC.ups.listCities),
    listDistricts: (cityId: number): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ups.listDistricts, cityId),
    listAreas: (cityCode: number): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.ups.listAreas, cityCode),
    resolveArea: (cityCode: number, query: string): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.ups.resolveArea, cityCode, query),
    createShipment: (girdi: unknown): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.ups.createShipment, girdi),
    cancelShipment: (waybill: string): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.ups.cancelShipment, waybill)
  },
  fx: {
    getRates: (kaynak?: string, kodlar?: string[]): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.fx.getRates, kaynak, kodlar)
  },
  supabase: {
    signIn: (email: string, sifre: string): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.supabase.signIn, email, sifre),
    signOut: (): Promise<IpcResult<unknown>> => ipcRenderer.invoke(IPC.supabase.signOut),
    currentUser: (): Promise<IpcResult<unknown>> => ipcRenderer.invoke(IPC.supabase.currentUser),
    listSupplierPrices: (): Promise<IpcResult<unknown[]>> =>
      ipcRenderer.invoke(IPC.supabase.listSupplierPrices),
    upsertSupplierPrices: (rows: unknown[]): Promise<IpcResult<number>> =>
      ipcRenderer.invoke(IPC.supabase.upsertSupplierPrices, rows),
    getFxSettings: (): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.supabase.getFxSettings),
    setFxSettings: (s: unknown): Promise<IpcResult<unknown>> =>
      ipcRenderer.invoke(IPC.supabase.setFxSettings, s)
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
