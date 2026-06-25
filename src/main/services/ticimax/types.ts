/**
 * Ticimax web servis veri sözleşmeleri (ihtiyaç duyulan alt küme).
 * Tam alan listesi: hafıza referansı reference-ticimax-api.
 * Not: SaveUrun'da yalnız ilgili `...Guncelle` maskesi true olan alanlar yazılır.
 */

// -1 = filtre yok; status flag'lerinde -1=hepsi, 0=false, 1=true
export interface UrunFiltre {
  Aktif?: number
  Firsat?: number
  Indirimli?: number
  Vitrin?: number
  KategoriID?: number
  MarkaID?: number
  UrunKartiID?: number
  Barkod?: string
  TedarikciID?: number
  ToplamStokAdediBas?: number
  ToplamStokAdediSon?: number
}

export interface UrunSayfalama {
  BaslangicIndex: number
  KayitSayisi: number
  SiralamaDegeri: string // ör. "ID"
  SiralamaYonu: 'ASC' | 'DESC'
}

export interface VaryasyonOzellik {
  Tanim: string
  Deger: string
}

export interface Varyasyon {
  ID: number
  SatisFiyati: number
  AlisFiyati?: number
  IndirimliFiyati?: number
  PiyasaFiyati?: number
  KdvDahil?: boolean
  KdvOrani?: number
  ParaBirimiID: number
  ParaBirimi?: string
  ParaBirimiKodu?: string
  StokAdedi?: number
  StokKodu?: string
  Barkod?: string
  Desi?: number
  Aktif?: boolean
  Ozellikler?: VaryasyonOzellik[]
  Resimler?: string[]
  TedarikciKodu?: string
}

export interface UrunKartiTeknikDetay {
  DegerID: number
  OzellikID: number
}

export interface UrunKarti {
  ID: number
  Aktif?: boolean
  UrunAdi: string
  Aciklama: string
  AnaKategori?: string
  AnaKategoriID: number
  Kategoriler?: number[]
  MarkaID: number
  TedarikciID: number
  TedarikciKodu?: string
  Resimler?: string[]
  SatisBirimi?: string
  UcretsizKargo?: boolean
  Vitrin?: boolean
  YeniUrun?: boolean
  FirsatUrunu?: boolean
  TeknikDetayGrupID?: number
  TeknikDetaylar?: UrunKartiTeknikDetay[]
  Varyasyonlar: Varyasyon[]
}

/** SaveUrun kart güncelleme maskesi — yalnız true olan alanlar yazılır. */
export interface UrunKartiAyar {
  AciklamaGuncelle?: boolean
  AktifGuncelle?: boolean
  UrunAdiGuncelle?: boolean
  KategoriGuncelle?: boolean
  MarkaGuncelle?: boolean
  TedarikciGuncelle?: boolean
  UrunResimGuncelle?: boolean
  Base64Resim?: boolean
  OncekiResimleriSil?: boolean
  ResimleriIndirme?: boolean
  VitrinGuncelle?: boolean
  YeniUrunGuncelle?: boolean
  TeknikDetayGuncelle?: boolean
  UserAgent?: string
}

/** SaveUrun/SaveVaryasyon varyasyon güncelleme maskesi. */
export interface VaryasyonAyar {
  SatisFiyatiGuncelle?: boolean
  AlisFiyatiGuncelle?: boolean
  IndirimliFiyatiGuncelle?: boolean
  PiyasaFiyatiGuncelle?: boolean
  KdvDahilGuncelle?: boolean
  KdvOraniGuncelle?: boolean
  ParaBirimiGuncelle?: boolean
  StokAdediGuncelle?: boolean
  AktifGuncelle?: boolean
  BarkodGuncelle?: boolean
  StokKoduGuncelle?: boolean
  UrunResimGuncelle?: boolean
}

export interface ParaBirimi {
  ID: number
  Kur: number
  DovizKodu: string
  Tanim: string
  Aktif?: boolean
}

/** Genel hata zarfı (IsError/IsErros yazımı metoda göre değişir, false=başarı). */
export interface TicimaxEnvelope {
  ErrorMessage?: string
  IsError?: boolean
  IsErros?: boolean
}
