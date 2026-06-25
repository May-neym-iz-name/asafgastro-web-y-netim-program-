import { useEffect, useState } from 'react'
import './settings.css'
import type { ConfigStatus } from '@shared/ipc'
import type { FxKaynak } from '@shared/domain'
import { useAuth } from '@renderer/stores/authStore'

interface Rol { id: number; ad: string; izinler: string[] }
interface Profil { id: string; adSoyad: string | null; rolId: number | null; rolAd: string | null; aktif: boolean }

export function SettingsScreen(): JSX.Element {
  const { durum, user, hata, girisYap, cikisYap, strict, setStrict } = useAuth()
  const [status, setStatus] = useState<ConfigStatus | null>(null)
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')

  useEffect(() => {
    window.api.config.getStatus().then((r) => r.ok && setStatus(r.data))
  }, [])

  return (
    <div className="settings">
      {/* Hesap */}
      <section className="card set-section">
        <h2>Hesap</h2>
        {durum === 'authed' && user ? (
          <div className="hesap">
            <div>
              <strong>{user.adSoyad || user.email}</strong>
              <span className="rol-chip">{user.rol ?? 'rol yok'}</span>
            </div>
            <button className="btn btn-ghost" onClick={cikisYap}>Çıkış yap</button>
          </div>
        ) : (
          <div className="giris">
            <p className="muted-note">Yetkilendirmenin aktif olması için Supabase şeması uygulanmış ve kullanıcı oluşturulmuş olmalı. Giriş yapılmadığında uygulama geçici tam erişimle çalışır.</p>
            <div className="row2">
              <input placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Şifre" value={sifre} onChange={(e) => setSifre(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => girisYap(email, sifre)}>Giriş yap</button>
            {hata && <div className="set-err">{hata}</div>}
          </div>
        )}
        <label className="check strict-toggle">
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
          <span>
            <strong>Katı yetkilendirme modu</strong> — açıkken giriş yapılmadan hiçbir modül
            kullanılamaz. (Önce Supabase şeması + kullanıcı oluştur, sonra aç.)
          </span>
        </label>
      </section>

      {/* Bağlantı durumu */}
      {status && (
        <section className="card set-section">
          <h2>Bağlantı Durumu</h2>
          <div className="status-row">
            <span className={`status-dot ${status.ticimax ? 'ok' : 'off'}`}>Ticimax</span>
            <span className={`status-dot ${status.ups ? 'ok' : 'off'}`}>UPS Kargo</span>
            <span className={`status-dot ${status.supabase ? 'ok' : 'off'}`}>Supabase</span>
            <span className={`status-dot ${status.github ? 'ok' : 'off'}`}>GitHub</span>
          </div>
        </section>
      )}

      <FxAyarlari />
      <KullaniciYonetimi />
    </div>
  )
}

function FxAyarlari(): JSX.Element {
  const [alis, setAlis] = useState<FxKaynak>('TCMB')
  const [satis, setSatis] = useState<FxKaynak>('TCMB')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    window.api.supabase.getFxSettings().then((r) => {
      if (r.ok && r.data) {
        const d = r.data as { alis_kaynak?: string; satis_kaynak?: string }
        if (d.alis_kaynak) setAlis(d.alis_kaynak as FxKaynak)
        if (d.satis_kaynak) setSatis(d.satis_kaynak as FxKaynak)
      }
    }).catch(() => {})
  }, [])

  async function kaydet(): Promise<void> {
    setMsg('Kaydediliyor…')
    const r = await window.api.supabase.setFxSettings({ alis_kaynak: alis, satis_kaynak: satis })
    setMsg(r.ok ? '✓ Döviz ayarları kaydedildi' : `✗ ${r.error ?? 'Kaydedilemedi (Supabase şeması gerekli)'}`)
  }

  return (
    <section className="card set-section">
      <h2>Döviz Ayarları</h2>
      <div className="row2">
        <div className="field">
          <label>Alış kuru kaynağı</label>
          <select value={alis} onChange={(e) => setAlis(e.target.value as FxKaynak)}>
            <option value="TCMB">TCMB</option>
            <option value="DENIZBANK">DenizBank</option>
          </select>
        </div>
        <div className="field">
          <label>Satış kuru kaynağı</label>
          <select value={satis} onChange={(e) => setSatis(e.target.value as FxKaynak)}>
            <option value="TCMB">TCMB</option>
            <option value="DENIZBANK">DenizBank</option>
          </select>
        </div>
      </div>
      <button className="btn btn-soft" onClick={kaydet}>Kaydet</button>
      {msg && <div className="set-msg">{msg}</div>}
    </section>
  )
}

function KullaniciYonetimi(): JSX.Element {
  const [roller, setRoller] = useState<Rol[]>([])
  const [profiller, setProfiller] = useState<Profil[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function yukle(): Promise<void> {
    try {
      const [r, p] = await Promise.all([
        window.api.supabase.listRoles(),
        window.api.supabase.listProfiles()
      ])
      setRoller(r.ok ? (r.data as Rol[]) : [])
      setProfiller(p.ok ? (p.data as Profil[]) : [])
      if (!r.ok || !p.ok) setHata('Kullanıcı/rol verisi alınamadı — Supabase şeması uygulanmamış olabilir.')
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }
  useEffect(() => { yukle() }, [])

  async function rolDegistir(userId: string, roleId: number): Promise<void> {
    const res = await window.api.supabase.setUserRole(userId, roleId)
    if (!res.ok) {
      setHata(res.error ?? 'Rol değiştirilemedi')
      return
    }
    yukle()
  }

  return (
    <section className="card set-section">
      <h2>Kullanıcı & Yetki Yönetimi</h2>
      {hata && <div className="muted-note">{hata} Kullanıcı eklemek için Supabase paneli → Authentication → Users, ardından buradan rol ata.</div>}

      {roller.length > 0 && (
        <>
          <h3>Roller ve İzinler</h3>
          <div className="rol-grid">
            {roller.map((r) => (
              <div className="rol-kart" key={r.id}>
                <strong>{r.ad}</strong>
                <div className="izin-pills">
                  {r.izinler.map((i) => <span className="pill" key={i}>{i}</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {profiller.length > 0 && (
        <>
          <h3>Kullanıcılar</h3>
          <table className="kul-tablo">
            <thead><tr><th className="left">Kullanıcı</th><th>Rol</th><th>Durum</th></tr></thead>
            <tbody>
              {profiller.map((p) => (
                <tr key={p.id}>
                  <td className="left">{p.adSoyad || p.id.slice(0, 8)}</td>
                  <td>
                    <select value={p.rolId ?? 0} onChange={(e) => rolDegistir(p.id, Number(e.target.value))}>
                      <option value={0}>—</option>
                      {roller.map((r) => <option key={r.id} value={r.id}>{r.ad}</option>)}
                    </select>
                  </td>
                  <td>{p.aktif ? 'Aktif' : 'Pasif'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
