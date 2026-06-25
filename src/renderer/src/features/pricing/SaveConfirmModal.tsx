import { useState } from 'react'
import './pricing.css'

interface Props {
  dirtyCount: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Çift onaylı kaydetme. 1. adım uyarı + özet, 2. adım "Emin misin? :)".
 * Ancak ikinci onaydan sonra Ticimax'e yazılır (feedback-save-confirm-ux).
 */
export function SaveConfirmModal({ dirtyCount, onConfirm, onCancel }: Props): JSX.Element {
  const [adim, setAdim] = useState<1 | 2>(1)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {adim === 1 ? (
          <>
            <div className="modal-ikon uyari">⚠️</div>
            <h2>Dikkat — Canlı siteyi etkiler</h2>
            <p>
              <strong>{dirtyCount}</strong> üründe yaptığın fiyat değişikliği{' '}
              <strong>Ticimax'e gönderilecek</strong> ve sitende anında yayına girecek. Bu işlem
              geri alınamaz.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onCancel}>
                Vazgeç
              </button>
              <button className="btn btn-warn" onClick={() => setAdim(2)}>
                Devam et
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-ikon emin">🙂</div>
            <h2>Emin misin? :)</h2>
            <p>
              {dirtyCount} ürünün fiyatı güncellenecek. Gerçekten gönderelim mi?
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onCancel}>
                Hayır, dur
              </button>
              <button className="btn btn-primary" onClick={onConfirm}>
                Evet, gönder 🚀
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
