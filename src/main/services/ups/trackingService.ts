import { callUps } from './client'
import type { TakipOlay } from './types'

function toArray<T>(node: unknown): T[] {
  if (node == null) return []
  return Array.isArray(node) ? (node as T[]) : [node as T]
}

function mapOlay(t: Record<string, unknown>): TakipOlay {
  return {
    processTimeStamp: t.ProcessTimeStamp as string,
    operationBranchName: t.OperationBranchName as string,
    statusCode: Number(t.StatusCode),
    exceptionCode: t.ExceptionCode as string,
    processDescription1: t.ProcessDescription1 as string,
    processDescription2: t.ProcessDescription2 as string,
    recordNumber: t.RecordNumber != null ? Number(t.RecordNumber) : undefined
  }
}

/** Takip numarasının son durum olayını döndürür (rozet için). */
export async function getLastTransaction(trackingNumber: string): Promise<TakipOlay | null> {
  const result = await callUps<Record<string, unknown>>(
    'tracking',
    'GetLastTransactionByTrackingNumber_V1',
    { TrackingNumber: trackingNumber, InformationLevel: 1 }
  )
  if (!result || String(result.ErrorCode) !== '0') return null
  // Sonuç tek transaction veya { Transaction: {...} } olabilir
  const node = (result.Transaction ?? result) as Record<string, unknown>
  return mapOlay(node)
}

/** Takip numarasının tüm olay zaman çizelgesini döndürür. */
export async function getTransactions(trackingNumber: string): Promise<TakipOlay[]> {
  const result = await callUps<Record<string, unknown>>(
    'tracking',
    'GetTransactionsByTrackingNumber_V1',
    { TrackingNumber: trackingNumber, InformationLevel: 1 }
  )
  if (!result) return []
  const node = (result.Transaction ?? result.Transactions ?? result) as unknown
  return toArray<Record<string, unknown>>(node).map(mapOlay)
}
