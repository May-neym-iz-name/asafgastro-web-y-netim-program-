/**
 * Sabit ürün açıklama şablonu. Form alanlarından Ticimax `Aciklama` için
 * inline-CSS'li tek HTML bloğu üretir (editör inline stil ister). Marka turuncu
 * paleti (onizleme şablonlarıyla tutarlı).
 */

export interface TeknikOzellik {
  etiket: string
  deger: string
}

export interface AciklamaGirdi {
  baslik: string
  giris: string
  ozellikler: string[] // madde madde
  teknik: TeknikOzellik[] // tablo
}

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function buildAciklamaHtml(g: AciklamaGirdi): string {
  const baslik = esc(g.baslik || 'Ürün')
  const giris = g.giris.trim()
  const ozellikler = g.ozellikler.map((o) => o.trim()).filter(Boolean)
  const teknik = g.teknik.filter((t) => t.etiket.trim() || t.deger.trim())

  const girisHtml = giris
    ? `<p style="margin:0 0 22px;font-size:1rem;line-height:1.6;color:#334155;">${esc(giris)}</p>`
    : ''

  const ozellikHtml = ozellikler.length
    ? `<h2 style="color:#c2410c;font-size:1.2rem;font-weight:700;margin:24px 0 12px;">Ürün Özellikleri</h2>
       <ul style="margin:0 0 22px;padding-left:0;list-style:none;display:grid;gap:8px;">
         ${ozellikler
           .map(
             (o) =>
               `<li style="display:flex;gap:10px;align-items:flex-start;background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:10px 14px;font-size:.95rem;color:#1e293b;"><span style="color:#ea580c;font-weight:800;">✓</span><span>${esc(
                 o
               )}</span></li>`
           )
           .join('')}
       </ul>`
    : ''

  const teknikHtml = teknik.length
    ? `<h2 style="color:#c2410c;font-size:1.2rem;font-weight:700;margin:24px 0 12px;">Teknik Özellikler</h2>
       <table style="width:100%;border-collapse:collapse;font-size:.95rem;margin:0 0 8px;">
         <tbody>
           ${teknik
             .map(
               (t, i) =>
                 `<tr style="background:${i % 2 ? '#fffbf5' : '#ffffff'};">
                    <td style="padding:10px 14px;font-weight:700;color:#9a3412;border:1px solid #fed7aa;width:38%;">${esc(
                      t.etiket
                    )}</td>
                    <td style="padding:10px 14px;color:#334155;border:1px solid #fed7aa;">${esc(t.deger)}</td>
                  </tr>`
             )
             .join('')}
         </tbody>
       </table>`
    : ''

  return `<div style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:2px solid #fdba74;border-radius:20px;padding:28px;color:#1e293b;max-width:1100px;box-shadow:0 10px 25px rgba(234,88,12,.1);">
  <h1 style="color:#c2410c;font-size:1.5rem;font-weight:800;border-bottom:3px solid #f97316;padding-bottom:10px;margin:0 0 18px;text-transform:uppercase;">${baslik}</h1>
  ${girisHtml}
  ${ozellikHtml}
  ${teknikHtml}
</div>`
}
