# Asaf Gastro Web Yönetim Programı

Ticimax + UPS Kargo entegre, çok kullanıcılı (yetkilendirmeli), Supabase senkronlu, GitHub üzerinden otomatik güncellenen **Windows masaüstü yönetim uygulaması**.

Ticimax'in yetersiz kaldığı alanları kapatır: sabit formatlı ürün açıklaması, alış-iskonto-kâr bazlı gelişmiş toplu fiyat yönetimi (KDV dahil/hariç), UPS kargo gönderi/takip ve sipariş yönetimi.

## Teknoloji

- **Electron + TypeScript** (tek dil, uçtan uca) — main / preload / renderer
- **React + Vite** (electron-vite) arayüz
- **TanStack Query + Zustand** durum yönetimi
- **Supabase** (Auth + Postgres senkron + Storage)
- **SOAP** entegrasyonları: Ticimax (`.svc`), UPS Kargo SMART (`.asmx`)
- **electron-updater** ile GitHub Releases otomatik güncelleme

## Mimari

| Katman | Sorumluluk |
|--------|------------|
| `src/main` | Tüm dış entegrasyonlar ve **sırlar** (Ticimax/UPS SOAP, FX, Supabase service-role, updater). Sırlar renderer'a geçmez. |
| `src/preload` | `contextBridge` ile güvenli, tip-güvenli `window.api` yüzeyi |
| `src/renderer` | React arayüzü (modüller: Ürünler, Fiyat, Siparişler, Kargo, Ayarlar) |
| `src/shared` | Ortak TypeScript tipleri (IPC sözleşmesi, domain modelleri) |

## Geliştirme

```bash
npm install
cp .env.example .env   # gerçek değerleri girin (ASLA commit etmeyin)
npm run dev            # electron-vite dev
npm run typecheck      # tip kontrolü
npm test               # vitest
npm run build:win      # Windows installer (release/)
```

## Güvenlik

- Tüm sırlar `.env` (gitignore) + `safeStorage` + Supabase secrets üzerinden. Kaynak kodda sabit sır yoktur.
- `contextIsolation` açık, `nodeIntegration` kapalı, CSP tanımlı.
- Paylaşılan kimlik bilgileri (GitHub PAT, UPS şifresi) **rotasyona alınmalıdır**.

## Yol Haritası

- **Phase 0** — İskele (bu sürüm): app kabuğu, navigasyon, yapılandırma, updater.
- **Phase 1** — Servis katmanı (Ticimax/UPS/FX/Supabase/SQLite) + modül iskelet ekranları.
- **Phase 2+** — Fiyat Güncelleme → Ürün Ekleme → Siparişler/Kargo → Ayarlar.
