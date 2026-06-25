import type { AsafApi } from './index'

declare global {
  interface Window {
    api: AsafApi
  }
}

export {}
