/**
 * Fiyat/KDV/kâr/döviz hesap mantığı — saf fonksiyonlar (birim testli).
 * Tüm finansal hesabın tek kaynağı; Fiyat Güncelleme modülü buna dayanır.
 */

/** Yuvarlama yardımcı (2 ondalık varsayılan). */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round((value + Number.EPSILON) * f) / f
}

/** KDV hariç tutardan KDV dahil tutarı hesaplar. oran: yüzde (ör. 20). */
export function kdvHaricToDahil(haric: number, oran: number): number {
  return round(haric * (1 + oran / 100))
}

/** KDV dahil tutardan KDV hariç tutarı hesaplar. */
export function kdvDahilToHaric(dahil: number, oran: number): number {
  return round(dahil / (1 + oran / 100))
}

/** Tedarikçi liste fiyatı + iskonto(%) → net alış fiyatı. */
export function netAlis(listeFiyati: number, iskontoOrani: number): number {
  return round(listeFiyati * (1 - iskontoOrani / 100))
}

/**
 * Tutarı kaynak para biriminden TRY'ye çevirir.
 * kur = 1 birim döviz karşılığı TRY (TRY için 1).
 */
export function toTRY(tutar: number, kur: number): number {
  return round(tutar * kur)
}

/** İki para birimi arasında çevirir (her ikisi de TRY-bazlı kur ile). */
export function convert(tutar: number, kaynakKur: number, hedefKur: number): number {
  if (hedefKur === 0) return 0
  return round((tutar * kaynakKur) / hedefKur)
}

export interface KarSonuc {
  karTutari: number
  karOrani: number // yüzde
}

/**
 * Kâr hesabı — alış ve satış AYNI para biriminde (genelde TRY, KDV hariç bazında).
 * İndirimli fiyat varsa satış olarak o kullanılmalı (çağıran karar verir).
 */
export function kar(satisKdvHaric: number, alisKdvHaric: number): KarSonuc {
  const karTutari = round(satisKdvHaric - alisKdvHaric)
  const karOrani = alisKdvHaric > 0 ? round((karTutari / alisKdvHaric) * 100) : 0
  return { karTutari, karOrani }
}

/**
 * Hedef kâr oranına (%) ulaşmak için gereken KDV hariç satış fiyatı.
 * satis = alis * (1 + kar/100)
 */
export function karOranindanSatis(alisKdvHaric: number, hedefKarOrani: number): number {
  return round(alisKdvHaric * (1 + hedefKarOrani / 100))
}
