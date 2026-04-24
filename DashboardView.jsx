import { T } from '../theme.js'

// ── Button ────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', sm, disabled, style = {}, type = 'button' }) {
  const base = {
    fontFamily: T.font, fontWeight: 500, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: T.radiusSm, transition: 'all .15s',
    opacity: disabled ? .5 : 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    ...(sm ? { fontSize: 11, padding: '3px 10px' } : { fontSize: 13, padding: '7px 16px' }),
    ...style,
  }
  const variants = {
    primary:   { background: T.accent,   color: '#0D1B2A' },
    secondary: { background: 'transparent', color: T.muted, border: `0.5px solid ${T.border}` },
    danger:    { background: T.danger,   color: '#fff' },
    ghost:     { background: 'transparent', color: T.accent },
    dark:      { background: T.text,     color: '#fff' },
  }
  return (
    <button type={type} style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Bdg({ children, type = 'success' }) {
  const map = {
    success: { bg: T.successBg, c: T.success, b: T.successBdr },
    warning: { bg: T.warningBg, c: T.warning, b: T.warningBdr },
    danger:  { bg: T.dangerBg,  c: T.danger,  b: T.dangerBdr  },
    clavo:   { bg: T.clavoBg,   c: T.clavo,   b: T.clavoBdr   },
    info:    { bg: T.infoBg,    c: T.info,     b: T.infoBdr    },
    gray:    { bg: '#F7FAFC',   c: T.muted,   b: T.border     },
  }
  const x = map[type] ?? map.gray
  return (
    <span style={{
      background: x.bg, color: x.c, border: `0.5px solid ${x.b}`,
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Crd({ children, style = {} }) {
  return (
    <div style={{
      background: T.card, borderRadius: T.radius,
      border: `0.5px solid ${T.border}`, boxShadow: T.shadow,
      padding: '1.1rem 1.25rem', ...style,
    }}>
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Mdl({ children, onClose, title, width = 480 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: T.radiusLg,
          width: '100%', maxWidth: width,
          boxShadow: T.shadowLg, overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: `0.5px solid ${T.border}`,
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: T.muted, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        <div style={{ padding: '1.25rem' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────
export function Lbl({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 500, color: T.muted, marginBottom: 3 }}>{children}</div>
}

// ── Input ─────────────────────────────────────────────────────
export function Inp({ style = {}, ...props }) {
  return (
    <input style={{
      fontFamily: T.font, fontSize: 13,
      padding: '7px 10px',
      border: `0.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      background: '#fff', color: T.text,
      outline: 'none', width: '100%',
      ...style,
    }} {...props} />
  )
}

// ── Select ────────────────────────────────────────────────────
export function Sel({ children, style = {}, ...props }) {
  return (
    <select style={{
      fontFamily: T.font, fontSize: 13,
      padding: '7px 10px',
      border: `0.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      background: '#fff', color: T.text,
      outline: 'none', width: '100%',
      ...style,
    }} {...props}>
      {children}
    </select>
  )
}

// ── Form row helpers ──────────────────────────────────────────
export function FRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>{children}</div>
}

export function FCol({ label, children }) {
  return <div><Lbl>{label}</Lbl>{children}</div>
}

// ── Alert banner ──────────────────────────────────────────────
export function Alert({ children, type = 'warning', style = {} }) {
  const map = {
    success: { bg: T.successBg, border: T.successBdr, color: T.success },
    warning: { bg: T.warningBg, border: T.warningBdr, color: T.warning },
    danger:  { bg: T.dangerBg,  border: T.dangerBdr,  color: T.danger  },
    info:    { bg: T.infoBg,    border: T.infoBdr,    color: T.info    },
  }
  const x = map[type] ?? map.warning
  return (
    <div style={{
      background: x.bg, border: `1px solid ${x.border}`,
      borderRadius: T.radiusSm, padding: '9px 12px',
      fontSize: 13, color: x.color, ...style,
    }}>
      {children}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20, color = T.accent }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${T.border}`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

// CSS global para el spinner
if (typeof document !== 'undefined' && !document.getElementById('ui-spinner-style')) {
  const s = document.createElement('style')
  s.id = 'ui-spinner-style'
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(s)
}
