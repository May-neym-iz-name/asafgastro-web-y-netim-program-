import { useEffect, useState } from 'react'
import { ModulePlaceholder } from '@renderer/components/ui/ModulePlaceholder'
import type { ConfigStatus } from '@shared/ipc'

export function SettingsScreen(): JSX.Element {
  const [status, setStatus] = useState<ConfigStatus | null>(null)

  useEffect(() => {
    window.api.config.getStatus().then((res) => {
      if (res.ok) setStatus(res.data)
    })
  }, [])

  return (
    <div>
      {status && (
        <div className="card" style={{ maxWidth: 980, margin: '0 auto 24px', padding: 24 }}>
          <h2 style={{ color: 'var(--color-accent-deep)', marginBottom: 12 }}>
            Bağlantı Durumu
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ConfigBadge label="Ticimax" ok={status.ticimax} />
            <ConfigBadge label="UPS Kargo" ok={status.ups} />
            <ConfigBadge label="Supabase" ok={status.supabase} />
            <ConfigBadge label="GitHub" ok={status.github} />
          </div>
        </div>
      )}
      <ModulePlaceholder
        baslik="Ayarlar"
        ikon="⚙️"
        ozet="Yetkilendirme, bağlantılar, döviz kaynakları ve katalog yönetimi"
        planlananlar={[
          'Rol bazlı yetkilendirme — her işlem için izin tanımları',
          'Kullanıcı yönetimi (Supabase Auth)',
          'Bağlantı/sır ayarları (Ticimax, UPS, Supabase) — güvenli saklama',
          'Döviz kaynağı ayarları (TCMB / DenizBank) ve marjlar',
          'Katalog PDF yönetimi (ekle/sil)',
          'Sürüm ve otomatik güncelleme'
        ]}
      />
    </div>
  )
}

function ConfigBadge({ label, ok }: { label: string; ok: boolean }): JSX.Element {
  return <span className={`status-dot ${ok ? 'ok' : 'off'}`}>{label}</span>
}
