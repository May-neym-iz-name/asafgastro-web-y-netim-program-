import { useEffect, useState } from 'react'

export interface OzellikSatir {
  id: string
  deger: string
}
export interface TeknikSatir {
  id: string
  etiket: string
  deger: string
}
export const yeniId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`

export interface SecimListeleri {
  kategoriler: { id: number; tanim: string }[]
  markalar: { id: number; tanim: string }[]
  tedarikciler: { id: number; tanim: string }[]
  paraBirimleri: { id: number; kod: string; tanim: string }[]
}

export interface UrunFormState {
  urunAdi: string
  anaKategoriId: number
  markaId: number
  tedarikciId: number
  satisBirimi: string
  stokKodu: string
  barkod: string
  kdvOrani: number
  kdvDahil: boolean
  paraBirimiId: number
  satisFiyati: string
  stokAdedi: string
  // açıklama şablonu
  giris: string
  ozellikler: OzellikSatir[]
  teknik: TeknikSatir[]
  // görseller (base64)
  gorseller: string[]
  // SEO & site-içi arama
  onYazi: string
  aramaAnahtarKelime: string
  seoSayfaBaslik: string
  seoSayfaAciklama: string
  seoAnahtarKelime: string
  // bayraklar
  vitrin: boolean
  yeniUrun: boolean
  ucretsizKargo: boolean
}

export const BOS_FORM: UrunFormState = {
  urunAdi: '',
  anaKategoriId: 0,
  markaId: 0,
  tedarikciId: 0,
  satisBirimi: 'Adet',
  stokKodu: '',
  barkod: '',
  kdvOrani: 20,
  kdvDahil: true,
  paraBirimiId: 0,
  satisFiyati: '',
  stokAdedi: '0',
  giris: '',
  ozellikler: [{ id: yeniId(), deger: '' }],
  teknik: [{ id: yeniId(), etiket: '', deger: '' }],
  gorseller: [],
  onYazi: '',
  aramaAnahtarKelime: '',
  seoSayfaBaslik: '',
  seoSayfaAciklama: '',
  seoAnahtarKelime: '',
  vitrin: false,
  yeniUrun: false,
  ucretsizKargo: false
}

export function useProductForm() {
  const [listeler, setListeler] = useState<SecimListeleri>({
    kategoriler: [],
    markalar: [],
    tedarikciler: [],
    paraBirimleri: []
  })
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    let iptal = false
    async function yukle(): Promise<void> {
      try {
        const [kat, mar, ted, pb] = await Promise.all([
          window.api.ticimax.selectKategori(0, -1),
          window.api.ticimax.selectMarka(),
          window.api.ticimax.selectTedarikci(),
          window.api.ticimax.selectParaBirimi()
        ])
        if (iptal) return
        setListeler({
          kategoriler: (kat.ok ? kat.data ?? [] : []).map((k) => {
            const x = k as Record<string, unknown>
            return { id: Number(x.Id ?? x.ID), tanim: String(x.Tanim ?? '') }
          }),
          markalar: (mar.ok ? mar.data ?? [] : []).map((m) => {
            const x = m as Record<string, unknown>
            return { id: Number(x.ID), tanim: String(x.Tanim ?? '') }
          }),
          tedarikciler: (ted.ok ? ted.data ?? [] : []).map((t) => {
            const x = t as Record<string, unknown>
            return { id: Number(x.ID), tanim: String(x.Tanim ?? '') }
          }),
          paraBirimleri: (pb.ok ? pb.data ?? [] : []).map((p) => {
            const x = p as Record<string, unknown>
            return { id: Number(x.ID), kod: String(x.DovizKodu ?? ''), tanim: String(x.Tanim ?? '') }
          })
        })
      } catch (e) {
        if (!iptal) setHata(e instanceof Error ? e.message : String(e))
      } finally {
        if (!iptal) setYukleniyor(false)
      }
    }
    yukle()
    return () => {
      iptal = true
    }
  }, [])

  return { listeler, yukleniyor, hata }
}

/** Dosyaları base64 (data: öneki olmadan) listesine çevirir. */
export function dosyalariBase64(files: FileList): Promise<string[]> {
  const okuyucular = Array.from(files).map(
    (f) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const s = String(r.result)
          const virgul = s.indexOf(',')
          resolve(virgul >= 0 ? s.slice(virgul + 1) : s)
        }
        r.onerror = reject
        r.readAsDataURL(f)
      })
  )
  return Promise.all(okuyucular)
}
