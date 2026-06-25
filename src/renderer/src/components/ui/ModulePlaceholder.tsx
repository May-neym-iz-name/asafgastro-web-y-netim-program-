import './ModulePlaceholder.css'

interface ModulePlaceholderProps {
  baslik: string
  ozet: string
  ikon: string
  planlananlar: string[]
}

/**
 * Phase 1'de doldurulacak modüller için iskelet ekran.
 * Tasarım dili marka paletine uygun (jenerik şablon değil).
 */
export function ModulePlaceholder({
  baslik,
  ozet,
  ikon,
  planlananlar
}: ModulePlaceholderProps): JSX.Element {
  return (
    <div className="module-placeholder">
      <header className="mp-header">
        <div className="mp-ikon">{ikon}</div>
        <div>
          <h1>{baslik}</h1>
          <p>{ozet}</p>
        </div>
        <span className="pill mp-badge">İskelet · Phase 1</span>
      </header>

      <section className="card mp-roadmap">
        <h2>Bu modülde gelecek özellikler</h2>
        <ul>
          {planlananlar.map((item) => (
            <li key={item}>
              <span className="mp-check">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
