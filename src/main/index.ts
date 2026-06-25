import { app, shell, BrowserWindow, protocol, net } from 'electron'
import { join, basename } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { initAutoUpdater } from './updater'
import { IPC } from '@shared/ipc'

// Katalog PDF'leri için güvenli özel protokol (base64/data-URL limiti olmadan stream eder)
protocol.registerSchemesAsPrivileged([
  { scheme: 'safepdf', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

function registerCatalogProtocol(): void {
  protocol.handle('safepdf', async (request) => {
    try {
      const url = new URL(request.url) // safepdf://katalog/<dosya.pdf>
      const id = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
      const ad = basename(id)
      if (ad !== id || !/\.pdf$/i.test(ad)) return new Response('Geçersiz', { status: 400 })
      const dosya = join(app.getPath('userData'), 'catalogs', ad)
      return net.fetch(pathToFileURL(dosya).toString())
    } catch {
      return new Response('Bulunamadı', { status: 404 })
    }
  })
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Asaf Gastro Web Yönetim',
    backgroundColor: '#fff7ed',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      // sandbox: ESM preload ile uyumsuz; CJS'e geçiş + test sonrası açılacak.
      // contextIsolation açık + preload yalnız contextBridge ile minimal api açar.
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // Ctrl+F arama sonuçlarını renderer'a ilet
  mainWindow.webContents.on('found-in-page', (_e, result) => {
    mainWindow.webContents.send(IPC.app.findResult, {
      active: result.activeMatchOrdinal,
      matches: result.matches
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Yalnız http/https dış bağlantılar açılır (file:, custom protocol istismarını engeller)
    try {
      const u = new URL(details.url)
      if (u.protocol === 'https:' || u.protocol === 'http:') shell.openExternal(details.url)
    } catch {
      /* hatalı URL — yok say */
    }
    return { action: 'deny' }
  })

  // Geliştirmede Vite dev server, pakette derlenmiş HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.asafgastro.webyonetim')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  registerCatalogProtocol()

  const win = createWindow()

  if (app.isPackaged) {
    initAutoUpdater(win)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
