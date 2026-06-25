import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FxKaynak } from '@shared/domain'
import type { PricingRow } from './model'
import { editRow as editRowFn, applyKarOrani as applyKarFn, recompute } from './model'
import { buildRows, buildSupplierMap, toKurHaritasi, type SupplierPriceMap } from './buildRows'

interface State {
  rows: PricingRow[]
  loading: boolean
  error: string | null
  alisKaynak: FxKaynak
  satisKaynak: FxKaynak
  alisKur: Record<string, number>
  satisKur: Record<string, number>
  toplamUrun: number // Ticimax'teki toplam ürün (sayfalama uyarısı için)
  markaId: number // 0 = tümü (server filtre)
  tedarikciId: number // 0 = tümü (server filtre)
}

interface SecimItem {
  id: number
  ad: string
}

const SAYFA_BOYUTU = 200

const FX_KODLAR = ['USD', 'EUR']

export function usePricing() {
  const [state, setState] = useState<State>({
    rows: [],
    loading: false,
    error: null,
    alisKaynak: 'TCMB',
    satisKaynak: 'TCMB',
    alisKur: { TRY: 1 },
    satisKur: { TRY: 1 },
    toplamUrun: 0,
    markaId: 0,
    tedarikciId: 0
  })
  const [secili, setSecili] = useState<Set<number>>(new Set())
  const [markalar, setMarkalar] = useState<SecimItem[]>([])
  const [tedarikciler, setTedarikciler] = useState<SecimItem[]>([])

  // Marka + tedarikçi listeleri (filtre dropdownları için, bir kez)
  useEffect(() => {
    window.api.ticimax.selectMarka().then((r) => {
      if (r.ok)
        setMarkalar(
          (r.data ?? []).map((m) => {
            const x = m as Record<string, unknown>
            return { id: Number(x.ID), ad: String(x.Tanim ?? '') }
          })
        )
    })
    window.api.ticimax.selectTedarikci().then((r) => {
      if (r.ok)
        setTedarikciler(
          (r.data ?? []).map((t) => {
            const x = t as Record<string, unknown>
            return { id: Number(x.ID), ad: String(x.Tanim ?? '') }
          })
        )
    })
  }, [])

  const load = useCallback(
    async (alisKaynak: FxKaynak, satisKaynak: FxKaynak, markaId = 0, tedarikciId = 0) => {
      setState((s) => ({ ...s, loading: true, error: null }))
      const urunFiltre = {
        Aktif: -1,
        ...(markaId ? { MarkaID: markaId } : {}),
        ...(tedarikciId ? { TedarikciID: tedarikciId } : {})
      }
      try {
        const [alisRes, satisRes] = await Promise.all([
          window.api.fx.getRates(alisKaynak, FX_KODLAR),
          window.api.fx.getRates(satisKaynak, FX_KODLAR)
        ])
        const alisKur = toKurHaritasi(alisRes.ok ? alisRes.data ?? [] : [], 'alis')
        const satisKur = toKurHaritasi(satisRes.ok ? satisRes.data ?? [] : [], 'satis')

        // Tedarikçi fiyatları (Supabase) — migrasyon yoksa zarifçe boş geç
        let supplier: SupplierPriceMap = {}
        try {
          const sp = await window.api.supabase.listSupplierPrices()
          if (sp.ok) supplier = buildSupplierMap(sp.data ?? [])
        } catch {
          /* Supabase hazır değil — boş harita */
        }

        const [urunRes, countRes] = await Promise.all([
          window.api.ticimax.selectUrun(urunFiltre, {
            BaslangicIndex: 0,
            KayitSayisi: SAYFA_BOYUTU,
            SiralamaDegeri: 'ID',
            SiralamaYonu: 'DESC'
          }),
          window.api.ticimax.selectUrunCount(urunFiltre)
        ])
        if (!urunRes.ok) throw new Error(urunRes.error ?? 'Ürünler alınamadı')

        const rows = buildRows(urunRes.data ?? [], supplier, alisKur, satisKur)
        setState({
          rows,
          loading: false,
          error: null,
          alisKaynak,
          satisKaynak,
          alisKur,
          satisKur,
          toplamUrun: countRes.ok ? (countRes.data ?? rows.length) : rows.length,
          markaId,
          tedarikciId
        })
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) }))
      }
    },
    []
  )

  useEffect(() => {
    load('TCMB', 'TCMB')
  }, [load])

  const editRow = useCallback(
    (varyasyonId: number, patch: Partial<PricingRow>) => {
      setState((s) => ({
        ...s,
        rows: s.rows.map((r) =>
          r.varyasyonId === varyasyonId ? editRowFn(r, patch, s.alisKur, s.satisKur) : r
        )
      }))
    },
    []
  )

  /** Seçili satırlara toplu iskonto (%) uygular. */
  const topluIskonto = useCallback(
    (oran: number) => {
      setState((s) => ({
        ...s,
        rows: s.rows.map((r) =>
          secili.has(r.varyasyonId) ? editRowFn(r, { iskontoOrani: oran }, s.alisKur, s.satisKur) : r
        )
      }))
    },
    [secili]
  )

  /** Seçili satırlara toplu kâr oranı (%) uygular. */
  const topluKar = useCallback(
    (oran: number) => {
      setState((s) => ({
        ...s,
        rows: s.rows.map((r) =>
          secili.has(r.varyasyonId) ? applyKarFn(r, oran, s.alisKur, s.satisKur) : r
        )
      }))
    },
    [secili]
  )

  /** Seçili satırlara toplu para birimi uygular (alış veya satış). */
  const topluParaBirimi = useCallback(
    (alan: 'tedarikciParaBirimi' | 'satisParaBirimi', kod: string) => {
      setState((s) => ({
        ...s,
        rows: s.rows.map((r) =>
          secili.has(r.varyasyonId) ? editRowFn(r, { [alan]: kod }, s.alisKur, s.satisKur) : r
        )
      }))
    },
    [secili]
  )

  const dirtyRows = useMemo(() => state.rows.filter((r) => r.dirty), [state.rows])

  const markSaved = useCallback(() => {
    setState((s) => ({ ...s, rows: s.rows.map((r) => ({ ...r, dirty: false })) }))
  }, [])

  const setKaynak = useCallback(
    (alis: FxKaynak, satis: FxKaynak) => load(alis, satis, state.markaId, state.tedarikciId),
    [load, state.markaId, state.tedarikciId]
  )

  const setFiltre = useCallback(
    (markaId: number, tedarikciId: number) =>
      load(state.alisKaynak, state.satisKaynak, markaId, tedarikciId),
    [load, state.alisKaynak, state.satisKaynak]
  )

  return {
    ...state,
    secili,
    setSecili,
    markalar,
    tedarikciler,
    editRow,
    topluIskonto,
    topluKar,
    topluParaBirimi,
    dirtyRows,
    markSaved,
    reload: () => load(state.alisKaynak, state.satisKaynak, state.markaId, state.tedarikciId),
    setKaynak,
    setFiltre,
    recompute
  }
}
