import { useEffect, useRef, useState } from 'react'
import './FindBar.css'

/**
 * Uygulama içi arama çubuğu (Ctrl+F). Electron webContents.findInPage kullanır.
 * Enter sonraki, Shift+Enter önceki, Esc kapatır.
 */
export function FindBar(): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sonuc, setSonuc] = useState<{ active: number; matches: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => window.api.app.onFindResult(setSonuc), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.select(), 0)
      } else if (e.key === 'Escape' && open) {
        kapat()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function ara(q: string, forward = true, findNext = false): void {
    setQuery(q)
    if (q) window.api.app.find(q, { forward, findNext })
    else {
      window.api.app.stopFind()
      setSonuc(null)
    }
  }

  function kapat(): void {
    window.api.app.stopFind()
    setOpen(false)
    setSonuc(null)
  }

  if (!open) return null

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        value={query}
        placeholder="Ara…"
        autoFocus
        onChange={(e) => ara(e.target.value, true, false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') ara(query, !e.shiftKey, true)
          else if (e.key === 'Escape') kapat()
        }}
      />
      <span className="find-count">
        {query ? `${sonuc?.active ?? 0}/${sonuc?.matches ?? 0}` : ''}
      </span>
      <button className="btn-mini" title="Önceki" onClick={() => ara(query, false, true)}>↑</button>
      <button className="btn-mini" title="Sonraki" onClick={() => ara(query, true, true)}>↓</button>
      <button className="btn-mini" title="Kapat" onClick={kapat}>✕</button>
    </div>
  )
}
