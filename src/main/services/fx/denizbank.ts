import type { FxKur } from '@shared/domain'
import { tcmbRates } from './tcmb'
import { round } from '@shared/calc'

/**
 * DenizBank güncel döviz kurları.
 *
 * DenizBank kamuya açık stabil bir kur JSON endpoint'i yayımlamıyor (denenen
 * yollar 404/HTML döndü). İki mod:
 *  1) FX_DENIZBANK_URL verilirse → o JSON endpoint'ten gerçek kur çekilir.
 *  2) Aksi halde → TCMB tabanı + ayarlanabilir marj (FX_DENIZBANK_ALIS_MARJ /
 *     FX_DENIZBANK_SATIS_MARJ, yüzde) ile yaklaşık DenizBank kuru üretilir.
 *     Marjlar Ayarlar'dan (fx_settings.marjlar) ince ayarlanabilir; gerçek
 *     endpoint bulununca otomatik 1. moda geçer.
 */
const DENIZBANK_URL = process.env.FX_DENIZBANK_URL?.trim() || ''
const ALIS_MARJ = Number(process.env.FX_DENIZBANK_ALIS_MARJ ?? '0') // yüzde
const SATIS_MARJ = Number(process.env.FX_DENIZBANK_SATIS_MARJ ?? '0')

interface DenizKurJson {
  kod: string
  alis: number | string
  satis: number | string
}

async function fromEndpoint(url: string, kodlar: string[]): Promise<FxKur[]> {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  })
  if (!res.ok) throw new Error(`DenizBank erişim hatası: HTTP ${res.status}`)
  const data = (await res.json()) as DenizKurJson[]
  const now = new Date().toISOString()
  return kodlar
    .map((kod) => data.find((d) => d.kod?.toUpperCase() === kod))
    .filter((d): d is DenizKurJson => Boolean(d))
    .map((d) => ({
      kaynak: 'DENIZBANK' as const,
      kod: d.kod.toUpperCase(),
      alis: Number(d.alis),
      satis: Number(d.satis),
      guncellemeZamani: now
    }))
}

/** TCMB tabanı + marj ile yaklaşık DenizBank kuru. */
async function fromTcmbWithMargin(kodlar: string[]): Promise<FxKur[]> {
  const base = await tcmbRates(kodlar)
  return base.map((r) => ({
    kaynak: 'DENIZBANK' as const,
    kod: r.kod,
    alis: round(r.alis * (1 + ALIS_MARJ / 100)),
    satis: round(r.satis * (1 + SATIS_MARJ / 100)),
    guncellemeZamani: r.guncellemeZamani
  }))
}

export async function denizbankRates(kodlar: string[] = ['USD', 'EUR']): Promise<FxKur[]> {
  return DENIZBANK_URL ? fromEndpoint(DENIZBANK_URL, kodlar) : fromTcmbWithMargin(kodlar)
}
