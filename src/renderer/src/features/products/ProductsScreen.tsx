import { useMemo, useState } from 'react'
import './products.css'
import { buildAciklamaHtml } from './descriptionTemplate'
import { buildProductPayload, validateForm } from './buildProductPayload'
import { useProductForm, dosyalariBase64, BOS_FORM, type UrunFormState } from './useProductForm'

export function ProductsScreen(): JSX.Element {
  const { listeler, yukleniyor, hata } = useProductForm()
  const [form, setForm] = useState<UrunFormState>(BOS_FORM)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [kaydediyor, setKaydediyor] = useState(false)

  const set = <K extends keyof UrunFormState>(k: K, v: UrunFormState[K]): void =>
    setForm((f) => ({ ...f, [k]: v }))

  const onizleme = useMemo(
    () =>
      buildAciklamaHtml({
        baslik: form.urunAdi,
        giris: form.giris,
        ozellikler: form.ozellikler,
        teknik: form.teknik
      }),
    [form.urunAdi, form.giris, form.ozellikler, form.teknik]
  )

  async function gorselSec(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    if (!e.target.files?.length) return
    const b64 = await dosyalariBase64(e.target.files)
    set('gorseller', [...form.gorseller, ...b64])
    e.target.value = ''
  }

  async function kaydet(): Promise<void> {
    const eksik = validateForm(form)
    if (eksik.length) {
      setMesaj(`Eksik alanlar: ${eksik.join(', ')}`)
      return
    }
    if (!window.confirm('Bu ürün Ticimax\'e eklenecek ve sitende yayına girecek. Onaylıyor musun?'))
      return
    setKaydediyor(true)
    setMesaj('Kaydediliyor…')
    try {
      const { urunKartlari, ukAyar, vAyar } = buildProductPayload(form, listeler)
      const res = await window.api.ticimax.saveUrun(urunKartlari, ukAyar, vAyar)
      if (res.ok && res.data?.ok) {
        setMesaj('✓ Ürün başarıyla eklendi')
        setForm(BOS_FORM)
      } else {
        setMesaj(`✗ Hata: ${res.error ?? 'Ticimax kaydı başarısız'}`)
      }
    } catch (e) {
      setMesaj(`✗ Hata: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setKaydediyor(false)
    }
  }

  if (yukleniyor) return <div className="prod-msg">Seçim listeleri yükleniyor…</div>

  return (
    <div className="products">
      <div className="prod-form">
        {hata && <div className="prod-msg err">Liste yükleme hatası: {hata}</div>}

        <section className="card prod-section">
          <h2>Temel Bilgiler</h2>
          <div className="field">
            <label>Ürün Adı *</label>
            <input value={form.urunAdi} onChange={(e) => set('urunAdi', e.target.value)} />
          </div>
          <div className="row3">
            <div className="field">
              <label>Kategori *</label>
              <select value={form.anaKategoriId} onChange={(e) => set('anaKategoriId', Number(e.target.value))}>
                <option value={0}>Seç…</option>
                {listeler.kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>{k.tanim}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Marka *</label>
              <select value={form.markaId} onChange={(e) => set('markaId', Number(e.target.value))}>
                <option value={0}>Seç…</option>
                {listeler.markalar.map((m) => (
                  <option key={m.id} value={m.id}>{m.tanim}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tedarikçi *</label>
              <select value={form.tedarikciId} onChange={(e) => set('tedarikciId', Number(e.target.value))}>
                <option value={0}>Seç…</option>
                {listeler.tedarikciler.map((t) => (
                  <option key={t.id} value={t.id}>{t.tanim}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row3">
            <div className="field">
              <label>Stok Kodu *</label>
              <input value={form.stokKodu} onChange={(e) => set('stokKodu', e.target.value)} />
            </div>
            <div className="field">
              <label>Barkod</label>
              <input value={form.barkod} onChange={(e) => set('barkod', e.target.value)} />
            </div>
            <div className="field">
              <label>Satış Birimi</label>
              <input value={form.satisBirimi} onChange={(e) => set('satisBirimi', e.target.value)} />
            </div>
          </div>
          <div className="row3">
            <div className="field">
              <label>Para Birimi *</label>
              <select value={form.paraBirimiId} onChange={(e) => set('paraBirimiId', Number(e.target.value))}>
                <option value={0}>Seç…</option>
                {listeler.paraBirimleri.map((p) => (
                  <option key={p.id} value={p.id}>{p.kod} — {p.tanim}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Satış Fiyatı * ({form.kdvDahil ? 'KDV Dahil' : 'KDV Hariç'})</label>
              <input type="number" value={form.satisFiyati} onChange={(e) => set('satisFiyati', e.target.value)} />
            </div>
            <div className="field">
              <label>KDV %</label>
              <input type="number" value={form.kdvOrani} onChange={(e) => set('kdvOrani', Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="row3">
            <label className="check">
              <input type="checkbox" checked={form.kdvDahil} onChange={(e) => set('kdvDahil', e.target.checked)} />
              Fiyat KDV dahil
            </label>
            <div className="field">
              <label>Stok Adedi</label>
              <input type="number" value={form.stokAdedi} onChange={(e) => set('stokAdedi', e.target.value)} />
            </div>
            <div />
          </div>
        </section>

        <section className="card prod-section">
          <h2>Açıklama Şablonu</h2>
          <div className="field">
            <label>Giriş Metni</label>
            <textarea rows={3} value={form.giris} onChange={(e) => set('giris', e.target.value)} />
          </div>

          <label className="sub">Ürün Özellikleri (madde madde)</label>
          {form.ozellikler.map((o, i) => (
            <div className="liste-row" key={i}>
              <input value={o} placeholder={`Özellik ${i + 1}`} onChange={(e) => {
                const yeni = [...form.ozellikler]; yeni[i] = e.target.value; set('ozellikler', yeni)
              }} />
              <button className="btn-mini" onClick={() => set('ozellikler', form.ozellikler.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="btn-add" onClick={() => set('ozellikler', [...form.ozellikler, ''])}>+ Özellik ekle</button>

          <label className="sub">Teknik Özellikler (tablo)</label>
          {form.teknik.map((t, i) => (
            <div className="liste-row" key={i}>
              <input value={t.etiket} placeholder="Etiket (ör. Güç)" onChange={(e) => {
                const yeni = [...form.teknik]; yeni[i] = { ...yeni[i], etiket: e.target.value }; set('teknik', yeni)
              }} />
              <input value={t.deger} placeholder="Değer (ör. 2000W)" onChange={(e) => {
                const yeni = [...form.teknik]; yeni[i] = { ...yeni[i], deger: e.target.value }; set('teknik', yeni)
              }} />
              <button className="btn-mini" onClick={() => set('teknik', form.teknik.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="btn-add" onClick={() => set('teknik', [...form.teknik, { etiket: '', deger: '' }])}>+ Satır ekle</button>
        </section>

        <section className="card prod-section">
          <h2>Görseller</h2>
          <input type="file" accept="image/*" multiple onChange={gorselSec} />
          <div className="gorsel-onizleme">
            {form.gorseller.map((g, i) => (
              <div className="gorsel-thumb" key={i}>
                <img src={`data:image/*;base64,${g}`} alt={`görsel ${i + 1}`} />
                <button className="btn-mini" onClick={() => set('gorseller', form.gorseller.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
        </section>

        {mesaj && <div className={`prod-msg ${mesaj.startsWith('✗') ? 'err' : ''}`}>{mesaj}</div>}
        <button className="btn-kaydet" onClick={kaydet} disabled={kaydediyor}>
          {kaydediyor ? 'Kaydediliyor…' : 'Ürünü Ekle'}
        </button>
      </div>

      <div className="prod-preview">
        <div className="preview-label">Açıklama Önizleme</div>
        <div className="preview-frame" dangerouslySetInnerHTML={{ __html: onizleme }} />
      </div>
    </div>
  )
}
