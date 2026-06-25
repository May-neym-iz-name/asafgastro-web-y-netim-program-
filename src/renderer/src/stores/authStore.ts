import { create } from 'zustand'
import type { Izin } from '@shared/domain'

export interface OturumKullanici {
  id: string
  email: string
  adSoyad: string | null
  rol: string | null
  izinler: Izin[]
}

type Durum = 'loading' | 'anon' | 'authed'

const STRICT_KEY = 'asaf-strict-auth'

interface AuthState {
  durum: Durum
  user: OturumKullanici | null
  hata: string | null
  /** Katı mod: açıkken giriş yapılmadan hiçbir işlem yapılamaz (B seçeneği). */
  strict: boolean
  yukle: () => Promise<void>
  girisYap: (email: string, sifre: string) => Promise<boolean>
  cikisYap: () => Promise<void>
  setStrict: (v: boolean) => void
  /** İzin kontrolü. Katı mod kapalıysa anonim kullanıcıya geçici tam erişim verir. */
  izinVar: (izin: Izin) => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  durum: 'loading',
  user: null,
  hata: null,
  strict: (() => {
    try {
      return localStorage.getItem(STRICT_KEY) === '1'
    } catch {
      return false
    }
  })(),

  yukle: async () => {
    try {
      const res = await window.api.supabase.currentUser()
      const user = res.ok ? (res.data as OturumKullanici | null) : null
      set({ durum: user ? 'authed' : 'anon', user, hata: null })
    } catch {
      set({ durum: 'anon', user: null, hata: 'Oturum durumu alınamadı' })
    }
  },

  girisYap: async (email, sifre) => {
    set({ hata: null })
    const res = await window.api.supabase.signIn(email, sifre)
    if (res.ok && res.data) {
      set({ durum: 'authed', user: res.data as OturumKullanici })
      return true
    }
    set({ hata: res.error ?? 'Giriş başarısız' })
    return false
  },

  cikisYap: async () => {
    await window.api.supabase.signOut()
    set({ durum: 'anon', user: null })
  },

  setStrict: (v) => {
    try {
      localStorage.setItem(STRICT_KEY, v ? '1' : '0')
    } catch {
      /* yoksay */
    }
    set({ strict: v })
  },

  izinVar: (izin) => {
    const { durum, user, strict } = get()
    if (durum === 'authed' && user) return user.izinler.includes(izin)
    // Anonim: katı modda hiçbir yetki yok; kapalıyken geçici tam erişim
    return !strict
  }
}))
