import type { Izin } from '@shared/domain'

export interface NavModule {
  id: string
  etiket: string
  ikon: string // emoji placeholder (Phase 2'de ikon seti)
  aciklama: string
  izin: Izin
}

/** Uygulama sekmeleri — soldaki navigasyonu ve içerik yönlendirmesini besler. */
export const NAV_MODULES: NavModule[] = [
  {
    id: 'products',
    etiket: 'Ürünler',
    ikon: '📦',
    aciklama: 'Ürün ekleme ve sabit formatlı açıklama tasarımı',
    izin: 'urun.ekle'
  },
  {
    id: 'pricing',
    etiket: 'Fiyat Güncelleme',
    ikon: '💰',
    aciklama: 'Alış-iskonto, KDV, kâr ve toplu fiyat yönetimi',
    izin: 'fiyat.goruntule'
  },
  {
    id: 'orders',
    etiket: 'Siparişler',
    ikon: '🧾',
    aciklama: 'Sipariş listeleme ve düzenleme',
    izin: 'siparis.goruntule'
  },
  {
    id: 'shipping',
    etiket: 'Kargo',
    ikon: '🚚',
    aciklama: 'UPS gönderi oluşturma ve takip',
    izin: 'kargo.gonderi'
  },
  {
    id: 'settings',
    etiket: 'Ayarlar',
    ikon: '⚙️',
    aciklama: 'Yetkilendirme, bağlantılar, döviz ve katalog ayarları',
    izin: 'ayarlar.yonet'
  }
]
