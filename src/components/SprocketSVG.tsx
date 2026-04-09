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
  toothHeight?: number  // fixed SVG tooth height — same for both sprockets
}

// Normalized tooth profile extracted from McMaster-Carr 6793K7 engineering drawing (15T sprocket).
// One tooth cycle: a=0..1 maps to one angular step (valley to valley).
// r=0 is the inner radius (base), r=1 is the outer radius (tooth tip).
// Values below 0 represent the roller pocket dip.
const TOOTH_PROFILE = [
  { a: 0.000, r: 0.96 },   // tooth tip center
  { a: 0.050, r: 0.96 },   // tip plateau edge
  { a: 0.100, r: 0.86 },   // start descending flank
  { a: 0.150, r: 0.70 },   // mid flank
  { a: 0.200, r: 0.42 },   // steep descent
  { a: 0.250, r: 0.22 },   // lower flank
  { a: 0.310, r: 0.07 },   // approaching valley
  { a: 0.375, r: 0.00 },   // valley floor
  { a: 0.420, r: -0.03 },  // roller pocket dip
  { a: 0.480, r: -0.04 },  // deepest point
  { a: 0.500, r: -0.04 },  // valley center
  { a: 0.520, r: -0.04 },  // rising from pocket
  { a: 0.580, r: -0.01 },  // exiting pocket
  { a: 0.625, r: 0.04 },   // valley floor rising
  { a: 0.690, r: 0.14 },   // lower ascending flank
  { a: 0.750, r: 0.36 },   // mid flank
  { a: 0.800, r: 0.57 },   // steep ascent
  { a: 0.850, r: 0.78 },   // upper flank
  { a: 0.900, r: 0.92 },   // approaching tip
  { a: 0.950, r: 0.95 },   // tip plateau edge
  { a: 1.000, r: 0.95 },   // next tooth tip
]

function n(v: number): string { return v.toFixed(3) }

/**
 * Generate sprocket profile using the real McMaster-Carr tooth shape.
 * toothHeight is a FIXED size in SVG units — the same for both sprockets,
 * because both mesh with the same chain. A bigger sprocket just has more
 * identical teeth arrayed around a larger circle.
 */
function generateSprocketProfile(N: number, outerRadius: number, toothHeight: number): string {
  const step = (2 * Math.PI) / N
  const baseR = outerRadius - toothHeight   // inner radius (r=0 in profile)

  const parts: string[] = []
  let first = true

  for (let tooth = 0; tooth < N; tooth++) {
    const toothStartAngle = tooth * step

    for (let i = 0; i < TOOTH_PROFILE.length; i++) {
      const pt = TOOTH_PROFILE[i]
      const angle = toothStartAngle + pt.a * step
      const radius = baseR + pt.r * toothHeight

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      if (first) {
        parts.push(`M ${n(x)} ${n(y)}`)
        first = false
      } else {
        parts.push(`L ${n(x)} ${n(y)}`)
      }
    }
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Chain wraps at pitch circle */
export function pitchCircleRatio(numTeeth: number): number {
  return 0.88
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw', toothHeight: toothHeightProp }: SprocketSVGProps) {
  const th = toothHeightProp ?? outerRadius * 0.194
  const profile = useMemo(() => generateSprocketProfile(numTeeth, outerRadius, th), [numTeeth, outerRadius, th])

  const boreRadius = outerRadius * 0.08
  const hubRadius = outerRadius * 0.18
  const bodyRadius = outerRadius * 0.80
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0

  // Unique animation name per sprocket instance (sanitize decimals for CSS)
  const animId = useMemo(() => `spin-${Math.round(cx)}-${Math.round(cy)}`, [cx, cy])

  return (
    <g>
      {/* Inject keyframes for GPU-accelerated CSS rotation */}
      {duration > 0 && (
        <style>{`
          @keyframes ${animId} {
            from { transform: rotate(0deg); }
            to   { transform: rotate(${direction === 'ccw' ? '-' : ''}360deg); }
          }
        `}</style>
      )}

      {/* Outer group: positions the sprocket */}
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Inner group: handles rotation via CSS (GPU-composited) */}
        <g style={duration > 0 ? {
          animation: `${animId} ${duration}s linear infinite`,
          transformOrigin: '0 0',
          willChange: 'transform',
        } as React.CSSProperties : undefined}>

          {/* Tooth profile */}
          <path
            d={profile}
            fill="#a0a0a6"
            stroke="#b0b0b6"
            strokeWidth={0.3}
            strokeLinejoin="round"
            shapeRendering="geometricPrecision"
          />

          {/* Inner body disc */}
          <circle r={bodyRadius} fill="#8a8a90" stroke="none" />

          {/* Hub */}
          <circle r={hubRadius} fill="#929298" stroke="#7a7a82" strokeWidth={0.8} />

          {/* Bore */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#6a6a72" strokeWidth={0.6} />

          {/* Keyway */}
          <rect
            x={-boreRadius * 0.4}
            y={-boreRadius - 0.3}
            width={boreRadius * 0.8}
            height={boreRadius * 0.4}
            fill="#1a1a2e"
          />
        </g>
      </g>
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
