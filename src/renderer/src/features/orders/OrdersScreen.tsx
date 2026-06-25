import { useState } from 'react'
import './orders.css'
import { useSiparis, type SiparisFiltre, type SiparisOzet } from './useSiparis'
import { durumBilgi, DURUM_SECENEKLERI } from './siparisDurum'

const SIMGE: Record<string, string> = { TL: '₺', TRY: '₺', USD: '$', EUR: '€' }
function tutar(v: number, pb: string): string {
  return `${SIMGE[pb] ?? ''}${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function tarih(s: string): string {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('tr-TR')
}

export function OrdersScreen(): JSX.Element {
  const sip = useSiparis()
  const [filtre, setFiltre] = useState<SiparisFiltre>({})
  const [secili, setSecili] = useState<SiparisOzet | null>(null)
  const [islemMsg, setIslemMsg] = useState<string | null>(null)

  function uygula(): void {
    sip.load(filtre)
  }

  async function durumDegistir(s: SiparisOzet, durum: number): Promise<void> {
    let takip: string | undefined
    if (durum === 6) {
      takip = window.prompt('Kargo takip numarası (opsiyonel):') || undefined
    }
    setIslemMsg('Güncelleniyor…')
    const ok = await sip.setDurum(s.id, durum, takip)
    setIslemMsg(ok ? `✓ #${s.id} durumu güncellendi` : `✗ #${s.id} güncellenemedi`)
    if (ok) sip.load(filtre)
  }

  return (
    <div className="orders">
      <div className="ord-toolbar card">
        <select
          value={filtre.SiparisDurumu ?? -1}
          onChange={(e) => setFiltre((f) => ({ ...f, SiparisDurumu: Number(e.target.value) }))}
        >
          <option value={-1}>Tüm durumlar</option>
          {Object.entries(durumSecenek()).map(([id, ad]) => (
            <option key={id} value={id}>{ad}</option>
          ))}
        </select>
        <input
          placeholder="Sipariş No"
          value={filtre.SiparisNo ?? ''}
          onChange={(e) => setFiltre((f) => ({ ...f, SiparisNo: e.target.value }))}
        />
        <input
          placeholder="Telefon"
          value={filtre.UyeTelefon ?? ''}
          onChange={(e) => setFiltre((f) => ({ ...f, UyeTelefon: e.target.value }))}
        />
        <input
          type="date"
          value={filtre.SiparisTarihiBas?.slice(0, 10) ?? ''}
          onChange={(e) => setFiltre((f) => ({ ...f, SiparisTarihiBas: e.target.value }))}
        />
        <button className="btn btn-soft" onClick={uygula}>Filtrele</button>
        <button className="btn btn-ghost" onClick={() => { setFiltre({}); sip.load({}) }}>Temizle</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => sip.load(filtre)} disabled={sip.loading}>↻ Yenile</button>
      </div>

      {islemMsg && <div className="ord-msg">{islemMsg}</div>}
      {sip.error && <div className="ord-msg err">{sip.error}</div>}
      {sip.loading && <div className="ord-msg">Siparişler yükleniyor…</div>}

      <div className="grid-wrap card">
        <table className="grid">
          <thead>
            <tr>
              <th>No</th><th className="left">Müşteri</th><th>Tarih</th>
              <th>Durum</th><th>Tutar</th><th>Kargo Takip</th><th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {sip.rows.map((s) => {
              const d = durumBilgi(s.durum)
              return (
                <tr key={s.id} onClick={() => setSecili(s)} className="ord-row">
                  <td>#{s.id}</td>
                  <td className="left">{s.adiSoyadi || '—'}</td>
                  <td>{tarih(s.tarih)}</td>
                  <td><span className="durum-badge" style={{ background: d.renk }}>{d.ad}</span></td>
                  <td>{tutar(s.toplam, s.paraBirimi)}</td>
                  <td className="muted">{s.kargoTakipNo || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className="durum-select" value="" onChange={(e) => e.target.value && durumDegistir(s, Number(e.target.value))}>
                      <option value="">Durum →</option>
                      {DURUM_SECENEKLERI.map((o) => (
                        <option key={o.id} value={o.id}>{o.ad}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
            {!sip.loading && sip.rows.length === 0 && (
              <tr><td colSpan={7} className="empty">Sipariş bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {secili && <SiparisDetay s={secili} onClose={() => setSecili(null)} />}
    </div>
  )
}

function durumSecenek(): Record<number, string> {
  return { 1: 'Onay Bekliyor', 2: 'Onaylandı', 4: 'Paketleniyor', 6: 'Kargoya Verildi', 7: 'Teslim Edildi', 8: 'İptal' }
}

function arr(node: unknown, key: string): Record<string, unknown>[] {
  if (node == null) return []
  const inner = (node as Record<string, unknown>)[key] ?? node
  return Array.isArray(inner) ? (inner as Record<string, unknown>[]) : [inner as Record<string, unknown>]
}

function SiparisDetay({ s, onClose }: { s: SiparisOzet; onClose: () => void }): JSX.Element {
  const urunler = arr(s.ham.Urunler, 'WebSiparisUrun')
  const teslimat = (s.ham.TeslimatAdresi ?? {}) as Record<string, unknown>
  const fatura = (s.ham.FaturaAdresi ?? {}) as Record<string, unknown>
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Sipariş #{s.id}</h2>
          <button className="btn-mini" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          <h3>Ürünler</h3>
          <table className="detay-tablo">
            <thead><tr><th className="left">Ürün</th><th>Adet</th><th>Tutar</th></tr></thead>
            <tbody>
              {urunler.map((u, i) => (
                <tr key={i}>
                  <td className="left">{String(u.UrunAdi ?? '')}</td>
                  <td>{String(u.Adet ?? '')}</td>
                  <td>{String(u.Tutar ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Teslimat Adresi</h3>
          <p className="adres">{String(teslimat.AliciAdi ?? '')} — {String(teslimat.Adres ?? '')} {String(teslimat.Ilce ?? '')}/{String(teslimat.Il ?? '')} · {String(teslimat.AliciTelefon ?? '')}</p>

          <h3>Fatura Adresi</h3>
          <p className="adres">{String(fatura.FirmaAdi ?? '')} {String(fatura.Adres ?? '')} {String(fatura.Ilce ?? '')}/{String(fatura.Il ?? '')}{fatura.VergiNo ? ` · VKN: ${fatura.VergiNo}` : ''}</p>
        </div>
      </div>
    </div>
  )
}
