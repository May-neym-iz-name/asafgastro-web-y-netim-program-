/**
 * UPS Kargo SMART veri sözleşmeleri. Alan adları SOAP şemasıyla birebir
 * (CustomerReferance gibi bilinçli yanlış yazımlar korunur). Detay: hafıza
 * referansı reference-ups-kargo-api.
 */

export interface UpsAdres {
  ad: string // ...Name (firma/kişi, 3-40)
  ilgiliKisi?: string // ...ContactName
  adres: string // ...Address (3-255)
  cityCode: number // plaka kodu (lookup)
  areaCode: number // UPS area kodu (lookup)
  postaKodu?: string
  telefon?: string
  cepTelefonu?: string
  email?: string
}

export interface DimensionInfo {
  DescriptionOfGoods: string
  Length: number
  Height: number
  Width: number
  Weight: number // kg (zorunlu)
}

/** Gönderi oluşturma için uygulama-dostu girdi. */
export interface GonderiGirdi {
  gonderici: UpsAdres
  alici: UpsAdres
  serviceLevel?: number // 3 = standart yurtiçi
  paymentType?: number // 1=alıcı, 2=gönderen, 4=3.şahıs
  packageType?: 'D' | 'K' // D=dosya, K=koli
  paketSayisi: number
  referans?: string // CustomerReferance
  faturaNo?: string
  smsAlici?: boolean
  paketler: DimensionInfo[] // sayısı paketSayisi'na eşit olmalı
}

export interface GonderiSonuc {
  ok: boolean
  shipmentNo?: string // 1Z... takip no
  labelLink?: string
  barkodPng?: string[] // base64
  errorCode?: number | string
  errorDefinition?: string
}

export interface TakipOlay {
  processTimeStamp?: string
  operationBranchName?: string
  statusCode?: number
  exceptionCode?: string
  processDescription1?: string
  processDescription2?: string
  recordNumber?: number
}

/** StatusCode → kullanıcı etiketi. */
export const UPS_STATUS: Record<number, string> = {
  1: 'Giriş tarandı',
  2: 'Teslim edildi',
  3: 'Özel durum (sorun)',
  4: 'Dağıtıma çıktı',
  5: 'Kurye geri getirdi',
  6: 'Şubeye gönderildi',
  7: 'Şubeden geldi',
  17: 'Gönderene iade çıkışı'
}
