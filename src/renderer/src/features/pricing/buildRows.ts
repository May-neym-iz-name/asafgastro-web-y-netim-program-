import { kdvDahilToHaric } from '@shared/calc'
import type { PricingRow, KurHaritasi } from './model'
import { recompute } from './model'

/** node-soap iç içe List → dizi. */
function arr<T>(node: unknown, key: string): T[] {
  if (node == null) return []
  const inner = (node as Record<string, unknown>)[key] ?? node
  return Array.isArray(inner) ? (inner as T[]) : [inner as T]
}

function n(v: unknown): number | null {
  if (v == null || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

export interface SupplierPriceMap {
  [key: string]: { liste: number | null; paraBirimi: string; iskonto: number | null }
}

/** Supabase supplier_prices listesini varyasyonId/stokKodu anahtarlı haritaya çevirir. */
export function buildSupplierMap(rows: unknown[]): SupplierPriceMap {
  const map: SupplierPriceMap = {}
  for (const r of rows as Record<string, unknown>[]) {
    const entry = {
      liste: n(r.liste_fiyati),
      paraBirimi: (r.para_birimi as string) || 'TRY',
      iskonto: n(r.iskonto_orani)
    }
    if (r.varyasyon_id != null) map[`v:${r.varyasyon_id}`] = entry
    if (r.stok_kodu) map[`s:${r.stok_kodu}`] = entry
  }
  return map
}

/** Ticimax ürün listesi + tedarikçi fiyat haritası → grid satırları. */
export function buildRows(
  urunler: unknown[],
  supplier: SupplierPriceMap,
  alisKur: KurHaritasi,
  satisKur: KurHaritasi
): PricingRow[] {
  const out: PricingRow[] = []
  for (const u of urunler as Record<string, unknown>[]) {
    const urunKartiId = Number(u.ID)
    const urunAdi = String(u.UrunAdi ?? '')
    const varyasyonlar = arr<Record<string, unknown>>(u.Varyasyonlar, 'Varyasyon')

    for (const v of varyasyonlar) {
      const kdvOrani = n(v.KdvOrani) ?? 20
      const kdvDahil = v.KdvDahil === true || v.KdvDahil === 'true'
      const satisRaw = n(v.SatisFiyati)
      // Ticimax fiyatı dahil ise hariç'e indir
      const satisKdvHaric =
        satisRaw == null ? null : kdvDahil ? kdvDahilToHaric(satisRaw, kdvOrani) : satisRaw

      const stokKodu = String(v.StokKodu ?? '')
      const sp = supplier[`v:${v.ID}`] ?? supplier[`s:${stokKodu}`] ?? null
      const satisPB = String(v.ParaBirimiKodu ?? v.ParaBirimi ?? 'TRY') || 'TRY'

      const base: PricingRow = {
        urunKartiId,
        varyasyonId: Number(v.ID),
        urunAdi,
        stokKodu,
        aktif: v.Aktif === true || v.Aktif === 'true',
        tedarikciListeFiyati: sp?.liste ?? n(v.AlisFiyati),
        tedarikciParaBirimi: sp?.paraBirimi ?? satisPB,
        iskontoOrani: sp?.iskonto ?? null,
        netAlis: null,
        kdvOrani,
        kdvDahilMod: kdvDahil,
        satisKdvHaric,
        satisKdvDahil: null,
        indirimliFiyat: n(v.IndirimliFiyati),
        satisParaBirimi: satisPB,
        karTutari: null,
        karOrani: null,
        dirty: false
      }
      out.push(recompute(base, alisKur, satisKur))
    }
  }
  return out
}

/** FxKur[] → { USD: kur, ... } TRY-bazlı harita (satis yönü varsayılan). */
export function toKurHaritasi(rates: unknown[], yon: 'alis' | 'satis' = 'satis'): KurHaritasi {
  const map: KurHaritasi = { TRY: 1, TL: 1 }
  for (const r of rates as Record<string, unknown>[]) {
    const kod = String(r.kod ?? '')
    const val = Number(r[yon])
    if (kod && Number.isFinite(val)) map[kod] = val
  }
  return map
}
