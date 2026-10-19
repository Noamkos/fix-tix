// A short scanner beep, made by the browser itself (no sound files): high for valid, low buzz for rejected.
export function beep(ok) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = ok ? 'sine' : 'square'
    osc.frequency.value = ok ? 1046 : 196
    gain.gain.value = ok ? 0.12 : 0.06
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.16 : 0.4))
    osc.onended = () => ctx.close()
  } catch {
    // No audio available: the screen color says it all.
  }
}
