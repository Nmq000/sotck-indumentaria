import { useState, useMemo } from 'react'
import { T, fmtPeso, getStatus, isClavo, exportCSV } from '../theme.js'
import { Btn, Bdg, Crd, Mdl, Inp, Sel, Alert, Spinner } from '../components/ui.jsx'
import QRModal from '../components/QRModal.jsx'
import { updateProducto, deleteProducto } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function StockView({ products, setProducts, config, loading }) {
  const { role } = useAuth()

  // Filtros
  const [search, setSearch] = useState('')
  const [fTipo,  setFTipo]  = useState('')
  const [fTela,  setFTela]  = useState('')
  const [fColor, setFColor] = useState('')
  const [fTalle, setFTalle] = useState('')
  const [fEst,   setFEst]   = useState('')

  // Edición inline
  const [editCell, setEditCell] = useState(null)  // { id, field }
  const [editVal,  setEditVal]  = useState('')
  const [saving,   setSaving]   = useState(false)

  // Modales
  const [qrProduct, setQrProduct] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [toast,      setToast]      = useState('')

  const showToast = (msg, ms = 3000) => { setToast(msg); setTimeout(() => setToast(''), ms) }

  // Listas únicas para filtros
  const tipos  = [...new Set(products.map(p => p.tipo))].sort()
  const telas  = [...new Set(products.map(p => p.tela))].sort()
  const colores= [...new Set(products.map(p => p.color))].sort()
  const talles = [...new Set(products.map(p => p.talle))].sort()

  const filtered = useMemo(() => products.filter(p => {
    const term = search.toLowerCase()
    if (search && ![p.tipo, p.tela, p.color, p.talle, p.sku ?? ''].join(' ').toLowerCase().includes(term)) return false
    if (fTipo  && p.tipo  !== fTipo)  return false
    if (fTela  && p.tela  !== fTela)  return false
    if (fColor && p.color !== fColor) return false
    if (fTalle && p.talle !== fTalle) return false
    if (fEst === 'zero'  && p.cantidad !== 0)                                  return false
    if (fEst === 'bajo'  && (p.cantidad === 0 || p.cantidad > config.stock_minimo)) return false
    if (fEst === 'ok'    && p.cantidad <= config.stock_minimo)                 return false
    if (fEst === 'clavo' && !isClavo(p, config))                               return false
    return true
  }), [products, search, fTipo, fTela, fColor, fTalle, fEst, config])

  const clearFilters = () => { setSearch(''); setFTipo(''); setFTela(''); setFColor(''); setFTalle(''); setFEst('') }
  const hasFilter = search || fTipo || fTela || fColor || fTalle || fEst

  // Edición inline — guardar
  const startEdit = (p, field) => { setEditCell({ id: p.id, field }); setEditVal(String(p[field] ?? '')) }
  const cancelEdit = () => setEditCell(null)

  const saveEdit = async () => {
    if (!editCell) return
    const { id, field } = editCell
    let value
    if (field === 'cantidad') {
      value = parseInt(editVal)
      if (isNaN(value) || value < 0) { cancelEdit(); return }
    } else if (field === 'precio') {
      value = parseFloat(editVal)
      if (isNaN(value) || value < 0) { cancelEdit(); return }
    } else {
      value = editVal
    }
    setSaving(true)
    try {
      const updated = await updateProducto(id, { [field]: value })
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      showToast(`✓ ${field === 'cantidad' ? 'Cantidad' : field === 'precio' ? 'Precio' : 'Ubicación'} actualizado`)
    } catch (e) {
      showToast(`⚠ Error: ${e.message}`)
    }
    setSaving(false)
    setEditCell(null)
  }

  const isEditing = (id, field) => editCell?.id === id && editCell?.field === field

  // Eliminar
  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await deleteProducto(confirmDel.id)
      setProducts(prev => prev.filter(p => p.id !== confirmDel.id))
      showToast('✓ Producto eliminado')
    } catch (e) {
      showToast(`⚠ Error: ${e.message}`)
    }
    setDeleting(false)
    setConfirmDel(null)
  }

  // Celdas editables
  const EditNum = ({ p, field, fmt, color }) => {
    if (isEditing(p.id, field)) return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Inp
          type="number" min="0" value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
          style={{ width: field === 'precio' ? 85 : 58, fontSize: 12, padding: '4px 6px' }}
          autoFocus
        />
        <Btn sm onClick={saveEdit} disabled={saving}>OK</Btn>
        <Btn sm variant="secondary" onClick={cancelEdit}>×</Btn>
      </div>
    )
    return (
      <span
        onClick={() => startEdit(p, field)}
        style={{ cursor: 'pointer', fontWeight: 600, color: color ?? T.text, borderBottom: `1px dashed ${T.border}`, whiteSpace: 'nowrap' }}
        title="Click para editar"
      >
        {fmt ? fmt(p[field]) : p[field]}
      </span>
    )
  }

  const EditUbic = ({ p }) => {
    if (isEditing(p.id, 'ubicacion')) return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Sel
          value={editVal} onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && cancelEdit()}
          style={{ fontSize: 11, padding: '4px 6px', width: 140 }}
          autoFocus
        >
          <option value="">— Sin asignar —</option>
          {config.ubicaciones?.map(u => <option key={u.id ?? u.nombre} value={u.nombre}>{u.nombre}</option>)}
        </Sel>
        <Btn sm onClick={saveEdit} disabled={saving}>OK</Btn>
        <Btn sm variant="secondary" onClick={cancelEdit}>×</Btn>
      </div>
    )
    return (
      <span
        onClick={() => startEdit(p, 'ubicacion')}
        style={{ cursor: 'pointer', fontSize: 12, color: T.muted, borderBottom: `1px dashed ${T.border}`, whiteSpace: 'nowrap' }}
        title="Click para editar ubicación"
      >
        {p.ubicacion ?? <span style={{ color: T.light, fontStyle: 'italic' }}>Sin asignar</span>}
      </span>
    )
  }

  const th = { fontSize: 10, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: .4, padding: '8px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, background: '#F8FAFC', whiteSpace: 'nowrap' }
  const td = { fontSize: 12, padding: '8px 8px', borderBottom: `0.5px solid ${T.border}`, color: T.text, verticalAlign: 'middle' }

  return (
    <div style={{ padding: '1.5rem', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Inventario</h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0' }}>
            {filtered.length} / {products.length} productos · {filtered.reduce((a, p) => a + p.cantidad, 0).toLocaleString('es-AR')} unidades
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.light }}>
            <span style={{ borderBottom: `1px dashed ${T.border}`, paddingBottom: 1 }}>subrayado</span> = editable
          </span>
          <Btn onClick={() => exportCSV(filtered)} variant="secondary" sm>Exportar CSV</Btn>
        </div>
      </div>

      {toast && <Alert type={toast.startsWith('✓') ? 'success' : 'warning'} style={{ marginBottom: '1rem' }}>{toast}</Alert>}

      {/* Filtros */}
      <Crd style={{ marginBottom: '1rem', padding: '.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Inp placeholder="Buscar SKU, tipo, tela..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <Sel value={fTipo}  onChange={e => setFTipo(e.target.value)}  style={{ width: 130 }}><option value="">Todos los tipos</option>{tipos.map(t  => <option key={t}>{t}</option>)}</Sel>
          <Sel value={fTela}  onChange={e => setFTela(e.target.value)}  style={{ width: 120 }}><option value="">Todas las telas</option>{telas.map(t  => <option key={t}>{t}</option>)}</Sel>
          <Sel value={fColor} onChange={e => setFColor(e.target.value)} style={{ width: 115 }}><option value="">Todos los colores</option>{colores.map(c => <option key={c}>{c}</option>)}</Sel>
          <Sel value={fTalle} onChange={e => setFTalle(e.target.value)} style={{ width: 110 }}><option value="">Todos los talles</option>{talles.map(t  => <option key={t}>{t}</option>)}</Sel>
          <Sel value={fEst}   onChange={e => setFEst(e.target.value)}   style={{ width: 135 }}>
            <option value="">Todos los estados</option>
            <option value="zero">Sin stock</option>
            <option value="bajo">Stock bajo</option>
            <option value="ok">Stock OK</option>
            <option value="clavo">Clavos</option>
          </Sel>
          {hasFilter && <Btn variant="ghost" sm onClick={clearFilters}>× Limpiar</Btn>}
        </div>
      </Crd>

      {/* Tabla */}
      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={28} /></div>
        : (
          <div style={{ background: T.card, borderRadius: T.radius, border: `0.5px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                <thead>
                  <tr>
                    {['SKU', 'Tipo', 'Tela', 'Color', 'Talle', 'Est.', 'Cantidad', 'Precio', 'Ubicación', 'Última Venta', 'Estado', ''].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} style={{ ...td, textAlign: 'center', padding: '2.5rem', color: T.muted }}>
                      Sin resultados para los filtros aplicados
                    </td></tr>
                  )}
                  {filtered.map(p => {
                    const st  = getStatus(p, config)
                    const clv = isClavo(p, config)
                    const rb  = p.cantidad === 0 ? '#FFF5F5' : p.cantidad <= config.stock_minimo ? '#FFFFF0' : clv ? '#FAF5FF' : 'transparent'
                    return (
                      <tr key={p.id} style={{ background: rb }}>
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>{p.sku ?? '—'}</td>
                        <td style={td}>{p.tipo}</td>
                        <td style={{ ...td, color: T.muted }}>{p.tela}</td>
                        <td style={td}>{p.color}</td>
                        <td style={td}>{p.talle}</td>
                        <td style={td}>{p.estampa ? <Bdg type="info">Sí</Bdg> : <span style={{ color: T.light, fontSize: 11 }}>No</span>}</td>
                        <td style={td}>
                          <EditNum p={p} field="cantidad" color={p.cantidad === 0 ? T.danger : p.cantidad <= config.stock_minimo ? T.warning : T.success} />
                        </td>
                        <td style={td}><EditNum p={p} field="precio" fmt={fmtPeso} /></td>
                        <td style={td}><EditUbic p={p} /></td>
                        <td style={{ ...td, fontSize: 11, color: T.muted }}>
                          {p.ultima_venta ?? <span style={{ color: T.danger }}>Nunca</span>}
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            <Bdg type={st.type}>{st.label}</Bdg>
                            {clv && <Bdg type="clavo">Clavo</Bdg>}
                          </div>
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Btn sm variant="secondary" onClick={() => setQrProduct(p)}>QR</Btn>
                            {role === 'admin' && (
                              <Btn sm variant="danger" onClick={() => setConfirmDel(p)}>×</Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* QR Modal */}
      {qrProduct && <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />}

      {/* Confirm delete */}
      {confirmDel && (
        <Mdl title="Confirmar eliminación" onClose={() => setConfirmDel(null)} width={400}>
          <p style={{ fontSize: 14, color: T.text, marginBottom: 16 }}>
            ¿Eliminar <strong>{confirmDel.tipo} {confirmDel.color} T:{confirmDel.talle}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Btn>
          </div>
        </Mdl>
      )}
    </div>
  )
}
