import type { FxKur } from '@shared/domain'

/**
 * DenizBank güncel döviz kurları.
 *
 * NOT: DenizBank kamuya açık stabil bir kur JSON endpoint'i yayımlamıyor
 * (denenen yollar 404/HTML döndü). Doğru kaynak (resmi endpoint veya kullanıcı
 * onaylı sayfa) netleşince `DENIZBANK_URL` + parse mantığı doldurulacak.
 * Şimdilik yapılandırılmadığında açık hata fırlatır (sessiz/yanlış veri yok).
 *
 * Yapılandırma: .env > FX_DENIZBANK_URL (JSON kur endpoint'i) verilirse kullanılır.
 */
const DENIZBANK_URL = process.env.FX_DENIZBANK_URL?.trim() || ''

interface DenizKurJson {
  kod: string
  alis: number | string
  satis: number | string
}

export async function denizbankRates(kodlar: string[] = ['USD', 'EUR']): Promise<FxKur[]> {
  if (!DENIZBANK_URL) {
    throw new Error(
      'DenizBank kur kaynağı yapılandırılmadı (FX_DENIZBANK_URL). Geçerli bir kur endpoint/sayfa adresi gerekli.'
    )
  }
  const res = await fetch(DENIZBANK_URL, {
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
