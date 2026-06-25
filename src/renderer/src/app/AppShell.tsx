import { useEffect, useState } from 'react'
import './AppShell.css'
import { NAV_MODULES } from './navigation'
import { ProductsScreen } from '@renderer/features/products/ProductsScreen'
import { PricingScreen } from '@renderer/features/pricing/PricingScreen'
import { OrdersScreen } from '@renderer/features/orders/OrdersScreen'
import { ShippingScreen } from '@renderer/features/shipping/ShippingScreen'
import { SettingsScreen } from '@renderer/features/settings/SettingsScreen'
import type { ConfigStatus } from '@shared/ipc'

const SCREENS: Record<string, () => JSX.Element> = {
  products: ProductsScreen,
  pricing: PricingScreen,
  orders: OrdersScreen,
  shipping: ShippingScreen,
  settings: SettingsScreen
}

export function AppShell(): JSX.Element {
  const [activeId, setActiveId] = useState<string>('pricing')
  const [version, setVersion] = useState<string>('')
  const [status, setStatus] = useState<ConfigStatus | null>(null)

  useEffect(() => {
    window.api.app.getVersion().then((res) => {
      if (res.ok && res.data) setVersion(res.data.version)
    })
    window.api.config.getStatus().then((res) => {
      if (res.ok) setStatus(res.data)
    })
  }, [])

  const active = NAV_MODULES.find((m) => m.id === activeId) ?? NAV_MODULES[0]
  const Screen = SCREENS[active.id] ?? PricingScreen

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AG</div>
          <div className="brand-text">
            <strong>Asaf Gastro</strong>
            <span>Web Yönetim</span>
          </div>
        </div>

        <nav>
          {NAV_MODULES.map((m) => (
            <button
              key={m.id}
              className={`nav-item ${m.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(m.id)}
              title={m.aciklama}
            >
              <span className="nav-ikon">{m.ikon}</span>
              {m.etiket}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          Sürüm v{version || '0.1.0'}
          <br />
          Ticimax + UPS entegre
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{active.etiket}</div>
          <div className="topbar-status">
            <span className={`status-dot ${status?.ticimax ? 'ok' : 'off'}`}>Ticimax</span>
            <span className={`status-dot ${status?.ups ? 'ok' : 'off'}`}>UPS</span>
            <span className={`status-dot ${status?.supabase ? 'ok' : 'off'}`}>Supabase</span>
          </div>
        </header>

        <main className="content">
          <Screen />
        </main>
      </div>
    </div>
  )
}
