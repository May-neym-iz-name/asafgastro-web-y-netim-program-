import { call } from './client'
import type {
  ParaBirimi,
  UrunFiltre,
  UrunKarti,
  UrunKartiAyar,
  UrunSayfalama,
  Varyasyon,
  VaryasyonAyar
} from './types'

/** node-soap, WCF List<T> sonucunu { T: [...] } veya tek nesne olarak döndürür. */
function toArray<T>(node: unknown, itemKey: string): T[] {
  if (node == null) return []
  const inner = (node as Record<string, unknown>)[itemKey] ?? node
  if (Array.isArray(inner)) return inner as T[]
  return [inner as T]
}

const DEFAULT_SAYFALAMA: UrunSayfalama = {
  BaslangicIndex: 0,
  KayitSayisi: 100,
  SiralamaDegeri: 'ID',
  SiralamaYonu: 'DESC'
}

/** Ürünleri filtreyle çeker (fiyat alanları dahil tüm varyasyonlarla). */
export async function selectUrun(
  filtre: UrunFiltre = {},
  sayfalama: Partial<UrunSayfalama> = {}
): Promise<UrunKarti[]> {
  const f: UrunFiltre = { Aktif: -1, Firsat: -1, Indirimli: -1, Vitrin: -1, ...filtre }
  const s: UrunSayfalama = { ...DEFAULT_SAYFALAMA, ...sayfalama }
  const result = await call('UrunServis', 'SelectUrun', { f, s })
  return toArray<UrunKarti>(result, 'UrunKarti')
}

/** Filtreye uyan ürün adedini döndürür (sayfalama için). */
export async function selectUrunCount(filtre: UrunFiltre = {}): Promise<number> {
  const f: UrunFiltre = { Aktif: -1, Firsat: -1, Indirimli: -1, Vitrin: -1, ...filtre }
  const result = await call<number>('UrunServis', 'SelectUrunCount', { f })
  return Number(result) || 0
}

/** Sitede tanımlı para birimlerini (geçerli ParaBirimiID + güncel kur) çeker. */
export async function selectParaBirimi(paraBirimiId = 0): Promise<ParaBirimi[]> {
  const result = await call('UrunServis', 'SelectParaBirimi', { ParaBirimiID: paraBirimiId })
  return toArray<ParaBirimi>(result, 'ParaBirimi')
}

/**
 * Ürün ekler/günceller. ID=0 ekler, ID>0 günceller. Güncellemede yalnız
 * ayar maskelerinde true olan alanlar yazılır. KRİTİK: canlı siteyi etkiler,
 * çift onay UX'i (renderer) arkasından çağrılmalı.
 */
export async function saveUrun(
  urunKartlari: UrunKarti[],
  ukAyar: UrunKartiAyar,
  vAyar: VaryasyonAyar
): Promise<{ ok: boolean; raw: unknown }> {
  const result = await call('UrunServis', 'SaveUrun', {
    urunKartlari: { UrunKarti: urunKartlari },
    ukAyar,
    vAyar
  })
  return { ok: !isError(result), raw: result }
}

/** Hızlı stok güncelleme — yalnız Varyasyon.ID + StokAdedi gerekir. */
export async function stokAdediGuncelle(
  urunler: Pick<Varyasyon, 'ID' | 'StokAdedi'>[]
): Promise<{ ok: boolean; raw: unknown }> {
  const result = await call('UrunServis', 'StokAdediGuncelle', {
    urunler: { Varyasyon: urunler }
  })
  return { ok: !isError(result), raw: result }
}

/** IsError/IsErros yazım farkını normalize eder (false = başarı). */
export function isError(envelope: unknown): boolean {
  const e = envelope as Record<string, unknown> | null
  if (!e) return false
  if (typeof e.IsError === 'boolean') return e.IsError
  if (typeof e.IsErros === 'boolean') return e.IsErros
  return false
}
