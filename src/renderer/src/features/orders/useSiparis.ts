import { useCallback, useEffect, useState } from 'react'

export interface SiparisFiltre {
  SiparisDurumu?: number
  SiparisNo?: string
  UyeTelefon?: string
  SiparisTarihiBas?: string
  SiparisTarihiSon?: string
}

export interface SiparisOzet {
  id: number
  adiSoyadi: string
  tarih: string
  durum: number
  durumStr: string
  toplam: number
  paraBirimi: string
  kargoTakipNo: string
  ham: Record<string, unknown>
}

function n(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

function mapSiparis(s: Record<string, unknown>): SiparisOzet {
  return {
    id: n(s.ID),
    adiSoyadi: String(s.AdiSoyadi ?? `${s.UyeAdi ?? ''} ${s.UyeSoyadi ?? ''}`).trim(),
    tarih: String(s.SiparisTarihi ?? ''),
    durum: n(s.Durum),
    durumStr: String(s.SiparisDurumu ?? ''),
    toplam: n(s.ToplamTutar),
    paraBirimi: String(s.ParaBirimi ?? 'TL'),
    kargoTakipNo: String(s.KargoTakipNo ?? ''),
    ham: s
  }
}

export function useSiparis() {
  const [rows, setRows] = useState<SiparisOzet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (filtre: SiparisFiltre = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.ticimax.selectSiparis(filtre, {
        BaslangicIndex: 0,
        KayitSayisi: 100,
        SiralamaDegeri: 'ID',
        SiralamaYonu: 'DESC'
      })
      if (!res.ok) throw new Error(res.error ?? 'Siparişler alınamadı')
      setRows(((res.data ?? []) as Record<string, unknown>[]).map(mapSiparis))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setDurum = useCallback(
    async (siparisId: number, durum: number, kargoTakipNo?: string, mail = true) => {
      const res = await window.api.ticimax.setSiparisDurum({
        SiparisID: siparisId,
        Durum: durum,
        KargoTakipNo: kargoTakipNo,
        MailBilgilendir: mail
      })
      return res.ok && (res.data as { ok: boolean })?.ok
    },
    []
  )

  return { rows, loading, error, load, setDurum }
}
