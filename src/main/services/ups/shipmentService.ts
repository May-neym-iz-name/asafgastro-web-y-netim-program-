import { callUps } from './client'
import { config } from '../../config'
import type { GonderiGirdi, GonderiSonuc, UpsAdres } from './types'

/** UpsAdres → SOAP Shipper/Consignee alanları (önek ile). */
function adresAlanlari(prefix: 'Shipper' | 'Consignee', a: UpsAdres): Record<string, unknown> {
  return {
    [`${prefix}Name`]: a.ad,
    [`${prefix}ContactName`]: a.ilgiliKisi ?? a.ad,
    [`${prefix}Address`]: a.adres,
    [`${prefix}CityCode`]: a.cityCode,
    [`${prefix}AreaCode`]: a.areaCode,
    [`${prefix}PostalCode`]: a.postaKodu ?? '',
    [`${prefix}PhoneNumber`]: a.telefon ?? '',
    [`${prefix}MobilePhoneNumber`]: a.cepTelefonu ?? '',
    [`${prefix}EMail`]: a.email ?? ''
  }
}

/**
 * UPS gönderisi oluşturur (CreateShipment_Type3). Başarıda 1Z... takip no +
 * etiket döner. DİKKAT: gerçek gönderi yaratır — çift onay arkasından çağrılmalı.
 */
export async function createShipment(girdi: GonderiGirdi): Promise<GonderiSonuc> {
  if (girdi.paketler.length !== girdi.paketSayisi) {
    return {
      ok: false,
      errorDefinition: 'Paket boyut sayısı paketSayisi ile eşleşmiyor'
    }
  }

  const shipmentInfo: Record<string, unknown> = {
    ShipperAccountNumber: config.ups.customerCode,
    ...adresAlanlari('Shipper', girdi.gonderici),
    ConsigneeAccountNumber: '',
    ...adresAlanlari('Consignee', girdi.alici),
    ServiceLevel: girdi.serviceLevel ?? 3,
    PaymentType: girdi.paymentType ?? 2,
    PackageType: girdi.packageType ?? 'K',
    NumberOfPackages: girdi.paketSayisi,
    CustomerReferance: girdi.referans ?? '',
    CustomerInvoiceNumber: girdi.faturaNo ?? '',
    IdControlFlag: 0,
    SmsToConsignee: girdi.smsAlici ? 1 : 0,
    InsuranceValue: 0,
    ValueOfGoods: 0,
    ValueOfGoodsPaymentType: 0,
    PackageDimensions: {
      DimensionInfo: girdi.paketler
    }
  }

  const result = await callUps<Record<string, unknown>>('shipment', 'CreateShipment_Type3', {
    ShipmentInfo: shipmentInfo,
    ReturnLabelLink: true,
    ReturnLabelImage: true
  })

  const errorCode = result?.ErrorCode
  const ok = String(errorCode) === '0' && Boolean(result?.ShipmentNo)
  const barkod = result?.BarkodArrayPng as { string?: string[] } | undefined
  return {
    ok,
    shipmentNo: result?.ShipmentNo as string | undefined,
    labelLink: result?.LinkForLabelPrinting as string | undefined,
    barkodPng: Array.isArray(barkod?.string) ? barkod?.string : barkod?.string ? [barkod.string] : [],
    errorCode: errorCode as number | string,
    errorDefinition: result?.ErrorDefinition as string | undefined
  }
}

/** Gönderiyi iptal eder (alımdan önce). */
export async function cancelShipment(waybillNumber: string): Promise<{ ok: boolean; raw: unknown }> {
  const result = await callUps<Record<string, unknown>>('shipment', 'Cancel_Shipment_V1', {
    CustomerCode: config.ups.customerCode,
    WaybillNumber: waybillNumber
  })
  return { ok: String(result?.ErrorCode) === '0', raw: result }
}
