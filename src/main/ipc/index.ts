import { ipcMain, app, dialog, BrowserWindow } from 'electron'
import { readFile, copyFile, readdir, unlink, mkdir } from 'fs/promises'
import { basename, join } from 'path'
import { IPC, type IpcResult } from '@shared/ipc'

const MAKS_KATALOG_BYTE = 60 * 1024 * 1024 // 60 MB

/** Kataloglar uygulama veri klasöründe saklanır: userData/catalogs */
function catalogDir(): string {
  return join(app.getPath('userData'), 'catalogs')
}
/** id (dosya adı) güvenliği: yalnız basename + .pdf (path traversal koruması). */
function guvenliKatalogId(id: string): string {
  const ad = basename(String(id))
  if (ad !== String(id) || !/\.pdf$/i.test(ad)) throw new Error('Geçersiz katalog adı')
  return ad
}
import { getConfigStatus } from '../config'
import { checkForUpdates } from '../updater'
import * as ticimax from '../services/ticimax'
import type { UrunFiltre } from '../services/ticimax'
import type { WebSiparisFiltre } from '../services/ticimax'
import * as ups from '../services/ups'
import type { GonderiGirdi } from '../services/ups'
import { getRates } from '../services/fx'
import type { FxKaynak } from '@shared/domain'
import * as supabase from '../services/supabase'
import type { SupplierPrice, FxSettings } from '../services/supabase'

