import { useState } from 'react'
import './shipping.css'
import { useSehirler, useIlceArea } from './useKargo'

const UPS_STATUS: Record<number, string> = {
  1: 'Giriş tarandı', 2: 'Teslim edildi', 3: 'Özel durum (sorun)', 4: 'Dağıtıma çıktı',
  5: 'Kurye geri getirdi', 6: 'Şubeye gönderildi', 7: 'Şubeden geldi', 17: 'İade çıkışı'
}

export function ShippingScreen(): JSX.Element {
  const [tab, setTab] = useState<'olustur' | 'takip'>('olustur')
  return (
    <div className="shipping">
      <div className="ship-tabs">
        <button className={tab === 'olustur' ? 'active' : ''} onClick={() => setTab('olustur')}>Gönderi Oluştur</button>
        <button className={tab === 'takip' ? 'active' : ''} onClick={() => setTab('takip')}>Kargo Takip</button>
      </div>
      {tab === 'olustur' ? <GonderiOlustur /> : <KargoTakip />}
    </div>
  )
}

interface SenderState {
  ad: string; adres: string; telefon: string; cityId: number | null; districtName: string
}
const SENDER_KEY = 'asaf-ups-sender'
function loadSender(): SenderState {
  try {
    return { ...{ ad: '', adres: '', telefon: '', cityId: null, districtName: '' }, ...JSON.parse(localStorage.getItem(SENDER_KEY) || '{}') }
  } catch {
    return { ad: '', adres: '', telefon: '', cityId: null, districtName: '' }
  }
}

