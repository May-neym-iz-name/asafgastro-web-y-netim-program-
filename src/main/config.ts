import { app } from 'electron'
import dotenv from 'dotenv'
import { join } from 'path'
import type { ConfigStatus } from '@shared/ipc'

/**
 * Uygulama yapılandırması. Sırlar yalnız main process'te okunur, renderer'a
 * asla ham olarak geçmez. Geliştirmede proje kökündeki .env, paketlenmiş
 * uygulamada kullanıcı veri klasöründeki .env okunur.
 */

let loaded = false

function ensureLoaded(): void {
  if (loaded) return
  // Geliştirme: proje kökü; Paket: userData/.env
  const devPath = join(process.cwd(), '.env')
  const prodPath = join(app.getPath('userData'), '.env')
  dotenv.config({ path: app.isPackaged ? prodPath : devPath })
  loaded = true
}

function get(key: string): string {
  ensureLoaded()
  return (process.env[key] ?? '').trim()
}

export const config = {
  ticimax: {
    get wsKey(): string {
      return get('TICIMAX_WS_KEY')
    },
    get baseUrl(): string {
      return get('TICIMAX_BASE_URL') || 'https://www.asafgastro.com'
    }
  },
  ups: {
    get customerCode(): string {
      return get('UPS_CUSTOMER_CODE')
    },
    get userCode(): string {
      return get('UPS_USER_CODE')
    },
    get userPass(): string {
      return get('UPS_USER_PASS')
    }
  },
  supabase: {
    get url(): string {
      return get('SUPABASE_URL')
    },
    get anonKey(): string {
      return get('SUPABASE_ANON_KEY')
    },
    get serviceKey(): string {
      return get('SUPABASE_SERVICE_KEY')
    }
  },
  github: {
    get token(): string {
      return get('GH_RELEASE_TOKEN')
    }
  }
}

/** Renderer'a yalnız "ayarlanmış mı" bilgisini döndürür — sır değeri değil. */
export function getConfigStatus(): ConfigStatus {
  return {
    ticimax: Boolean(config.ticimax.wsKey),
    ups: Boolean(config.ups.customerCode && config.ups.userCode && config.ups.userPass),
    supabase: Boolean(config.supabase.url && config.supabase.anonKey),
    github: Boolean(config.github.token)
  }
}
