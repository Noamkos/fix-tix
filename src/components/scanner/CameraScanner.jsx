import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, CameraOff, Loader2 } from 'lucide-react'

// Reads QR codes from the computer's camera. Each frame is copied to a hidden canvas
// and handed to jsQR, a small library that finds and decodes QR codes in an image.
export function CameraScanner({ onCode, paused }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const frameRef = useRef(0)
  const lastRef = useRef({ code: null, at: 0 })
  const pausedRef = useRef(paused)
  const onCodeRef = useRef(onCode)
  const [state, setState] = useState('idle') // idle | starting | running | error
  const [error, setError] = useState('')

  useEffect(() => {
    pausedRef.current = paused
    onCodeRef.current = onCode
  }, [paused, onCode])

  function release() {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  // Stop the camera when leaving the screen.
  useEffect(() => release, [])

  function watch() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let lastDecode = 0
    const tick = (now) => {
      const video = videoRef.current
      if (video && video.readyState >= 2 && !pausedRef.current && now - lastDecode > 150) {
        lastDecode = now
        const scale = Math.min(1, 640 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const found = jsQR(image.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })
        // The same code in front of the camera only counts again after 3 seconds.
        if (found?.data && (found.data !== lastRef.current.code || Date.now() - lastRef.current.at > 3000)) {
          lastRef.current = { code: found.data, at: Date.now() }
          onCodeRef.current(found.data)
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error')
      setError("This browser can't open a camera here.")
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setState('running')
      watch()
    } catch (e) {
      release()
      setState('error')
      setError(e?.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'No camera was found on this device.')
    }
  }

  function stop() {
    release()
    setState('idle')
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-console-line bg-black">
        <video ref={videoRef} muted playsInline className={`size-full object-cover ${state === 'running' ? '' : 'hidden'}`} />

        {state === 'running' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-[58%] max-w-[300px] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-emerald-400" />
            </div>
          </div>
        )}

        {state !== 'running' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              {state === 'error' ? <CameraOff className="mx-auto size-10 text-red-300" /> : <Camera className="mx-auto size-10 text-console-muted" />}
              <p className="mt-3 text-console-text">
                {state === 'error' ? error : 'Hold the QR code from My tickets up to the camera.'}
              </p>
              {state === 'error' && <p className="mt-1 text-sm text-console-muted">Use "Pick a ticket" instead.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-center">
        {state === 'running' ? (
          <button type="button" onClick={stop} className="btn border border-console-line px-4 py-2.5 text-sm text-console-text hover:bg-white/5">
            Stop camera
          </button>
        ) : (
          <button type="button" onClick={start} disabled={state === 'starting'} className="btn bg-dtx px-5 py-2.5 text-sm text-white hover:bg-dtx-600">
            {state === 'starting' ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {state === 'error' ? 'Try again' : 'Start camera'}
          </button>
        )}
      </div>
    </div>
  )
}
