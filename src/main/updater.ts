import electronUpdater from 'electron-updater'
import type { BrowserWindow } from 'electron'

// electron-updater CommonJS modülü; ESM'de named export çözülmez → default'tan al
const { autoUpdater } = electronUpdater

/**
 * GitHub Releases üzerinden otomatik sürüm güncelleme.
 * Yapılandırma electron-builder.yml > publish (github) üzerinden gelir.
 */
export function initAutoUpdater(_win: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err) => {
    console.error('[updater] hata:', err?.message ?? err)
  })
  autoUpdater.on('update-available', (info) => {
    console.info('[updater] güncelleme mevcut:', info.version)
  })
  autoUpdater.on('update-not-available', () => {
    console.info('[updater] güncel sürüm kullanılıyor')
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.info('[updater] indirildi, çıkışta kurulacak:', info.version)
  })
}

export async function checkForUpdates(): Promise<string | null> {
  try {
    const result = await autoUpdater.checkForUpdates()
    return result?.updateInfo?.version ?? null
  } catch (err) {
    console.error('[updater] kontrol hatası:', err)
    return null
  }
}
