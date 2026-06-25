import { buildAciklamaHtml } from './descriptionTemplate'
import type { UrunFormState, SecimListeleri } from './useProductForm'

/** Form durumundan Ticimax SaveUrun yükü (yeni ürün: ID=0). */
export function buildProductPayload(
  form: UrunFormState,
  listeler: SecimListeleri
): { urunKartlari: unknown[]; ukAyar: Record<string, unknown>; vAyar: Record<string, unknown> } {
  const kategoriAd =
    listeler.kategoriler.find((k) => k.id === form.anaKategoriId)?.tanim ?? ''

  const aciklama = buildAciklamaHtml({
    baslik: form.urunAdi,
    giris: form.giris,
    ozellikler: form.ozellikler,
    teknik: form.teknik
  })

  const urunKarti = {
    ID: 0,
    Aktif: true,
    UrunAdi: form.urunAdi,
    Aciklama: aciklama,
    AnaKategori: kategoriAd,
    AnaKategoriID: form.anaKategoriId,
    Kategoriler: form.anaKategoriId ? [form.anaKategoriId] : [],
    MarkaID: form.markaId,
    TedarikciID: form.tedarikciId,
    TedarikciKodu: form.stokKodu || `AG-${Date.now()}`,
    Resimler: form.gorseller,
    SatisBirimi: form.satisBirimi || 'Adet',
    UcretsizKargo: false,
    Varyasyonlar: {
      Varyasyon: [
        {
          ID: 0,
          SatisFiyati: Number(form.satisFiyati) || 0,
          KdvDahil: form.kdvDahil,
          KdvOrani: form.kdvOrani,
          ParaBirimiID: form.paraBirimiId,
          StokAdedi: Number(form.stokAdedi) || 0,
          StokKodu: form.stokKodu,
          Barkod: form.barkod,
          Aktif: true
        }
      ]
    }
  }

  const ukAyar: Record<string, unknown> = {
    Base64Resim: form.gorseller.length > 0,
    ResimleriIndirme: false,
    UserAgent: 'AsafGastroWebYonetim'
  }
  // Yeni kayıt (ID=0) tüm alanları yazar; maskeler güncelleme içindir.
  const vAyar: Record<string, unknown> = {}

  return { urunKartlari: [urunKarti], ukAyar, vAyar }
}

/** Form doğrulama — eksik zorunlu alanları döndürür. */
export function validateForm(form: UrunFormState): string[] {
  const eksik: string[] = []
  if (!form.urunAdi.trim()) eksik.push('Ürün adı')
  if (!form.anaKategoriId) eksik.push('Kategori')
  if (!form.markaId) eksik.push('Marka')
  if (!form.tedarikciId) eksik.push('Tedarikçi')
  if (!form.paraBirimiId) eksik.push('Para birimi')
  if (!form.satisFiyati || Number(form.satisFiyati) <= 0) eksik.push('Satış fiyatı')
  if (!form.stokKodu.trim()) eksik.push('Stok kodu')
  return eksik
}
