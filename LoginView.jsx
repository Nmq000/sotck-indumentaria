import { useState, useEffect } from 'react'
import { Mdl, Btn, Bdg } from './ui.jsx'
import { T, fmtPeso } from '../theme.js'
import QRCode from 'qrcode'

export default function QRModal({ product, onClose }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(`STOCK:${product.id}:${product.sku}`, { width: 220, margin: 2 })
      .then(setQrUrl)
      .catch(console.error)
  }, [product.id])

  const print = () => {
    if (!qrUrl) return
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>QR ${product.sku}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:24px;max-width:300px;margin:0 auto">
        <h3 style="margin:0 0 4px;font-size:16px">${product.tipo} ${product.color} T:${product.talle}</h3>
        <p style="color:#666;font-size:14px;font-family:monospace;letter-spacing:3px;margin:0 0 4px">${product.sku}</p>
        <p style="color:#999;font-size:12px;margin:0 0 12px">${product.tela}${product.estampa ? ' · Con estampa' : ''}</p>
        <img src="${qrUrl}" style="width:200px;border:1px solid #eee;padding:8px;border-radius:4px"/>
        <p style="font-size:12px;color:#666;margin:10px 0 0">
          ${fmtPeso(product.precio)} · ${product.cantidad} unidades
        </p>
        <p style="font-size:11px;color:#999;margin:4px 0 0">${product.ubicacion ?? ''}</p>
      </body></html>
    `)
    w.print()
  }

  return (
    <Mdl title={`QR — ${product.tipo} ${product.color} T:${product.talle}`} onClose={onClose} width={380}>
      <div style={{ textAlign: 'center' }}>
        {qrUrl
          ? <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8 }} />
          : <div style={{ width: 200, height: 200, background: T.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: T.muted, fontSize: 12 }}>Generando...</div>
        }

        <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'monospace', letterSpacing: 4, fontWeight: 700, color: T.text }}>
          {product.sku}
        </div>

        <div style={{ marginTop: 8, display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Bdg type="gray">{product.tipo}</Bdg>
          <Bdg type="gray">{product.tela}</Bdg>
          <Bdg type="gray">{product.color}</Bdg>
          <Bdg type="gray">T: {product.talle}</Bdg>
          <Bdg type={product.estampa ? 'info' : 'gray'}>{product.estampa ? 'Con estampa' : 'Sin estampa'}</Bdg>
        </div>

        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: T.text }}>
          {fmtPeso(product.precio)} · {product.cantidad} uds
        </div>
        {product.ubicacion && (
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{product.ubicacion}</div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Btn onClick={print} disabled={!qrUrl}>Imprimir QR</Btn>
          <Btn variant="secondary" onClick={onClose}>Cerrar</Btn>
        </div>

        <p style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>
          Escaneá este código para cargar el producto instantáneamente.
        </p>
      </div>
    </Mdl>
  )
}
