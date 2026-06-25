import { XMLParser } from 'fast-xml-parser'
import type { FxKur } from '@shared/domain'

/**
 * TCMB (Merkez Bankası) günlük kurları. today.xml → ForexBuying(alış)/
 * ForexSelling(satış). Hafta sonu/tatil günleri en son iş günü verisini döner.
 */
const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml'

interface TcmbCurrency {
  '@_Kod'?: string
  '@_CurrencyCode'?: string
  ForexBuying?: string
  ForexSelling?: string
}

export async function tcmbRates(kodlar: string[] = ['USD', 'EUR']): Promise<FxKur[]> {
  const res = await fetch(TCMB_URL, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`TCMB erişim hatası: HTTP ${res.status}`)
  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const doc = parser.parse(xml) as { Tarih_Date?: { Currency?: TcmbCurrency[] } }
  const list = doc.Tarih_Date?.Currency ?? []
  const now = new Date().toISOString()

  const out: FxKur[] = []
  for (const kod of kodlar) {
    const c = list.find((x) => x['@_Kod'] === kod || x['@_CurrencyCode'] === kod)
    if (!c) continue
    const alis = Number(c.ForexBuying)
    const satis = Number(c.ForexSelling)
    if (!Number.isFinite(alis) || !Number.isFinite(satis)) continue
    out.push({ kaynak: 'TCMB', kod, alis, satis, guncellemeZamani: now })
  }
  return out
}