function GonderiOlustur(): JSX.Element {
  const sehirler = useSehirler()
  const [sender, setSender] = useState<SenderState>(loadSender)
  const senderArea = useIlceArea(sender.cityId)

  const [alici, setAlici] = useState({ ad: '', telefon: '', adres: '', cityId: null as number | null, areaCode: 0 })
  const aliciArea = useIlceArea(alici.cityId)

  const [paketSayisi, setPaketSayisi] = useState(1)
  const [agirlik, setAgirlik] = useState('1')
  const [icerik, setIcerik] = useState('')
  const [sonuc, setSonuc] = useState<{ ok: boolean; mesaj: string; shipmentNo?: string; label?: string } | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  function saveSender(s: SenderState): void {
    setSender(s)
    localStorage.setItem(SENDER_KEY, JSON.stringify(s))
  }

  async function olustur(): Promise<void> {
    if (!alici.ad || !alici.adres || !alici.cityId || !alici.areaCode) {
      setSonuc({ ok: false, mesaj: 'Alıcı ad, adres, il ve semt (area) zorunlu.' }); return
    }
    if (!sender.ad || !sender.adres || !sender.cityId) {
      setSonuc({ ok: false, mesaj: 'Gönderici bilgileri eksik (Gönderici bölümünü doldur).' }); return
    }
    // Gönderici area: ilk area (basitleştirilmiş) — ideali ayrı seçim
    const senderAreaCode = senderArea.areas[0]?.areaCode ?? 0
    setGonderiliyor(true); setSonuc({ ok: true, mesaj: 'Gönderi oluşturuluyor…' })
    const girdi = {
      gonderici: { ad: sender.ad, adres: sender.adres, cityCode: sender.cityId, areaCode: senderAreaCode, telefon: sender.telefon },
      alici: { ad: alici.ad, adres: alici.adres, cityCode: alici.cityId, areaCode: alici.areaCode, telefon: alici.telefon, cepTelefonu: alici.telefon },
      paketSayisi, smsAlici: true,
      paketler: Array.from({ length: paketSayisi }, () => ({ DescriptionOfGoods: icerik || 'Ürün', Length: 0, Height: 0, Width: 0, Weight: Number(agirlik) || 1 }))
    }
    try {
      const res = await window.api.ups.createShipment(girdi)
      const d = res.data as { ok: boolean; shipmentNo?: string; labelLink?: string; errorDefinition?: string } | null
      if (res.ok && d?.ok) {
        setSonuc({ ok: true, mesaj: `✓ Gönderi oluşturuldu`, shipmentNo: d.shipmentNo, label: d.labelLink })
      } else {
        setSonuc({ ok: false, mesaj: `✗ ${d?.errorDefinition ?? res.error ?? 'Gönderi oluşturulamadı'}` })
      }
    } catch (e) {
      setSonuc({ ok: false, mesaj: `✗ ${e instanceof Error ? e.message : String(e)}` })
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <div className="ship-form">
      <section className="card ship-section">
        <h2>Gönderici <span className="hint">(bir kez doldur, kaydedilir)</span></h2>
        <div className="row2">
          <Inp label="Firma/Ad" value={sender.ad} on={(v) => saveSender({ ...sender, ad: v })} />
          <Inp label="Telefon" value={sender.telefon} on={(v) => saveSender({ ...sender, telefon: v })} />
        </div>
        <Inp label="Adres" value={sender.adres} on={(v) => saveSender({ ...sender, adres: v })} />
        <Sel label="İl" value={sender.cityId ?? 0} on={(v) => saveSender({ ...sender, cityId: v || null })} ops={sehirler.map((s) => ({ v: s.cityId, t: s.cityName }))} />
      </section>

      <section className="card ship-section">
        <h2>Alıcı</h2>
        <div className="row2">
          <Inp label="Ad Soyad" value={alici.ad} on={(v) => setAlici({ ...alici, ad: v })} />
          <Inp label="Telefon" value={alici.telefon} on={(v) => setAlici({ ...alici, telefon: v })} />
        </div>
        <Inp label="Adres" value={alici.adres} on={(v) => setAlici({ ...alici, adres: v })} />
        <div className="row2">
          <Sel label="İl" value={alici.cityId ?? 0} on={(v) => setAlici({ ...alici, cityId: v || null, areaCode: 0 })} ops={sehirler.map((s) => ({ v: s.cityId, t: s.cityName }))} />
          <Sel label="Semt / Bölge (Area)" value={alici.areaCode} on={(v) => setAlici({ ...alici, areaCode: v })} ops={aliciArea.areas.map((a) => ({ v: a.areaCode, t: a.nameTr }))} />
        </div>
      </section>

      <section className="card ship-section">
        <h2>Paket</h2>
        <div className="row3">
          <Inp label="Paket Sayısı" type="number" value={String(paketSayisi)} on={(v) => setPaketSayisi(Number(v) || 1)} />
          <Inp label="Ağırlık (kg)" type="number" value={agirlik} on={setAgirlik} />
          <Inp label="İçerik" value={icerik} on={setIcerik} />
        </div>
      </section>

      {sonuc && (
        <div className={`ship-sonuc ${sonuc.ok ? '' : 'err'}`}>
          <div>{sonuc.mesaj}</div>
          {sonuc.shipmentNo && <div className="takip-no">Takip No: <strong>{sonuc.shipmentNo}</strong></div>}
          {sonuc.label && <a href={sonuc.label} target="_blank" rel="noreferrer">🏷️ Etiketi yazdır</a>}
        </div>
      )}
      <button className="btn-kaydet" onClick={olustur} disabled={gonderiliyor}>
        {gonderiliyor ? 'Oluşturuluyor…' : 'Gönderi Oluştur'}
      </button>
    </div>
  )
}

function KargoTakip(): JSX.Element {
  const [no, setNo] = useState('')
  const [durum, setDurum] = useState<{ statusCode?: number; processDescription1?: string; operationBranchName?: string; processTimeStamp?: string } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function sorgula(): Promise<void> {
    if (!no.trim()) return
    setMsg('Sorgulanıyor…'); setDurum(null)
    const res = await window.api.ups.track(no.trim())
    if (res.ok && res.data) {
      setDurum(res.data as typeof durum)
      setMsg(null)
    } else {
      setMsg(res.error ?? 'Takip bilgisi alınamadı')
    }
  }

  return (
    <div className="ship-takip">
      <div className="card ship-section">
        <h2>Kargo Takip</h2>
        <div className="takip-bar">
          <input placeholder="Takip numarası (1Z…)" value={no} onChange={(e) => setNo(e.target.value)} />
          <button className="btn btn-soft" onClick={sorgula}>Sorgula</button>
        </div>
        {msg && <div className="ship-sonuc">{msg}</div>}
        {durum && (
          <div className="takip-sonuc">
            <span className="durum-badge" style={{ background: durum.statusCode === 2 ? '#16a34a' : durum.statusCode === 3 ? '#dc2626' : '#0891b2' }}>
              {UPS_STATUS[durum.statusCode ?? 0] ?? `Durum ${durum.statusCode}`}
            </span>
            <p>{durum.processDescription1}</p>
            <p className="muted">{durum.operationBranchName} · {durum.processTimeStamp}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Inp({ label, value, on, type = 'text' }: { label: string; value: string; on: (v: string) => void; type?: string }): JSX.Element {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => on(e.target.value)} />
    </div>
  )
}
function Sel({ label, value, on, ops }: { label: string; value: number; on: (v: number) => void; ops: { v: number; t: string }[] }): JSX.Element {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => on(Number(e.target.value))}>
        <option value={0}>Seç…</option>
        {ops.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </div>
  )
}
