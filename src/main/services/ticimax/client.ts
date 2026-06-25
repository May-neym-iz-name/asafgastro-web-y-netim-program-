import * as soap from 'soap'
import { config } from '../../config'

/**
 * Ticimax WCF (.svc) SOAP istemci fabrikası. Her servis için istemci tembel
 * oluşturulur ve cache'lenir. Kimlik her metoda `UyeKodu` olarak geçer.
 */

export type TicimaxServis = 'UrunServis' | 'SiparisServis' | 'CustomServis' | 'UyeServis'

const clientCache = new Map<TicimaxServis, Promise<soap.Client>>()

function wsdlUrl(servis: TicimaxServis): string {
  return `${config.ticimax.baseUrl}/Servis/${servis}.svc?wsdl`
}

function endpointUrl(servis: TicimaxServis): string {
  return `${config.ticimax.baseUrl}/Servis/${servis}.svc`
}

export function getClient(servis: TicimaxServis): Promise<soap.Client> {
  let client = clientCache.get(servis)
  if (!client) {
    client = soap
      .createClientAsync(wsdlUrl(servis), {
        forceSoap12Headers: false, // basicHttpBinding = SOAP 1.1
        disableCache: true
      })
      .then((c) => {
        // WCF WSDL'inden endpoint çözümü node-soap'ta hataya yol açıyor;
        // endpoint'i açıkça veriyoruz (svcutil.exe parse hatasını önler).
        c.setEndpoint(endpointUrl(servis))
        return c
      })
    clientCache.set(servis, client)
  }
  return client
}

/** Test/yeniden bağlanma için istemci cache'ini temizler. */
export function resetClients(): void {
  clientCache.clear()
}

/** Her çağrının ilk argümanı olan web servis anahtarı. */
export function uyeKodu(): string {
  const key = config.ticimax.wsKey
  if (!key) throw new Error('TICIMAX_WS_KEY tanımlı değil (.env)')
  return key
}

/**
 * node-soap metodunu çağırır ve `<Op>Result` zarfını döndürür.
 * @param servis Hedef Ticimax servisi
 * @param op Operasyon adı (ör. "SelectUrun")
 * @param args İlk arg UyeKodu otomatik eklenir; geri kalan parametreler verilir.
 */
export async function call<T = unknown>(
  servis: TicimaxServis,
  op: string,
  args: Record<string, unknown>
): Promise<T> {
  const client = await getClient(servis)
  const method = (client as unknown as Record<string, (a: unknown) => Promise<unknown[]>>)[
    `${op}Async`
  ]
  if (typeof method !== 'function') {
    throw new Error(`Ticimax ${servis}.${op} bulunamadı (WSDL'de yok)`)
  }
  const [result] = await method({ UyeKodu: uyeKodu(), ...args })
  const resultKey = `${op}Result`
  const envelope = result as Record<string, unknown>
  return (envelope?.[resultKey] ?? envelope) as T
}
