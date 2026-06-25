import { ipcMain, app } from 'electron'
import { IPC, type IpcResult } from '@shared/ipc'
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
}
