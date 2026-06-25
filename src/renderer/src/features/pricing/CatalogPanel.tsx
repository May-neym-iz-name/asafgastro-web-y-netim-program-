import { useEffect, useState } from 'react'

interface Katalog {
  id: string
  ad: string
}

interface Props {
  onClose: () => void
}

/**
 * Tedarikçi katalog PDF görüntüleyici — sağdan açılır drawer. Kataloglar
 * uygulama veri klasöründe saklanır (userData/catalogs). Marka/tedarikçi gibi
 * açılır kutudan seçilip görüntülenir; ekle (kopyalar) / sil. Fiyat güncellerken
 * yan yana açık tutulur (sol menü daraltılarak grid'e yer açılır).
 */
export function CatalogDrawer({ onClose }: Props): JSX.Element {
  const [kataloglar, setKataloglar] = useState<Katalog[]>([])
  const [seciliId, setSeciliId] = useState<string>('')

  // PDF, base64 yerine güvenli özel protokolle stream edilir (boyut limiti yok)
  const pdfSrc = seciliId ? `safepdf://katalog/${encodeURIComponent(seciliId)}` : null

  async function listele(): Promise<void> {
    const res = await window.api.catalog.list()
    if (res.ok) setKataloglar((res.data ?? []) as Katalog[])
  }
  useEffect(() => {
    listele()
  }, [])

  async function ekle(): Promise<void> {
    const res = await window.api.catalog.add()
    if (res.ok && res.data?.length) {
      await listele()
      setSeciliId((res.data[0] as Katalog).id)
    }
  }

  async function sil(): Promise<void> {
    if (!seciliId) return
    if (!window.confirm(`"${seciliId}" katalogu silinsin mi?`)) return
    await window.api.catalog.delete(seciliId)
    setSeciliId('')
    listele()
  }

  return (
    <div className="katalog-drawer">
      <div className="katalog-head">
        <strong>📁 Tedarikçi Katalogları</strong>
        <button className="btn-mini" onClick={onClose} title="Kapat">✕</button>
      </div>

      <div className="katalog-arac-satir">
        <select className="katalog-select" value={seciliId} onChange={(e) => setSeciliId(e.target.value)}>
          <option value="">Katalog seç…</option>
          {kataloglar.map((k) => (
            <option key={k.id} value={k.id}>{k.ad}</option>
          ))}
        </select>
        <button className="btn btn-soft" onClick={ekle}>＋ Ekle</button>
        <button className="btn btn-ghost" onClick={sil} disabled={!seciliId}>🗑 Sil</button>
      </div>

      <div className="katalog-goruntu">
        {pdfSrc ? (
          <iframe title="katalog" src={pdfSrc} className="katalog-iframe" />
        ) : (
          <div className="katalog-bos">
            {kataloglar.length ? 'Görüntülemek için bir katalog seç' : 'Katalog eklemek için ＋ Ekle'}
          </div>
        )}
      </div>
    </div>
  )
}
