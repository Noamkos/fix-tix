import { useId } from 'react'

// Generated artwork for each fictional event: no photos, so no copyright issues
// and the demo works offline. Each event picks a motif and three colors in seed.js.

// Small deterministic random generator, so a cover looks the same on every render.
function seeded(seed) {
  let x = seed
  return () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}

function Sun({ a, b, c, uid }) {
  return (
    <>
      <defs>
        <clipPath id={`sun-${uid}`}>
          <circle cx="200" cy="150" r="80" />
        </clipPath>
      </defs>
      <circle cx="200" cy="150" r="80" fill="#FFE2A0" opacity="0.95" />
      <g clipPath={`url(#sun-${uid})`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="110" y={138 + i * 13} width="180" height={3 + i * 2.2} fill={b} />
        ))}
      </g>
      <rect x="0" y="176" width="400" height="74" fill={c} opacity="0.6" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={168 - i * 18} y={188 + i * 13} width={64 + i * 36} height="3" rx="1.5" fill="#FFE2A0" opacity={0.55 - i * 0.1} />
      ))}
      <path d="M0 176 L60 150 L105 168 L150 140 L200 176 Z" fill={c} opacity="0.35" />
      <path d="M240 176 L300 146 L340 162 L400 136 L400 176 Z" fill={c} opacity="0.45" />
    </>
  )
}

function Waves({ a, b, c }) {
  return (
    <>
      <circle cx="300" cy="72" r="36" fill="#fff" opacity="0.9" />
      <circle cx="300" cy="72" r="58" fill="#fff" opacity="0.12" />
      <path d="M0 150 C60 128 120 172 200 150 S340 128 400 150 V250 H0Z" fill={a} opacity="0.5" />
      <path d="M0 180 C70 160 130 200 210 180 S350 162 400 182 V250 H0Z" fill={b} opacity="0.75" />
      <path d="M0 208 C80 192 140 226 220 208 S360 194 400 210 V250 H0Z" fill={c} opacity="0.9" />
    </>
  )
}

function Lights({ c }) {
  const beams = [
    { x: 70, dx: 60 },
    { x: 145, dx: 15 },
    { x: 200, dx: -10 },
    { x: 255, dx: -20 },
    { x: 330, dx: -65 },
  ]
  return (
    <>
      {beams.map(({ x, dx }, i) => (
        <polygon key={i} points={`${x - 4},-5 ${x + 4},-5 ${x + dx + 48},250 ${x + dx - 48},250`} fill="#fff" opacity="0.12" />
      ))}
      {beams.map(({ x }, i) => (
        <circle key={i} cx={x} cy="0" r="16" fill="#fff" opacity="0.55" />
      ))}
      <rect x="0" y="196" width="400" height="54" fill={c} opacity="0.55" />
    </>
  )
}

function Grid({ a, c, uid }) {
  return (
    <>
      <defs>
        <clipPath id={`sky-${uid}`}>
          <rect x="0" y="0" width="400" height="120" />
        </clipPath>
      </defs>
      <circle cx="200" cy="120" r="64" fill={a} opacity="0.9" clipPath={`url(#sky-${uid})`} />
      <rect x="0" y="120" width="400" height="130" fill={c} opacity="0.88" />
      <g stroke={a} strokeOpacity="0.55" strokeWidth="1.5">
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1="200" y1="120" x2={200 + (i - 10) * 70} y2="250" />
        ))}
        {[126, 134, 146, 162, 184, 212, 248].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </g>
    </>
  )
}

function Court({ a, c }) {
  return (
    <>
      <g stroke="#fff" strokeOpacity="0.45" strokeWidth="3" fill="none">
        <line x1="200" y1="0" x2="200" y2="250" />
        <circle cx="200" cy="125" r="44" />
        <path d="M0 62 H78 V188 H0" />
        <path d="M400 62 H322 V188 H400" />
        <path d="M0 12 Q190 125 0 238" />
        <path d="M400 12 Q210 125 400 238" />
      </g>
      <circle cx="292" cy="78" r="28" fill={a} />
      <g stroke={c} strokeWidth="2.2" fill="none" opacity="0.75">
        <path d="M264 78 H320" />
        <path d="M292 50 V106" />
        <path d="M274 58 Q294 78 274 98" />
        <path d="M310 58 Q290 78 310 98" />
      </g>
    </>
  )
}

