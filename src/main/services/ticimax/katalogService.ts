import { call } from './client'

/**
 * Kategori / Marka / Tedarikçi seçim sarmalayıcıları (Ürün Ekleme seçicileri için).
 * WSDL param adları: SelectKategori(kategoriID,dil,parentID),
 * SelectMarka(markaID,kategoriID), SelectTedarikci(tedarikciID,kategoriID).
 */

function toArray<T>(node: unknown, key: string): T[] {
  if (node == null) return []
  const inner = (node as Record<string, unknown>)[key] ?? node
  return Array.isArray(inner) ? (inner as T[]) : [inner as T]
}

export interface KategoriDto {
  Id: number
  Tanim: string
  Pid?: number
  Aktif?: boolean
}
export interface MarkaDto {
  ID: number
  Tanim: string
  Aktif?: boolean
}
export interface TedarikciDto {
  ID: number
  Tanim: string
  Aktif?: boolean
}

export async function selectKategori(kategoriID = 0, parentID = -1): Promise<KategoriDto[]> {
  const result = await call('UrunServis', 'SelectKategori', {
    kategoriID,
    dil: '',
    parentID
  })
  return toArray<KategoriDto>(result, 'Kategori')
}

export async function selectMarka(markaID = 0, kategoriID = 0): Promise<MarkaDto[]> {
  const result = await call('UrunServis', 'SelectMarka', { markaID, kategoriID })
  return toArray<MarkaDto>(result, 'Marka')
}

export async function selectTedarikci(tedarikciID = 0, kategoriID = 0): Promise<TedarikciDto[]> {
  const result = await call('UrunServis', 'SelectTedarikci', { tedarikciID, kategoriID })
  return toArray<TedarikciDto>(result, 'Tedarikci')
}
