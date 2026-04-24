import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext.jsx'
import { T } from './theme.js'
import Sidebar from './components/Sidebar.jsx'
import LoginView     from './views/LoginView.jsx'
import DashboardView from './views/DashboardView.jsx'
import StockView     from './views/StockView.jsx'
import ScanView      from './views/ScanView.jsx'
import SettingsView  from './views/SettingsView.jsx'
import { getInventario, db, subscribeInventario } from './lib/supabase.js'
import { Spinner } from './components/ui.jsx'

export default function App() {
  const { user, role, loading: authLoading } = useAuth()
  const [view,     setView]     = useState('dashboard')
  const [products, setProducts] = useState([])
  const [config,   setConfig]   = useState({
    dias_clavo: 60, stock_minimo: 5, google_vision_key: '',
    tipos: [], telas: [], colores: [], talles: [], ubicaciones: [],
  })
  const [dataLoading, setDataLoading] = useState(false)

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (!user) return

    const load = async () => {
      setDataLoading(true)
      try {
        // Cargar en paralelo
        const [inv, cfg, tipos, telas, colores, talles, ubicaciones] = await Promise.all([
          getInventario(),
          db.getConfig(),
          db.tipos.getAll(),
          db.telas.getAll(),
          db.colores.getAll(),
          db.talles.getAll(),
          db.ubicaciones.getAll(),
        ])
        setProducts(inv)
        setConfig({ ...cfg, tipos, telas, colores, talles, ubicaciones })
      } catch (e) {
        console.error('Error cargando datos:', e.message)
      }
      setDataLoading(false)
    }

    load()

    // Suscripción a cambios en tiempo real
    const channel = subscribeInventario((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      if (eventType === 'INSERT') {
        setProducts(prev => [newRecord, ...prev.filter(p => p.id !== newRecord.id)])
      } else if (eventType === 'UPDATE') {
        setProducts(prev => prev.map(p => p.id === newRecord.id ? newRecord : p))
      } else if (eventType === 'DELETE') {
        setProducts(prev => prev.filter(p => p.id !== oldRecord.id))
      }
    })

    return () => { channel.unsubscribe?.() }
  }, [user])

  // Redirigir según rol
  useEffect(() => {
    if (role === 'operario' && view !== 'scan') setView('scan')
    if (role === 'admin' && view === 'scan') setView('dashboard')
  }, [role])

  // Loading de auth
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={36} color={T.accent} />
      </div>
    )
  }

  // No autenticado
  if (!user) return <LoginView />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: T.font, background: T.bg }}>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {view === 'dashboard' && (
          <DashboardView
            products={products} config={config}
            loading={dataLoading} setView={setView}
          />
        )}
        {view === 'stock' && (
          <StockView
            products={products} setProducts={setProducts}
            config={config} loading={dataLoading}
          />
        )}
        {view === 'scan' && (
          <ScanView
            products={products} setProducts={setProducts}
            config={config}
          />
        )}
        {view === 'settings' && role === 'admin' && (
          <SettingsView config={config} setConfig={setConfig} />
        )}
      </div>
    </div>
  )
}
