/**
 * Main <-> Renderer IPC kanal isimleri ve sözleşme tipleri.
 * Sırlar yalnız main process'te tutulur; renderer bu kanallar üzerinden konuşur.
 */

export const IPC = {
  app: {
    getVersion: 'app:getVersion',
    checkForUpdates: 'app:checkForUpdates'
  },
  config: {
    getStatus: 'config:getStatus'
  },
  ticimax: {
    selectUrun: 'ticimax:selectUrun',
    saveUrun: 'ticimax:saveUrun',
    selectSiparis: 'ticimax:selectSiparis',
    setSiparisDurum: 'ticimax:setSiparisDurum'
  },
  ups: {
    createShipment: 'ups:createShipment',
    track: 'ups:track'
  },
  fx: {
    getRates: 'fx:getRates'
  }
} as const

/** Tüm IPC çağrıları bu zarf ile döner (tutarlı hata yönetimi). */
export interface IpcResult<T> {
  ok: boolean
  data: T | null
  error: string | null
}

export interface AppVersionInfo {
  version: string
  name: string
}

/** Bağlantı/sır yapılandırma durumu — Ayarlar ekranı için (sır değerleri DÖNMEZ). */
export interface ConfigStatus {
  ticimax: boolean
  ups: boolean
  supabase: boolean
  github: boolean
}
