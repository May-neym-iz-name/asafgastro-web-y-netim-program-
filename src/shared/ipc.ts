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
    selectUrunCount: 'ticimax:selectUrunCount',
    selectParaBirimi: 'ticimax:selectParaBirimi',
    selectKategori: 'ticimax:selectKategori',
    selectMarka: 'ticimax:selectMarka',
    selectTedarikci: 'ticimax:selectTedarikci',
    saveUrun: 'ticimax:saveUrun',
    selectSiparis: 'ticimax:selectSiparis',
    setSiparisDurum: 'ticimax:setSiparisDurum',
    saveKargoTakipNo: 'ticimax:saveKargoTakipNo'
  },
  ups: {
    createShipment: 'ups:createShipment',
    cancelShipment: 'ups:cancelShipment',
    track: 'ups:track',
    listCities: 'ups:listCities',
    listDistricts: 'ups:listDistricts',
    listAreas: 'ups:listAreas',
    resolveArea: 'ups:resolveArea'
  },
  fx: {
    getRates: 'fx:getRates'
  },
  catalog: {
    pick: 'catalog:pick',
    read: 'catalog:read'
  },
  supabase: {
    signIn: 'supabase:signIn',
    signOut: 'supabase:signOut',
    currentUser: 'supabase:currentUser',
    listSupplierPrices: 'supabase:listSupplierPrices',
    upsertSupplierPrices: 'supabase:upsertSupplierPrices',
    getFxSettings: 'supabase:getFxSettings',
    setFxSettings: 'supabase:setFxSettings',
    listRoles: 'supabase:listRoles',
    listProfiles: 'supabase:listProfiles',
    setUserRole: 'supabase:setUserRole'
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
