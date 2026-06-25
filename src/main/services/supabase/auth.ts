import { getSupabase } from './client'
import type { Izin } from '@shared/domain'

export interface OturumKullanici {
  id: string
  email: string
  adSoyad: string | null
  rol: string | null
  izinler: Izin[]
}

/** E-posta/şifre ile giriş. Başarıda kullanıcı + rol + izinleri döner. */
export async function signIn(email: string, sifre: string): Promise<OturumKullanici> {
  const sb = getSupabase()
  const { error } = await sb.auth.signInWithPassword({ email, password: sifre })
  if (error) throw new Error(error.message)
  const user = await currentUser()
  if (!user) throw new Error('Oturum açılamadı')
  return user
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut()
}

/** Aktif oturumdaki kullanıcıyı rol + izinleriyle döndürür (yoksa null). */
export async function currentUser(): Promise<OturumKullanici | null> {
  const sb = getSupabase()
  const { data } = await sb.auth.getUser()
  const u = data.user
  if (!u) return null

  // Profil + rol + izinler
  const { data: profile } = await sb
    .from('profiles')
    .select('ad_soyad, roles(ad, role_permissions(izin))')
    .eq('id', u.id)
    .maybeSingle()

  const roles = (profile?.roles ?? null) as { ad?: string; role_permissions?: { izin: string }[] } | null
  const izinler = (roles?.role_permissions ?? []).map((r) => r.izin) as Izin[]

  return {
    id: u.id,
    email: u.email ?? '',
    adSoyad: (profile?.ad_soyad as string) ?? null,
    rol: roles?.ad ?? null,
    izinler
  }
}
