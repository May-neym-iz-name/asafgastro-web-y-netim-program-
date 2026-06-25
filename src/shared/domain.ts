/**
 * Uygulama domain modelleri (UI-dostu). Ticimax/UPS ham DTO tipleri
 * her servisin kendi types.ts dosyasında tanımlanır; burada sadeleştirilmiş
 * ortak modeller tutulur.
 */

export type ParaBirimiKodu = 'TRY' | 'USD' | 'EUR' | string

/** Fiyat Güncelleme grid satırı (UI modeli). */
export interface FiyatSatiri {
  urunKartiId: number
  varyasyonId: number
  urunAdi: string
  stokKodu: string
  aktif: boolean

  // Alış tarafı (uygulamanın kendi verisi — Supabase senkron)
  tedarikciListeFiyati: number | null
  tedarikciParaBirimi: ParaBirimiKodu
  iskontoOrani: number | null // yüzde
  netAlis: number | null // hesaplanan

  // Satış tarafı (Ticimax)
  kdvOrani: number
  satisKdvHaric: number | null
  satisKdvDahil: number | null
  indirimliFiyat: number | null
  satisParaBirimi: ParaBirimiKodu

  // Kâr (hesaplanan)
  karTutari: number | null
  karOrani: number | null // yüzde
}

/** Döviz kuru kaynağı seçenekleri. */
export type FxKaynak = 'TCMB' | 'DENIZBANK'

export interface FxKur {
  kaynak: FxKaynak
  kod: ParaBirimiKodu // USD, EUR
  alis: number
  satis: number
  guncellemeZamani: string // ISO
}

/** Rol tabanlı yetkilendirme için izin anahtarları. */
export const IZINLER = [
  'urun.ekle',
  'urun.duzenle',
  'fiyat.goruntule',
  'fiyat.guncelle',
  'siparis.goruntule',
  'siparis.duzenle',
  'kargo.gonderi',
  'ayarlar.yonet',
  'kullanici.yonet'
] as const

export type Izin = (typeof IZINLER)[number]

export interface Rol {
  id: string
  ad: string
  izinler: Izin[]
}
