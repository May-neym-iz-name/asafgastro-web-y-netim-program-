import { call } from './client'
import { isError } from './urunService'

/**
 * Ticimax sipariş servisi sarmalayıcıları. Sipariş listeleme + durum/kargo/fatura
 * güncellemeleri. WebSiparisDurumlari ve diğer enumlar shared/domain üzerinden.
 */

// -1 = filtre yok
export interface WebSiparisFiltre {
  SiparisDurumu?: number
  OdemeDurumu?: number
  OdemeTipi?: number
  SiparisID?: number
  FaturaNo?: string
  SiparisNo?: string
  SiparisKodu?: string
  UyeID?: number
  UyeTelefon?: string
  TedarikciID?: number
  EntegrasyonAktarildi?: number
  SiparisTarihiBas?: string // ISO datetime
  SiparisTarihiSon?: string
}

export interface WebSiparisSayfalama {
  BaslangicIndex: number
  KayitSayisi: number
  SiralamaDegeri: string
  SiralamaYonu: 'ASC' | 'DESC'
}

/** Ticimax sipariş durumu enum değerleri (SetSiparisDurum için). */
export const SiparisDurum = {
  OnSiparis: 0,
  OnayBekliyor: 1,
  Onaylandi: 2,
  OdemeBekliyor: 3,
  Paketleniyor: 4,
  TedarikEdiliyor: 5,
  KargoyaVerildi: 6,
  TeslimEdildi: 7,
  Iptal: 8,
  Iade: 9
} as const

function toArray<T>(node: unknown, key: string): T[] {
  if (node == null) return []
  const inner = (node as Record<string, unknown>)[key] ?? node
  return Array.isArray(inner) ? (inner as T[]) : [inner as T]
}

const DEFAULT_SAYFALAMA: WebSiparisSayfalama = {
  BaslangicIndex: 0,
  KayitSayisi: 50,
  SiralamaDegeri: 'ID',
  SiralamaYonu: 'DESC'
}

/** Siparişleri filtreyle çeker. */
export async function selectSiparis(
  filtre: WebSiparisFiltre = {},
  sayfalama: Partial<WebSiparisSayfalama> = {}
): Promise<Record<string, unknown>[]> {
  const f: WebSiparisFiltre = {
    SiparisDurumu: -1,
    OdemeDurumu: -1,
    OdemeTipi: -1,
    SiparisID: -1,
    UyeID: -1,
    TedarikciID: -1,
    EntegrasyonAktarildi: -1,
    ...filtre
  }
  const s: WebSiparisSayfalama = { ...DEFAULT_SAYFALAMA, ...sayfalama }
  const result = await call('SiparisServis', 'SelectSiparis', { f, s })
  return toArray<Record<string, unknown>>(result, 'WebSiparis')
}

/** Sipariş durumunu değiştirir, opsiyonel kargo takip no + mail bildirimi. */
export async function setSiparisDurum(params: {
  SiparisID: number
  Durum: number
  KargoTakipNo?: string
  MailBilgilendir?: boolean
}): Promise<{ ok: boolean; raw: unknown }> {
  const request = {
    SiparisID: params.SiparisID,
    Durum: params.Durum,
    KargoTakipNo: params.KargoTakipNo ?? '',
    MailBilgilendir: params.MailBilgilendir ?? false
  }
  const result = await call('SiparisServis', 'SetSiparisDurum', { request })
  return { ok: !isError(result), raw: result }
}

/** Siparişe kargo takip numarası ekler. */
export async function saveKargoTakipNo(params: {
  siparisId: number
  kargoTakipNo: string
  kargoKodu?: string
  kargoTakipLink?: string
  barkodBilgisi?: string
  kargoTakipLinkGoster?: boolean
}): Promise<{ ok: boolean; raw: unknown }> {
  const result = await call('SiparisServis', 'SaveKargoTakipNo', {
    siparisId: params.siparisId,
    kargoKodu: params.kargoKodu ?? '',
    kargoTakipNo: params.kargoTakipNo,
    kargoTakipLink: params.kargoTakipLink ?? '',
    BarkodBilgisi: params.barkodBilgisi ?? '',
    KargoTakipLinkGoster: params.kargoTakipLinkGoster ?? true
  })
  return { ok: !isError(result), raw: result }
}
