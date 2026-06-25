import { ipcMain, app } from 'electron'
import { IPC, type IpcResult } from '@shared/ipc'
import { getConfigStatus } from '../config'
import { checkForUpdates } from '../updater'

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
}
