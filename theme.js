import { useState } from 'react'
import { T } from '../theme.js'
import { Inp, Lbl, Btn, Alert } from '../components/ui.jsx'
import { signIn } from '../lib/supabase.js'

export default function LoginView() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Completá email y contraseña.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : err.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.sidebar,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.font, padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: T.accent, borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, color: '#0D1B2A', margin: '0 auto 12px',
          }}>SI</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>
            Stock Indumentaria
          </h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, margin: '6px 0 0' }}>
            Sistema de gestión de inventario
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: T.radiusLg, padding: '1.5rem',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 12 }}>
              <Lbl><span style={{ color: 'rgba(255,255,255,.5)' }}>Email</span></Lbl>
              <Inp
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Lbl><span style={{ color: 'rgba(255,255,255,.5)' }}>Contraseña</span></Lbl>
              <Inp
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
              />
            </div>

            {error && (
              <Alert type="danger" style={{ marginBottom: 14, fontSize: 12 }}>
                {error}
              </Alert>
            )}

            <Btn
              type="submit"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', fontWeight: 700, fontSize: 14, padding: '10px 0' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  )
}
