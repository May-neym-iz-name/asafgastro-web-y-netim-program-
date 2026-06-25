import { useMemo, useState } from 'react'
import './pricing.css'
import type { FxKaynak } from '@shared/domain'
import { usePricing } from './usePricing'
import { SaveConfirmModal } from './SaveConfirmModal'
import { CatalogPanel, type Dock } from './CatalogPanel'
import { buildSavePayload, buildSupplierUpsert } from './savePricing'
import type { PricingRow } from './model'

const SIMGE: Record<string, string> = { TRY: '₺', TL: '₺', USD: '$', EUR: '€' }
function fmt(v: number | null, pb = 'TRY'): string {
  if (v == null) return '—'
  return `${(SIMGE[pb] ?? '')}${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PricingScreen(): JSX.Element {
  const p = usePricing()
  const [iskontoInput, setIskontoInput] = useState('')
  const [karInput, setKarInput] = useState('')
  const [kritikMarj, setKritikMarj] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [katalogAcik, setKatalogAcik] = useState(false)
  const [dock, setDock] = useState<Dock>('right')

  const kritik = kritikMarj === '' ? null : Number(kritikMarj)
  const gorunen = useMemo(
    () =>
      kritik == null
        ? p.rows
        : p.rows.filter((r) => r.karOrani != null && r.karOrani <= kritik),
    [p.rows, kritik]
  )

  const num = (v: string): number | null => (v === '' ? null : Number(v))

  async function handleSave(): Promise<void> {
    setShowSave(false)
    const dirty = p.dirtyRows
    if (dirty.length === 0) return
    setSaveMsg('Kaydediliyor…')
    try {
      const { urunKartlari, ukAyar, vAyar } = buildSavePayload(dirty)
      const res = await window.api.ticimax.saveUrun(urunKartlari, ukAyar, vAyar)
      // Tedarikçi liste fiyatı + iskonto Supabase senkron (varsa)
      try {
        await window.api.supabase.upsertSupplierPrices(buildSupplierUpsert(dirty))
      } catch {
        /* Supabase hazır değilse atla */
      }
      if (res.ok && res.data?.ok) {
        p.markSaved()
        setSaveMsg(`✓ ${dirty.length} ürün güncellendi`)
      } else {
        setSaveMsg(`✗ Hata: ${res.error ?? 'Ticimax kaydı başarısız'}`)
      }
    } catch (e) {
      setSaveMsg(`✗ Hata: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const allSelected = gorunen.length > 0 && gorunen.every((r) => p.secili.has(r.varyasyonId))
  function toggleAll(): void {
    const next = new Set(p.secili)
    if (allSelected) gorunen.forEach((r) => next.delete(r.varyasyonId))
    else gorunen.forEach((r) => next.add(r.varyasyonId))
    p.setSecili(next)
  }
  function toggleOne(id: number): void {
    const next = new Set(p.secili)
    next.has(id) ? next.delete(id) : next.add(id)
    p.setSecili(next)
  }

  return (
    <div className="pricing">
      <div className="pricing-toolbar card">
        <div className="tb-group">
          <label>Alış kuru</label>
          <select
            value={p.alisKaynak}
            onChange={(e) => p.setKaynak(e.target.value as FxKaynak, p.satisKaynak)}
          >
            <option value="TCMB">TCMB</option>
            <option value="DENIZBANK">DenizBank</option>
          </select>
        </div>
        <div className="tb-group">
          <label>Satış kuru</label>
          <select
            value={p.satisKaynak}
            onChange={(e) => p.setKaynak(p.alisKaynak, e.target.value as FxKaynak)}
          >
            <option value="TCMB">TCMB</option>
            <option value="DENIZBANK">DenizBank</option>
          </select>
        </div>
        <div className="tb-sep" />
        <div className="tb-group">
          <label>Toplu iskonto %</label>
          <input
            type="number"
            value={iskontoInput}
            onChange={(e) => setIskontoInput(e.target.value)}
            placeholder="ör. 55"
          />
          <button className="btn btn-soft" onClick={() => iskontoInput && p.topluIskonto(Number(iskontoInput))}>
            Uygula ({p.secili.size})
          </button>
        </div>
        <div className="tb-group">
          <label>Toplu kâr %</label>
          <input
            type="number"
            value={karInput}
            onChange={(e) => setKarInput(e.target.value)}
            placeholder="ör. 35"
          />
          <button className="btn btn-soft" onClick={() => karInput && p.topluKar(Number(karInput))}>
            Uygula ({p.secili.size})
          </button>
        </div>
        <div className="tb-sep" />
        <div className="tb-group">
          <label>Kritik kâr marjı ≤ %</label>
          <input
            type="number"
            value={kritikMarj}
            onChange={(e) => setKritikMarj(e.target.value)}
            placeholder="filtre"
          />
        </div>
        <div className="tb-spacer" />
        <button className={`btn ${katalogAcik ? 'btn-soft' : 'btn-ghost'}`} onClick={() => setKatalogAcik((v) => !v)}>
          📁 Katalog
        </button>
        <button className="btn btn-ghost" onClick={p.reload} disabled={p.loading}>
          ↻ Yenile
        </button>
        <button
          className="btn btn-primary"
          disabled={p.dirtyRows.length === 0}
          onClick={() => setShowSave(true)}
        >
          Kaydet {p.dirtyRows.length > 0 && `(${p.dirtyRows.length})`}
        </button>
      </div>

      {saveMsg && <div className="pricing-msg">{saveMsg}</div>}
      {p.error && <div className="pricing-msg err">Hata: {p.error}</div>}
      {p.loading && <div className="pricing-msg">Canlı ürünler ve kurlar yükleniyor…</div>}

      <div className={`pricing-body dock-${dock}`}>
      <div className="grid-wrap card">
        <table className="grid">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="left">Ürün</th>
              <th>Stok Kodu</th>
              <th>Aktif</th>
              <th>Liste Fiyatı</th>
              <th>İsk %</th>
              <th>Net Alış</th>
              <th>KDV %</th>
              <th>Satış (Hariç)</th>
              <th>Satış (Dahil)</th>
              <th>İndirimli</th>
              <th>Kâr ₺</th>
              <th>Kâr %</th>
            </tr>
          </thead>
          <tbody>
            {gorunen.map((r) => (
              <Row
                key={r.varyasyonId}
                r={r}
                secili={p.secili.has(r.varyasyonId)}
                onToggle={() => toggleOne(r.varyasyonId)}
                onEdit={(patch) => p.editRow(r.varyasyonId, patch)}
                num={num}
              />
            ))}
            {!p.loading && gorunen.length === 0 && (
              <tr>
                <td colSpan={13} className="empty">Gösterilecek ürün yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        {katalogAcik && (
          <CatalogPanel dock={dock} onDockChange={setDock} onClose={() => setKatalogAcik(false)} />
        )}
      </div>

      {showSave && (
        <SaveConfirmModal
          dirtyCount={p.dirtyRows.length}
          onConfirm={handleSave}
          onCancel={() => setShowSave(false)}
        />
      )}
    </div>
  )
}

interface RowProps {
  r: PricingRow
  secili: boolean
  onToggle: () => void
  onEdit: (patch: Partial<PricingRow>) => void
  num: (v: string) => number | null
}

function Row({ r, secili, onToggle, onEdit, num }: RowProps): JSX.Element {
  const kritik = r.karOrani != null && r.karOrani <= 10
  return (
    <tr className={`${r.dirty ? 'dirty' : ''} ${kritik ? 'kritik' : ''}`}>
      <td><input type="checkbox" checked={secili} onChange={onToggle} /></td>
      <td className="left urun" title={r.urunAdi}>{r.urunAdi}</td>
      <td className="muted">{r.stokKodu || '—'}</td>
      <td>
        <input type="checkbox" checked={r.aktif} onChange={(e) => onEdit({ aktif: e.target.checked })} />
      </td>
      <td>
        <input className="cell-input" type="number" value={r.tedarikciListeFiyati ?? ''}
          onChange={(e) => onEdit({ tedarikciListeFiyati: num(e.target.value) })} />
        <span className="pb">{r.tedarikciParaBirimi}</span>
      </td>
      <td>
        <input className="cell-input sm" type="number" value={r.iskontoOrani ?? ''}
          onChange={(e) => onEdit({ iskontoOrani: num(e.target.value) })} />
      </td>
      <td className="muted">{fmt(r.netAlis, r.tedarikciParaBirimi)}</td>
      <td>
        <input className="cell-input sm" type="number" value={r.kdvOrani}
          onChange={(e) => onEdit({ kdvOrani: Number(e.target.value) || 0 })} />
      </td>
      <td>
        <input className="cell-input" type="number" value={r.satisKdvHaric ?? ''}
          onChange={(e) => onEdit({ satisKdvHaric: num(e.target.value), satisKdvDahil: null })} />
      </td>
      <td>
        <input className="cell-input" type="number" value={r.satisKdvDahil ?? ''}
          onChange={(e) => onEdit({ satisKdvDahil: num(e.target.value), satisKdvHaric: null })} />
      </td>
      <td>
        <input className="cell-input" type="number" value={r.indirimliFiyat ?? ''}
          onChange={(e) => onEdit({ indirimliFiyat: num(e.target.value) })} />
      </td>
      <td className={`muted ${(r.karTutari ?? 0) < 0 ? 'neg' : ''}`}>{fmt(r.karTutari)}</td>
      <td className={`kar ${(r.karOrani ?? 0) < 0 ? 'neg' : kritik ? 'warn' : 'ok'}`}>
        {r.karOrani != null ? `%${r.karOrani.toFixed(1)}` : '—'}
      </td>
    </tr>
  )
}