/** IPC handler'ı tutarlı IpcResult zarfıyla sarmalar. */
function handle<T>(channel: string, fn: (...args: unknown[]) => Promise<T> | T): void {
  ipcMain.handle(channel, async (_evt, ...args): Promise<IpcResult<T>> => {
    try {
      const data = await fn(...args)
      return { ok: true, data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[ipc:${channel}]`, message)
      return { ok: false, data: null, error: message }
    }
  })
}

/**
 * Phase 0: temel kanallar (sürüm, yapılandırma durumu).
 * Phase 1: ticimax/ups/fx handler'ları burada kayıt edilecek.
 */
export function registerIpcHandlers(): void {
  handle(IPC.app.getVersion, () => ({ version: app.getVersion(), name: app.getName() }))
  handle(IPC.app.checkForUpdates, () => checkForUpdates())
  handle(IPC.app.find, (text, options) => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const t = String(text ?? '')
    if (!t) {
      win?.webContents.stopFindInPage('clearSelection')
      return null
    }
    win?.webContents.findInPage(t, (options ?? {}) as Electron.FindInPageOptions)
    return null
  })
  handle(IPC.app.stopFind, () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    win?.webContents.stopFindInPage('clearSelection')
    return null
  })
  handle(IPC.config.getStatus, () => getConfigStatus())

  // --- Ticimax (okuma) ---
  handle(IPC.ticimax.selectUrun, (filtre, sayfalama) =>
    ticimax.selectUrun((filtre ?? {}) as UrunFiltre, (sayfalama ?? {}) as Record<string, never>)
  )
  handle(IPC.ticimax.selectUrunCount, (filtre) =>
    ticimax.selectUrunCount((filtre ?? {}) as UrunFiltre)
  )
  handle(IPC.ticimax.selectParaBirimi, () => ticimax.selectParaBirimi())
  handle(IPC.ticimax.selectKategori, (kategoriID, parentID) =>
    ticimax.selectKategori((kategoriID ?? 0) as number, (parentID ?? -1) as number)
  )
  handle(IPC.ticimax.selectMarka, () => ticimax.selectMarka())
  handle(IPC.ticimax.selectTedarikci, () => ticimax.selectTedarikci())
  handle(IPC.ticimax.saveUrun, (urunKartlari, ukAyar, vAyar) =>
    ticimax.saveUrun(
      (urunKartlari ?? []) as Parameters<typeof ticimax.saveUrun>[0],
      (ukAyar ?? {}) as Parameters<typeof ticimax.saveUrun>[1],
      (vAyar ?? {}) as Parameters<typeof ticimax.saveUrun>[2]
    )
  )
  handle(IPC.ticimax.selectSiparis, (filtre, sayfalama) =>
    ticimax.selectSiparis(
      (filtre ?? {}) as WebSiparisFiltre,
      (sayfalama ?? {}) as Record<string, never>
    )
  )
  handle(IPC.ticimax.setSiparisDurum, (params) =>
    ticimax.setSiparisDurum(params as Parameters<typeof ticimax.setSiparisDurum>[0])
  )
  handle(IPC.ticimax.saveKargoTakipNo, (params) =>
    ticimax.saveKargoTakipNo(params as Parameters<typeof ticimax.saveKargoTakipNo>[0])
  )

  // --- UPS Kargo ---
  handle(IPC.ups.createShipment, (girdi) => ups.createShipment(girdi as GonderiGirdi))
  handle(IPC.ups.cancelShipment, (waybill) => ups.cancelShipment(waybill as string))
  handle(IPC.ups.track, (trackingNo) => ups.getLastTransaction(trackingNo as string))
  handle(IPC.ups.listCities, () => ups.listCities())
  handle(IPC.ups.listDistricts, (cityId) => ups.listDistricts(cityId as number))
  handle(IPC.ups.listAreas, (cityCode) => ups.listAreas(cityCode as number))
  handle(IPC.ups.resolveArea, (cityCode, query) =>
    ups.resolveArea(cityCode as number, query as string)
  )

  // --- Katalog PDF (uygulama klasöründe saklanır) ---
  handle(IPC.catalog.add, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      title: 'Katalog PDF seç',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (result.canceled) return []
    const dir = catalogDir()
    await mkdir(dir, { recursive: true })
    const eklenen: { id: string; ad: string }[] = []
    for (const p of result.filePaths) {
      const ad = basename(p)
      await copyFile(p, join(dir, ad)) // uygulama klasörüne kopyala
      eklenen.push({ id: ad, ad })
    }
    return eklenen
  })
  handle(IPC.catalog.list, async () => {
    try {
      const files = await readdir(catalogDir())
      return files.filter((f) => /\.pdf$/i.test(f)).map((f) => ({ id: f, ad: f }))
    } catch {
      return []
    }
  })
  handle(IPC.catalog.read, async (id) => {
    const ad = guvenliKatalogId(id as string)
    const buf = await readFile(join(catalogDir(), ad))
    if (buf.byteLength > MAKS_KATALOG_BYTE) throw new Error('Katalog 60 MB sınırını aşıyor')
    return `data:application/pdf;base64,${buf.toString('base64')}`
  })
  handle(IPC.catalog.delete, async (id) => {
    await unlink(join(catalogDir(), guvenliKatalogId(id as string)))
    return null
  })

  // --- Döviz (FX) ---
  handle(IPC.fx.getRates, (kaynak, kodlar) =>
    getRates((kaynak ?? 'TCMB') as FxKaynak, (kodlar ?? ['USD', 'EUR']) as string[])
  )

  // --- Supabase (auth + senkron) ---
  handle(IPC.supabase.signIn, (email, sifre) =>
    supabase.signIn(email as string, sifre as string)
  )
  handle(IPC.supabase.signOut, () => supabase.signOut())
  handle(IPC.supabase.currentUser, () => supabase.currentUser())
  handle(IPC.supabase.listSupplierPrices, () => supabase.listSupplierPrices())
  handle(IPC.supabase.upsertSupplierPrices, (rows) =>
    supabase.upsertSupplierPrices((rows ?? []) as SupplierPrice[])
  )
  handle(IPC.supabase.getFxSettings, () => supabase.getFxSettings())
  handle(IPC.supabase.setFxSettings, (s) => supabase.setFxSettings((s ?? {}) as Partial<FxSettings>))
  handle(IPC.supabase.listRoles, () => supabase.listRoles())
  handle(IPC.supabase.listProfiles, () => supabase.listProfiles())
  handle(IPC.supabase.setUserRole, (userId, roleId) =>
    supabase.setUserRole(userId as string, roleId as number)
  )
}
