import { useMemo } from 'react'
import QRCode from 'qrcode'

// A QR code drawn as crisp SVG squares. It encodes the ticket's barcode,
// which is exactly what the gate scanner reads back.
export function QrCode({ value, className = 'size-48', title = 'Ticket QR code' }) {
  const { size, path } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' })
    const { size: n, data } = qr.modules
    let d = ''
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (data[y * n + x]) d += `M${x} ${y}h1v1h-1z`
      }
    }
    return { size: n, path: d }
  }, [value])

  // 4 modules of white "quiet zone" around the code, so scanners find it easily.
  return (
    <svg viewBox={`-4 -4 ${size + 8} ${size + 8}`} shapeRendering="crispEdges" className={className} role="img" aria-label={title}>
      <rect x="-4" y="-4" width={size + 8} height={size + 8} fill="#fff" />
      <path d={path} fill="#0f0a0c" />
    </svg>
  )
}
