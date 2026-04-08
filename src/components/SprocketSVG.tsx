'use client'

import { useMemo } from 'react'

interface SprocketSVGProps {
  numTeeth: number
  outerRadius: number
  rpm: number
  cx: number
  cy: number
  label: string
  direction?: 'cw' | 'ccw'
  chainPitchInches?: number
  chainSize?: string
}

// ANSI/ISO standard roller diameters (inches) by chain size
const ROLLER_DIAMETERS: Record<string, number> = {
  '25': 0.130, '35': 0.200, '40': 0.312, '50': 0.400,
  '60': 0.469, '80': 0.625, '100': 0.750, '120': 0.875,
  '140': 1.000, '160': 1.125,
  '04B': 0.157, '05B': 0.197, '06B': 0.250, '08B': 0.335,
  '10B': 0.400, '12B': 0.475, '16B': 0.625,
}

interface Pt { x: number; y: number }

function rot(p: Pt, a: number): Pt {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }
}

// Find the circle-circle intersection point farthest from origin
function outerIntersect(c1: Pt, r1: number, c2: Pt, r2: number): Pt {
  const dx = c2.x - c1.x, dy = c2.y - c1.y
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d === 0 || d > r1 + r2 + 0.001) {
    const angle = Math.atan2(c1.y + c2.y, c1.x + c2.x)
    const r = Math.max(Math.sqrt(c1.x ** 2 + c1.y ** 2), Math.sqrt(c2.x ** 2 + c2.y ** 2)) + r1
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) }
  }
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const ux = dx / d, uy = dy / d
  const px = c1.x + a * ux, py = c1.y + a * uy
  const p1: Pt = { x: px + h * uy, y: py - h * ux }
  const p2: Pt = { x: px - h * uy, y: py + h * ux }
  return (p1.x ** 2 + p1.y ** 2) > (p2.x ** 2 + p2.y ** 2) ? p1 : p2
}

function n3(v: number): string { return v.toFixed(3) }

/**
 * Generate ANSI B29.1 compliant sprocket tooth profile as SVG path.
 * All geometry computed from standard formulas, then scaled to SVG units.
 */
