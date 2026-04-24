import { T, fmtPeso, getStatus, isClavo, daysSince } from '../theme.js'
import { Crd, Bdg, Spinner } from '../components/ui.jsx'

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `0.5px solid ${T.border}`, borderRadius: T.radius, padding: '1rem', boxShadow: T.shadow }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function AlertRow({ p, type }) {
  const ds = daysSince(p.ultima_venta)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid ${T.border}` }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{p.tipo} {p.color} T:{p.talle}</span>
        <span style={{ fontSize: 11, color: T.light, marginLeft: 6 }}>{p.tela}{p.estampa ? ' · estampa' : ''}</span>
      </div>
      {type === 'clavo'
        ? <Bdg type="clavo">Sin venta {ds === 9999 ? 'nunca' : `${ds}d`}</Bdg>
        : <Bdg type={p.cantidad === 0 ? 'danger' : 'warning'}>{p.cantidad} uds</Bdg>
      }
    </div>
  )
}

export default function DashboardView({ products, config, loading, setView }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size={32} />
      </div>
    )
  }

  const lowStock = products.filter(p => p.cantidad > 0 && p.cantidad <= config.stock_minimo)
  const sinStock = products.filter(p => p.cantidad === 0)
  const clavos   = products.filter(p => isClavo(p, config) && p.cantidad > 0)
  const totalU   = products.reduce((a, p) => a + p.cantidad, 0)
  const valor    = products.reduce((a, p) => a + p.cantidad * p.precio, 0)

  return (
    <div style={{ padding: '1.5rem', fontFamily: T.font }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Dashboard</h2>
        <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>Resumen del inventario en tiempo real</p>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
        <MetricCard label="Productos"     value={products.length}            sub="referencias"             />
        <MetricCard label="Unidades"      value={totalU.toLocaleString('es-AR')} sub="en stock"            />
        <MetricCard label="Valor stock"   value={fmtPeso(valor)}             sub="precio × cantidad"       />
        <MetricCard label="Alertas"
          value={lowStock.length + sinStock.length}
          sub={`≤ ${config.stock_minimo} uds`}
          color={lowStock.length + sinStock.length > 0 ? T.danger : T.success}
        />
        <MetricCard label="Clavos"
          value={clavos.length}
          sub={`+ ${config.dias_clavo} días sin venta`}
          color={clavos.length > 0 ? T.clavo : T.success}
        />
      </div>

      {/* Paneles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Alertas de stock */}
        <Crd>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Alertas de stock</h3>
            <Bdg type="danger">{lowStock.length + sinStock.length} productos</Bdg>
          </div>
          {lowStock.length + sinStock.length === 0
            ? <p style={{ fontSize: 13, color: T.success, textAlign: 'center', padding: '1rem 0' }}>
                Todo el inventario en niveles normales
              </p>
            : [...sinStock, ...lowStock].map(p => <AlertRow key={p.id} p={p} type="alert" />)
          }
          <button
            onClick={() => setView('scan')}
            style={{ marginTop: 12, fontSize: 12, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Cargar stock →
          </button>
        </Crd>

        {/* Clavos */}
        <Crd>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Clavos</h3>
            <Bdg type="clavo">{clavos.length} productos</Bdg>
          </div>
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
            Sin ventas en los últimos {config.dias_clavo} días
          </p>
          {clavos.length === 0
            ? <p style={{ fontSize: 13, color: T.success, textAlign: 'center', padding: '1rem 0' }}>Sin clavos detectados</p>
            : clavos.map(p => <AlertRow key={p.id} p={p} type="clavo" />)
          }
        </Crd>
      </div>
    </div>
  )
}
