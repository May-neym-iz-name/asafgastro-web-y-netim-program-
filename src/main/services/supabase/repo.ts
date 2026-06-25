import { getSupabase } from './client'

/**
 * Senkron veri erişimi: tedarikçi liste fiyatı + iskonto (tüm kullanıcılar
 * arası senkron), FX ayarları, audit log. RLS izinleri zorlar.
 */

export interface SupplierPrice {
  varyasyon_id: number | null
  stok_kodu: string | null
  tedarikci_id: number | null
  liste_fiyati: number | null
  para_birimi: string
  iskonto_orani: number | null
  net_alis: number | null
}

/** Tüm senkron tedarikçi fiyatlarını çeker (fiyat grid'i besler). */
export async function listSupplierPrices(): Promise<SupplierPrice[]> {
  const { data, error } = await getSupabase()
    .from('supplier_prices')
    .select('varyasyon_id, stok_kodu, tedarikci_id, liste_fiyati, para_birimi, iskonto_orani, net_alis')
  if (error) throw new Error(error.message)
  return (data ?? []) as SupplierPrice[]
}

/** Tedarikçi fiyatlarını toplu upsert eder (varyasyon_id çakışmasında günceller). */
export async function upsertSupplierPrices(rows: SupplierPrice[]): Promise<number> {
  const { data: u } = await getSupabase().auth.getUser()
  const payload = rows.map((r) => ({ ...r, updated_by: u.user?.id, updated_at: new Date().toISOString() }))
  const { error, count } = await getSupabase()
    .from('supplier_prices')
    .upsert(payload, { onConflict: 'varyasyon_id', count: 'exact' })
  if (error) throw new Error(error.message)
  return count ?? rows.length
}

export interface FxSettings {
  alis_kaynak: string
  satis_kaynak: string
  marjlar: Record<string, unknown>
}

export async function getFxSettings(): Promise<FxSettings> {
  const { data, error } = await getSupabase()
    .from('fx_settings')
    .select('alis_kaynak, satis_kaynak, marjlar')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as FxSettings) ?? { alis_kaynak: 'TCMB', satis_kaynak: 'TCMB', marjlar: {} }
}

export async function setFxSettings(s: Partial<FxSettings>): Promise<void> {
  const { error } = await getSupabase()
    .from('fx_settings')
    .update({ ...s, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw new Error(error.message)
}

export interface RolDto {
  id: number
  ad: string
  izinler: string[]
}

/** Rolleri izinleriyle birlikte döndürür. */
export async function listRoles(): Promise<RolDto[]> {
  const { data, error } = await getSupabase()
    .from('roles')
    .select('id, ad, role_permissions(izin)')
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    ad: String(r.ad),
    izinler: ((r.role_permissions ?? []) as { izin: string }[]).map((p) => p.izin)
  }))
}

export interface ProfilDto {
  id: string
  adSoyad: string | null
  rolId: number | null
  rolAd: string | null
  aktif: boolean
}

/** Kullanıcı profillerini rolleriyle döndürür (kullanici.yonet gerekir). */
export async function listProfiles(): Promise<ProfilDto[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, ad_soyad, aktif, role_id, roles(ad)')
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((p) => ({
    id: String(p.id),
    adSoyad: (p.ad_soyad as string) ?? null,
    rolId: p.role_id != null ? Number(p.role_id) : null,
    rolAd: ((p.roles as { ad?: string } | null)?.ad) ?? null,
    aktif: Boolean(p.aktif)
  }))
}

/** Bir kullanıcının rolünü değiştirir. */
export async function setUserRole(userId: string, roleId: number): Promise<void> {
  const { error } = await getSupabase().from('profiles').update({ role_id: roleId }).eq('id', userId)
  if (error) throw new Error(error.message)
}

/** Audit log kaydı ekler (fiyat değişiklikleri vb.). */
export async function logAudit(islem: string, varlik: string, detay: unknown): Promise<void> {
  const { data: u } = await getSupabase().auth.getUser()
  await getSupabase().from('audit_log').insert({
    user_id: u.user?.id,
    islem,
    varlik,
    detay: detay as Record<string, unknown>
  })
}
