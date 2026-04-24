import { T } from '../theme.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: '▦' },
  { id: 'stock',     label: 'Inventario',   icon: '▤' },
  { id: 'scan',      label: 'Cargar Stock', icon: '+'  },
  { id: 'settings',  label: 'Configuración',icon: '⚙', adminOnly: true },
]

export default function Sidebar({ view, setView }) {
  const { role, user, signOut } = useAuth()

  return (
    <div style={{
      width: 196, minHeight: '100vh', background: T.sidebar,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      fontFamily: T.font,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem .75rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, background: T.accent, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, color: '#0D1B2A', flexShrink: 0,
          }}>SI</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Stock</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>Indumentaria</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.5rem' }}>
        {NAV.filter(n => !n.adminOnly || role === 'admin').map(n => (
          <div
            key={n.id}
            onClick={() => setView(n.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 12px', borderRadius: 8, marginBottom: 2,
              cursor: 'pointer', transition: 'all .15s',
              background: view === n.id ? T.sidebarActive : 'transparent',
              color: view === n.id ? T.accent : 'rgba(255,255,255,.5)',
              fontWeight: view === n.id ? 600 : 400,
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
            {n.label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '.75rem 1rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>
          {user?.email && (
            <div style={{ marginBottom: 6, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
          <span style={{
            background: 'rgba(255,255,255,.07)', padding: '2px 8px', borderRadius: 20,
            color: role === 'admin' ? T.accent : 'rgba(255,255,255,.4)',
          }}>
            {role ?? '—'}
          </span>
        </div>
        <button
          onClick={signOut}
          style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
