import { useEffect, useState } from 'react'

export type Dock = 'right' | 'left' | 'top' | 'bottom'

interface Katalog {
  ad: string
  yol: string
}
const KATALOG_KEY = 'asaf-kataloglar'

function load(): Katalog[] {
  try {
    return JSON.parse(localStorage.getItem(KATALOG_KEY) || '[]') as Katalog[]
  } catch {
    return []
  }
}

interface Props {
  dock: Dock
  onDockChange: (d: Dock) => void
  onClose: () => void
}

/**
 * Tedarikçi katalog PDF görüntüleyici. Diskten PDF ekle/sil (liste localStorage'da,
 * dosya yolu tutulur), seçilince base64 data URL olarak iframe'de gösterilir.
 * Sağ/sol/üst/alt dock seçilebilir.
 */
export function CatalogPanel({ dock, onDockChange, onClose }: Props): JSX.Element {
  const [kataloglar, setKataloglar] = useState<Katalog[]>(load)
  const [aktif, setAktif] = useState<string | null>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => {
    localStorage.setItem(KATALOG_KEY, JSON.stringify(kataloglar))
  }, [kataloglar])

  async function ekle(): Promise<void> {
    const res = await window.api.catalog.pick()
    if (res.ok && res.data?.length) {
      const yeni = res.data as Katalog[]
      setKataloglar((k) => {
        const mevcut = new Set(k.map((x) => x.yol))
        return [...k, ...yeni.filter((y) => !mevcut.has(y.yol))]
      })
    }
  }

  async function ac(k: Katalog): Promise<void> {
    setAktif(k.yol)
    setYukleniyor(true)
    const res = await window.api.catalog.read(k.yol)
    setDataUrl(res.ok ? (res.data as string) : null)
    setYukleniyor(false)
  }

  function sil(yol: string): void {
    setKataloglar((k) => k.filter((x) => x.yol !== yol))
    if (aktif === yol) {
      setAktif(null)
      setDataUrl(null)
    }
  }

  return (
    <div className={`katalog-panel dock-${dock}`}>
      <div className="katalog-head">
        <strong>📁 Tedarikçi Katalogları</strong>
        <div className="katalog-araclar">
          <select value={dock} onChange={(e) => onDockChange(e.target.value as Dock)} title="Konum">
            <option value="right">Sağ</option>
            <option value="left">Sol</option>
            <option value="top">Üst</option>
            <option value="bottom">Alt</option>
          </select>
          <button className="btn-mini" onClick={ekle} title="Katalog ekle">＋</button>
          <button className="btn-mini" onClick={onClose} title="Kapat">✕</button>
        </div>
      </div>

      <div className="katalog-list">
        {kataloglar.length === 0 && <span className="katalog-bos">Katalog eklemek için ＋</span>}
        {kataloglar.map((k) => (
          <span key={k.yol} className={`katalog-chip ${aktif === k.yol ? 'aktif' : ''}`}>
            <button onClick={() => ac(k)}>{k.ad}</button>
            <button className="chip-sil" onClick={() => sil(k.yol)}>✕</button>
          </span>
        ))}
      </div>

      <div className="katalog-goruntu">
        {yukleniyor && <div className="katalog-bos">Yükleniyor…</div>}
        {!yukleniyor && dataUrl && (
          <iframe title="katalog" src={dataUrl} className="katalog-iframe" />
        )}
        {!yukleniyor && !dataUrl && <div className="katalog-bos">Görüntülemek için bir katalog seç</div>}
      </div>
    </div>
  )
}
