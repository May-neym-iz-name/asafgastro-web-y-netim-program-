import { kdvHaricToDahil } from '@shared/calc'
import type { PricingRow } from './model'

/**
 * Dirty satırları Ticimax SaveUrun yüküne çevirir. Fiyat varyasyonda olduğundan
 * her kart altında ilgili varyasyonlar gönderilir. Mağazanın KDV modu (kdvDahilMod)
 * korunur: dahil modda fiyat dahil'e çevrilerek yazılır. Yalnız maskelenen alanlar yazılır.
 */
export function buildSavePayload(dirty: PricingRow[]): {
  urunKartlari: unknown[]
  ukAyar: Record<string, unknown>
  vAyar: Record<string, unknown>
} {
  // Kart bazında grupla
  const byKart = new Map<number, PricingRow[]>()
  for (const r of dirty) {
    const list = byKart.get(r.urunKartiId) ?? []
    list.push(r)
    byKart.set(r.urunKartiId, list)
  }

  const urunKartlari = [...byKart.entries()].map(([urunKartiId, rows]) => ({
    ID: urunKartiId,
    UrunAdi: rows[0].urunAdi,
    Aciklama: '',
    AnaKategoriID: 0,
    MarkaID: 0,
    TedarikciID: 0,
    Varyasyonlar: {
      Varyasyon: rows.map((r) => {
        const satisHaric = r.satisKdvHaric ?? 0
        const satisYazilacak = r.kdvDahilMod
          ? kdvHaricToDahil(satisHaric, r.kdvOrani)
          : satisHaric
        const indirimliYazilacak =
          r.indirimliFiyat == null
            ? 0
            : r.kdvDahilMod
              ? r.indirimliFiyat
              : r.indirimliFiyat / (1 + r.kdvOrani / 100)
        return {
          ID: r.varyasyonId,
          SatisFiyati: satisYazilacak,
          IndirimliFiyati: indirimliYazilacak,
          KdvDahil: r.kdvDahilMod,
          KdvOrani: r.kdvOrani,
          Aktif: r.aktif,
          AlisFiyati: r.netAlis ?? 0
        }
      })
    }
  }))

  // Güncelleme maskeleri — yalnız fiyat/aktiflik alanları yazılır
  const vAyar = {
    SatisFiyatiGuncelle: true,
    IndirimliFiyatiGuncelle: true,
    AlisFiyatiGuncelle: true,
    KdvOraniGuncelle: true,
    AktifGuncelle: true
  }
  const ukAyar = { UserAgent: 'AsafGastroWebYonetim' }

  return { urunKartlari, ukAyar, vAyar }
}

/** Dirty satırlardan Supabase supplier_prices upsert yükü. */
export function buildSupplierUpsert(dirty: PricingRow[]): unknown[] {
  return dirty
    .filter((r) => r.tedarikciListeFiyati != null || r.iskontoOrani != null)
    .map((r) => ({
      varyasyon_id: r.varyasyonId,
      stok_kodu: r.stokKodu || null,
      liste_fiyati: r.tedarikciListeFiyati,
      para_birimi: r.tedarikciParaBirimi,
      iskonto_orani: r.iskontoOrani,
      net_alis: r.netAlis
    }))
}
