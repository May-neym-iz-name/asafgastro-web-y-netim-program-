import soap from 'soap'
import { config } from '../../config'

/**
 * UPS Kargo SMART SOAP istemcileri (ASMX). İki servis: gönderi (login dahil)
 * ve takip. Kimlik tamamen SOAP body içindeki SessionID ile sağlanır.
 */

const ENDPOINTS = {
  shipment: 'https://ws.ups.com.tr/wsCreateShipment/wsCreateShipment.asmx',
  tracking: 'https://ws.ups.com.tr/QueryPackageInfo/wsQueryPackagesInfo.asmx'
} as const

export type UpsServis = keyof typeof ENDPOINTS

const clientCache = new Map<UpsServis, Promise<soap.Client>>()

function getClient(servis: UpsServis): Promise<soap.Client> {
  let client = clientCache.get(servis)
  if (!client) {
    client = soap
      .createClientAsync(`${ENDPOINTS[servis]}?wsdl`, { disableCache: true })
      .then((c) => {
        c.setEndpoint(ENDPOINTS[servis])
        return c
      })
    clientCache.set(servis, client)
  }
  return client
}

// ---- Oturum yönetimi: 5dk sliding TTL, cache + otomatik yeniden login ----
const SESSION_TTL_MS = 4 * 60 * 1000 // 5dk'nın güvenli altı (4dk)
let cachedSession: { id: string; expiresAt: number } | null = null

interface LoginResult {
  SessionID?: string
  ErrorCode?: number | string
  ErrorDefinition?: string
}

/** Geçerli SessionID döndürür; yoksa/expire ise yeniden login yapar. */
export async function getSession(): Promise<string> {
  const now = Date.now()
  if (cachedSession && cachedSession.expiresAt > now) {
    return cachedSession.id
  }
  const client = await getClient('shipment')
  const [res] = await client.Login_Type1Async({
    CustomerNumber: config.ups.customerCode,
    UserName: config.ups.userCode,
    Password: config.ups.userPass
  })
  const r = (res?.Login_Type1Result ?? {}) as LoginResult
  if (!r.SessionID || String(r.ErrorCode) !== '0') {
    throw new Error(`UPS login hatası: ${r.ErrorDefinition || r.ErrorCode || 'bilinmeyen'}`)
  }
  cachedSession = { id: r.SessionID, expiresAt: now + SESSION_TTL_MS }
  return r.SessionID
}

/** Bir UPS gönderi/takip metodunu SessionID ile çağırır (TTL'i tazeler). */
export async function callUps<T = unknown>(
  servis: UpsServis,
  op: string,
  args: Record<string, unknown>
): Promise<T> {
  const session = await getSession()
  const client = await getClient(servis)
  const method = (client as unknown as Record<string, (a: unknown) => Promise<unknown[]>>)[
    `${op}Async`
  ]
  if (typeof method !== 'function') throw new Error(`UPS ${servis}.${op} bulunamadı`)
  const [result] = await method({ SessionID: session, ...args })
  // Başarılı çağrı oturum süresini tazeler
  if (cachedSession) cachedSession.expiresAt = Date.now() + SESSION_TTL_MS
  return (result as Record<string, unknown>)?.[`${op}Result`] as T
}

export function resetSession(): void {
  cachedSession = null
  clientCache.clear()
}
