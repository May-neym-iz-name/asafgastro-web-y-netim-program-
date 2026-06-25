import type { FxKaynak, FxKur } from '@shared/domain'
import { tcmbRates } from './tcmb'
import { denizbankRates } from './denizbank'

export * from '@shared/calc'

/**
 * Döviz kuru registry'si. Alış ve satış için ayrı kaynak (TCMB/DenizBank)
 * seçilebilir. Sonuçlar kısa süreli cache'lenir (varsayılan 10 dk).
 */

type Provider = (kodlar: string[]) => Promise<FxKur[]>

const PROVIDERS: Record<FxKaynak, Provider> = {
  TCMB: tcmbRates,
  DENIZBANK: denizbankRates
}

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; data: FxKur[] }>()

/** Seçili kaynaktan kurları getirir (cache'li). */
export async function getRates(
  kaynak: FxKaynak,
  kodlar: string[] = ['USD', 'EUR']
): Promise<FxKur[]> {
  const key = `${kaynak}:${kodlar.join(',')}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data
  const data = await PROVIDERS[kaynak](kodlar)
  cache.set(key, { at: Date.now(), data })
  return data
}

/** Tek bir döviz kodunun kurunu döndürür (alış/satış seçilebilir). */
export async function getKur(
  kaynak: FxKaynak,
  kod: string,
  yon: 'alis' | 'satis' = 'satis'
): Promise<number | null> {
  if (kod === 'TRY' || kod === 'TL') return 1
  const rates = await getRates(kaynak, [kod])
  const r = rates.find((x) => x.kod === kod)
  return r ? r[yon] : null
}

export function clearFxCache(): void {
  cache.clear()
}
