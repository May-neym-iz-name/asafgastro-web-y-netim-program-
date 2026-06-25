import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '../../config'

/**
 * Supabase istemcisi (main process). Runtime'da yalnız publishable (anon) key
 * + Auth + RLS kullanılır; service_role ASLA burada değil.
 * Node ortamında localStorage olmadığından bellek-tabanlı oturum deposu verilir.
 */

const memoryStore = new Map<string, string>()
const memoryStorage = {
  getItem: (k: string): string | null => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string): void => void memoryStore.set(k, v),
  removeItem: (k: string): void => void memoryStore.delete(k)
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = config.supabase.url
  const key = config.supabase.anonKey
  if (!url || !key) throw new Error('Supabase yapılandırılmadı (SUPABASE_URL / SUPABASE_ANON_KEY)')
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: memoryStorage,
      storageKey: 'asafgastro-auth'
    }
  })
  return client
}
