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
  handle(IPC.ticimax.selectSiparis, (filtre, sayfalama) =>
    ticimax.selectSiparis(
      (filtre ?? {}) as WebSiparisFiltre,
      (sayfalama ?? {}) as Record<string, never>
    )
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
}
