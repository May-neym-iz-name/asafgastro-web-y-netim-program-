/** Ticimax sipariş durumu enum → etiket + renk. */
export const SIPARIS_DURUM: Record<number, { ad: string; renk: string }> = {
  0: { ad: 'Ön Sipariş', renk: '#64748b' },
  1: { ad: 'Onay Bekliyor', renk: '#d97706' },
  2: { ad: 'Onaylandı', renk: '#2563eb' },
  3: { ad: 'Ödeme Bekliyor', renk: '#d97706' },
  4: { ad: 'Paketleniyor', renk: '#7c3aed' },
  5: { ad: 'Tedarik Ediliyor', renk: '#7c3aed' },
  6: { ad: 'Kargoya Verildi', renk: '#0891b2' },
  7: { ad: 'Teslim Edildi', renk: '#16a34a' },
  8: { ad: 'İptal', renk: '#dc2626' },
  9: { ad: 'İade', renk: '#dc2626' }
}

/** Durum güncelleme menüsü için seçenekler. */
export const DURUM_SECENEKLERI = [
  { id: 2, ad: 'Onaylandı' },
  { id: 4, ad: 'Paketleniyor' },
  { id: 5, ad: 'Tedarik Ediliyor' },
  { id: 6, ad: 'Kargoya Verildi' },
  { id: 7, ad: 'Teslim Edildi' },
  { id: 8, ad: 'İptal' }
]

export function durumBilgi(durum: number): { ad: string; renk: string } {
  return SIPARIS_DURUM[durum] ?? { ad: `Durum ${durum}`, renk: '#64748b' }
}