function Mic({ c, uid }) {
  return (
    <>
      <defs>
        <pattern id={`brick-${uid}`} width="64" height="32" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="62" height="14" rx="1" fill="#000" opacity="0.14" />
          <rect x="-31" y="17" width="62" height="14" rx="1" fill="#000" opacity="0.14" />
          <rect x="33" y="17" width="62" height="14" rx="1" fill="#000" opacity="0.14" />
        </pattern>
      </defs>
      <rect width="400" height="250" fill={`url(#brick-${uid})`} />
      <polygon points="170,0 230,0 330,250 70,250" fill="#fff" opacity="0.14" />
      <ellipse cx="200" cy="230" rx="120" ry="16" fill="#fff" opacity="0.2" />
      <line x1="200" y1="122" x2="200" y2="228" stroke={c} strokeWidth="5" />
      <ellipse cx="200" cy="229" rx="30" ry="6" fill={c} />
      <rect x="185" y="74" width="30" height="52" rx="15" fill={c} />
      <g stroke="#fff" strokeOpacity="0.25" strokeWidth="2">
        <line x1="189" y1="88" x2="211" y2="88" />
        <line x1="187" y1="97" x2="213" y2="97" />
        <line x1="189" y1="106" x2="211" y2="106" />
      </g>
    </>
  )
}

function Strings({ a }) {
  const rnd = seeded(11)
  return (
    <>
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={rnd() * 400} cy={rnd() * 120} r={0.6 + rnd() * 1.6} fill="#fff" opacity={0.4 + rnd() * 0.5} />
      ))}
      <g fill="none" stroke={a} strokeWidth="2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse key={i} cx="200" cy="262" rx={70 + i * 46} ry={30 + i * 22} opacity={0.6 - i * 0.07} />
        ))}
      </g>
      <path d="M150 170 Q200 120 250 170" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" />
    </>
  )
}

function Circles({ a, c }) {
  const rnd = seeded(5)
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={rnd() * 400} cy={rnd() * 170} r={6 + rnd() * 26} fill={i % 3 ? '#fff' : a} opacity={0.08 + rnd() * 0.22} />
      ))}
      <path d="M0 182 C80 170 150 196 230 184 S360 172 400 180 V250 H0Z" fill={c} opacity="0.7" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={60 + i * 110} y={200 + i * 12} width={70} height="2.5" rx="1.25" fill={a} opacity="0.6" />
      ))}
    </>
  )
}

function Crowd() {
  const rnd = seeded(7)
  const heads = Array.from({ length: 24 }, (_, i) => ({ x: i * 18 - 6 + rnd() * 8, y: 236 + rnd() * 8, r: 10 + rnd() * 4 }))
  const hands = [38, 112, 176, 251, 318, 372]
  return (
    <g fill="#000" opacity="0.5">
      {hands.map((x, i) => (
        <rect key={x} x={x} y={190 + (i % 2) * 8} width="6" height="40" rx="3" transform={`rotate(${i % 2 ? 12 : -10} ${x} 230)`} />
      ))}
      {heads.map((h, i) => (
        <circle key={i} cx={h.x} cy={h.y} r={h.r} />
      ))}
      <rect x="0" y="242" width="400" height="8" />
    </g>
  )
}

const MOTIFS = { sun: Sun, waves: Waves, lights: Lights, grid: Grid, court: Court, mic: Mic, strings: Strings, circles: Circles }
const WITH_CROWD = new Set(['sun', 'lights', 'grid', 'circles'])

export function EventCover({ cover, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [a, b, c] = cover.colors
  const Motif = MOTIFS[cover.motif] ?? Circles

  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#bg-${uid})`} />
      <Motif a={a} b={b} c={c} uid={uid} />
      {WITH_CROWD.has(cover.motif) && <Crowd />}
    </svg>
  )
}
