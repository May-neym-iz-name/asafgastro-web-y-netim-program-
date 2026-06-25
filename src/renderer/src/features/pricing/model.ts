import {
  kdvDahilToHaric,
  kdvHaricToDahil,
  netAlis,
  kar,
  karOranindanSatis,
  toTRY,
  round
} from '@shared/calc'

/**
 * Fiyat Güncelleme grid satırı. Bir Ticimax varyasyonu = bir satır.
 * Alış tarafı (liste/iskonto) uygulamanın kendi verisi (Supabase senkron),
 * satış tarafı Ticimax. Kâr, FX ile TRY'ye çevrilerek hesaplanır.
 */
export interface PricingRow {
  urunKartiId: number
  varyasyonId: number
  urunAdi: string
  stokKodu: string
  aktif: boolean

  tedarikciListeFiyati: number | null
  tedarikciParaBirimi: string
  iskontoOrani: number | null
  netAlis: number | null

  kdvOrani: number
  kdvDahilMod: boolean // mağazanın bu varyasyon için KDV modu (kaydederken korunur)
  satisKdvHaric: number | null
  satisKdvDahil: number | null
  indirimliFiyat: number | null
  satisParaBirimi: string

  karTutari: number | null
  karOrani: number | null

  dirty: boolean
}

/** Para kodu → kur (TRY karşılığı). 'TRY'/'TL' = 1. */
export type KurHaritasi = Record<string, number>

function kur(harita: KurHaritasi, kod: string): number {
  if (kod === 'TRY' || kod === 'TL' || !kod) return 1
  return harita[kod] ?? 1
}

/**
 * Satırın türetilen alanlarını (net alış, KDV dahil, kâr) yeniden hesaplar.
 * alisKur: alış FX kaynağı kur haritası; satisKur: satış FX kaynağı.
 */
export function recompute(
  row: PricingRow,
  alisKur: KurHaritasi,
  satisKur: KurHaritasi
): PricingRow {
  const next = { ...row }

  // Net alış = liste * (1 - iskonto)
  next.netAlis =
    next.tedarikciListeFiyati != null && next.iskontoOrani != null
      ? netAlis(next.tedarikciListeFiyati, next.iskontoOrani)
      : next.tedarikciListeFiyati

  // Satış KDV dahil ↔ hariç senkron (hariç esas tutulur)
  if (next.satisKdvHaric != null) {
    next.satisKdvDahil = kdvHaricToDahil(next.satisKdvHaric, next.kdvOrani)
  } else if (next.satisKdvDahil != null) {
    next.satisKdvHaric = kdvDahilToHaric(next.satisKdvDahil, next.kdvOrani)
  }

  // Son satış = indirimli varsa o (KDV dahil kabul → hariç'e indir), yoksa normal hariç
  const sonSatisHaric =
    next.indirimliFiyat != null
      ? kdvDahilToHaric(next.indirimliFiyat, next.kdvOrani)
      : next.satisKdvHaric

  // Kâr: alış ve satış TRY'ye çevrilir
  if (sonSatisHaric != null && next.netAlis != null) {
    const alisTRY = toTRY(next.netAlis, kur(alisKur, next.tedarikciParaBirimi))
    const satisTRY = toTRY(sonSatisHaric, kur(satisKur, next.satisParaBirimi))
    const k = kar(satisTRY, alisTRY)
    next.karTutari = k.karTutari
    next.karOrani = k.karOrani
  } else {
    next.karTutari = null
    next.karOrani = null
  }

  return next
}

/** Bir alanı düzenler, satırı dirty işaretler ve yeniden hesaplar. */
export function editRow(
  row: PricingRow,
  patch: Partial<PricingRow>,
  alisKur: KurHaritasi,
  satisKur: KurHaritasi
): PricingRow {
  return recompute({ ...row, ...patch, dirty: true }, alisKur, satisKur)
}

/** Hedef kâr oranına göre satış (KDV hariç) fiyatını ayarlar. */
export function applyKarOrani(
  row: PricingRow,
  hedefKarOrani: number,
  alisKur: KurHaritasi,
  satisKur: KurHaritasi
): PricingRow {
  if (row.netAlis == null) return row
  // netAlis'i satış para birimine çevir, hedef kârı uygula
  const alisTRY = toTRY(row.netAlis, kur(alisKur, row.tedarikciParaBirimi))
  const satisBirimKur = kur(satisKur, row.satisParaBirimi)
  const alisSatisBirimi = satisBirimKur ? round(alisTRY / satisBirimKur) : alisTRY
  const yeniHaric = karOranindanSatis(alisSatisBirimi, hedefKarOrani)
  return editRow(row, { satisKdvHaric: yeniHaric, indirimliFiyat: null }, alisKur, satisKur)
}