function generateANSIToothPath(N: number, P: number, Dr: number, svgScale: number): string {
  const deg = Math.PI / 180
  const step = 2 * Math.PI / N

  // ANSI B29.1 standard parameters
  const PD = P / Math.sin(Math.PI / N)
  const Ds = 1.0005 * Dr + 0.003
  const R = Ds / 2               // Seating curve radius
  const A = (35 + 60 / N) * deg  // Working curve center angle
  const B = (18 - 56 / N) * deg  // Topping offset angle
  const E = 1.3025 * Dr + 0.0015 // Working curve radius
  const F = Math.max(0.005, Dr * (0.8 * Math.cos(B) + 1.4 * Math.cos((17 - 64 / N) * deg) - 1.3025) - 0.0015) // Topping curve radius

  // Working curve center offsets from pitch point
  const Mx = 0.8 * Dr * Math.cos(A)
  const T = 0.8 * Dr * Math.sin(A)
  // Topping curve center offsets
  const W = 1.4 * Dr * Math.cos(Math.PI / N)
  const V = 1.4 * Dr * Math.sin(Math.PI / N)

  // Key points in local frame (valley 0 centered along +Y)
  // Point X: seating → working transition
  const dCS = Math.sqrt(Mx * Mx + T * T)
  const XR: Pt = { x: R * Mx / dCS, y: PD / 2 + R * T / dCS }
  // Point Y: working → topping transition
  const YR: Pt = { x: Mx - E * Math.cos(A - B), y: PD / 2 + T - E * Math.sin(A - B) }
  // Mirror points for left side
  const XL: Pt = { x: -XR.x, y: XR.y }
  const YL: Pt = { x: -YR.x, y: YR.y }
  // Valley bottom (closest point to center)
  const bottom: Pt = { x: 0, y: PD / 2 - R }
  // Topping arc centers
  const BR: Pt = { x: -W, y: PD / 2 - V }
  const BL: Pt = { x: W, y: PD / 2 - V }

  // Tooth tip: intersection of adjacent topping arcs
  const BL_next = rot(BL, step)
  const tip = outerIntersect(BR, F, BL_next, F)

  // Pre-scale arc radii
  const s = svgScale
  const Rs = R * s, Es = E * s, Fs = F * s

  const parts: string[] = []
  parts.push(`M ${n3(bottom.x * s)} ${n3(bottom.y * s)}`)

  for (let i = 0; i < N; i++) {
    const a = i * step, na = (i + 1) * step

    // Right half: valley bottom → tooth tip (3 arcs going outward)
    const xr = rot(XR, a), yr = rot(YR, a), t = rot(tip, a)
    parts.push(`A ${n3(Rs)} ${n3(Rs)} 0 0 1 ${n3(xr.x * s)} ${n3(xr.y * s)}`)  // Seating
    parts.push(`A ${n3(Es)} ${n3(Es)} 0 0 0 ${n3(yr.x * s)} ${n3(yr.y * s)}`)  // Working
    parts.push(`A ${n3(Fs)} ${n3(Fs)} 0 0 1 ${n3(t.x * s)} ${n3(t.y * s)}`)    // Topping

    // Left half: tooth tip → next valley bottom (3 arcs going inward, mirrored sweeps)
    const yl = rot(YL, na), xl = rot(XL, na), bn = rot(bottom, na)
    parts.push(`A ${n3(Fs)} ${n3(Fs)} 0 0 0 ${n3(yl.x * s)} ${n3(yl.y * s)}`)  // Topping
    parts.push(`A ${n3(Es)} ${n3(Es)} 0 0 1 ${n3(xl.x * s)} ${n3(xl.y * s)}`)  // Working
    parts.push(`A ${n3(Rs)} ${n3(Rs)} 0 0 0 ${n3(bn.x * s)} ${n3(bn.y * s)}`)  // Seating
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Ratio of pitch circle to outside diameter. Chain wraps at pitch circle. */
export function pitchCircleRatio(numTeeth: number): number {
  const a = Math.PI / numTeeth
  return 1 / (0.6 * Math.sin(a) + Math.cos(a))
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw', chainPitchInches, chainSize }: SprocketSVGProps) {
  const toothPath = useMemo(() => {
    const Dr = (chainSize && ROLLER_DIAMETERS[chainSize]) || (chainPitchInches ? chainPitchInches * 0.625 : 0)
    const P = chainPitchInches || 0
    if (!P || !Dr) return null
    const OD = P * (0.6 + 1 / Math.tan(Math.PI / numTeeth))
    const scale = outerRadius / (OD / 2)
    return generateANSIToothPath(numTeeth, P, Dr, scale)
  }, [numTeeth, outerRadius, chainPitchInches, chainSize])

  const boreRadius = outerRadius * 0.13
  const hubRadius = outerRadius * 0.28
  const rootRadius = outerRadius * 0.76  // root circle for body fill (inside tooth valleys)
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const toAngle = direction === 'ccw' ? -360 : 360

  // Lightening holes at asymmetric angles for visible rotation
  const holeAngles = numTeeth > 15 ? [20, 110, 200, 290] : []
  const holeDist = outerRadius * 0.55
  const holeR = outerRadius * 0.08

  return (
    <g>
      <g transform={`translate(${cx}, ${cy})`}>
        <g>
          {duration > 0 && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to={`${toAngle} 0 0`}
              dur={`${duration}s`}
              repeatCount="indefinite"
            />
          )}

          {/* Sprocket body disc (behind teeth, fills the root circle area) */}
          <circle r={rootRadius} fill="#48484e" stroke="none" />

          {/* ANSI tooth profile */}
          {toothPath ? (
            <path d={toothPath} fill="#5c5c62" stroke="#70707a" strokeWidth={0.6} />
          ) : (
            <circle r={outerRadius} fill="#5c5c62" stroke="#70707a" strokeWidth={0.6} />
          )}

          {/* Lightening holes */}
          {holeAngles.map((angle) => (
            <circle
              key={angle}
              cx={Math.cos((angle * Math.PI) / 180) * holeDist}
              cy={Math.sin((angle * Math.PI) / 180) * holeDist}
              r={holeR}
              fill="#1a1a2e"
              stroke="#42424a"
              strokeWidth={0.6}
            />
          ))}

          {/* Spokes for smaller sprockets */}
          {numTeeth <= 15 && [0, 72, 144, 216, 288].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * boreRadius * 1.5}
              y1={Math.sin((angle * Math.PI) / 180) * boreRadius * 1.5}
              x2={Math.cos((angle * Math.PI) / 180) * hubRadius * 0.9}
              y2={Math.sin((angle * Math.PI) / 180) * hubRadius * 0.9}
              stroke="#42424a"
              strokeWidth={2.5}
            />
          ))}

          {/* Hub ring */}
          <circle r={hubRadius} fill="none" stroke="#62626a" strokeWidth={1.2} />

          {/* Bore hole */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#52525a" strokeWidth={0.8} />

          {/* Keyway notch */}
          <rect
            x={-boreRadius * 0.35}
            y={-boreRadius - 0.5}
            width={boreRadius * 0.7}
            height={boreRadius * 0.5}
            fill="#1a1a2e"
          />

          {/* Set screw */}
          <circle
            cx={0}
            cy={-(hubRadius * 0.72)}
            r={boreRadius * 0.22}
            fill="#3a3a40"
            stroke="#52525a"
            strokeWidth={0.4}
          />
        </g>
      </g>
      {/* Label */}
      <text
        x={cx}
        y={cy + outerRadius + 22}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={13}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  )
}
