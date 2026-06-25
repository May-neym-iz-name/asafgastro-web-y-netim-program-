import type { ElectronAPI } from '@electron-toolkit/preload'
import type { AsafApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: AsafApi
  }
}

export {}
