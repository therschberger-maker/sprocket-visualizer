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

// Normalized tooth profile extracted from McMaster-Carr 6793K7 engineering drawing (15T sprocket).
// One tooth cycle: a=0..1 maps to one angular step (valley to valley).
// r=0 is the inner radius (base), r=1 is the outer radius (tooth tip).
// Values below 0 represent the roller pocket dip.
const TOOTH_PROFILE = [
  { a: 0.000, r: 0.96 },   // valley edge (high side)
  { a: 0.042, r: 0.96 },
  { a: 0.063, r: 0.96 },
  { a: 0.083, r: 0.89 },   // start dropping into flank
  { a: 0.104, r: 0.86 },
  { a: 0.125, r: 0.77 },
  { a: 0.146, r: 0.73 },
  { a: 0.167, r: 0.62 },
  { a: 0.188, r: 0.47 },   // steep flank descent
  { a: 0.208, r: 0.37 },
  { a: 0.229, r: 0.27 },
  { a: 0.250, r: 0.22 },
  { a: 0.271, r: 0.15 },
  { a: 0.292, r: 0.11 },
  { a: 0.313, r: 0.07 },
  { a: 0.333, r: 0.03 },
  { a: 0.354, r: 0.02 },
  { a: 0.375, r: 0.00 },   // approaching valley floor
  { a: 0.396, r: -0.01 },
  { a: 0.417, r: -0.02 },  // roller pocket (below base)
  { a: 0.438, r: -0.03 },
  { a: 0.458, r: -0.04 },
  { a: 0.479, r: -0.04 },  // deepest point
  { a: 0.500, r: -0.04 },  // valley center
  { a: 0.521, r: -0.03 },
  { a: 0.542, r: -0.03 },
  { a: 0.563, r: -0.01 },
  { a: 0.583, r: 0.00 },
  { a: 0.604, r: 0.01 },
  { a: 0.625, r: 0.04 },
  { a: 0.646, r: 0.05 },
  { a: 0.667, r: 0.09 },
  { a: 0.688, r: 0.14 },   // rising flank
  { a: 0.708, r: 0.16 },
  { a: 0.729, r: 0.26 },
  { a: 0.750, r: 0.36 },
  { a: 0.771, r: 0.46 },
  { a: 0.792, r: 0.57 },   // steep flank ascent
  { a: 0.813, r: 0.65 },
  { a: 0.833, r: 0.74 },
  { a: 0.854, r: 0.82 },
  { a: 0.875, r: 0.89 },
  { a: 0.896, r: 0.92 },
  { a: 0.917, r: 0.95 },   // approaching next tooth tip
  { a: 0.938, r: 0.95 },
  { a: 0.958, r: 0.95 },
  { a: 0.979, r: 0.95 },
  { a: 1.000, r: 0.95 },   // next valley edge
]

function n(v: number): string { return v.toFixed(3) }

/**
 * Interpolate the McMaster profile for a given tooth count.
 * Low tooth counts (<=15) use the exact extracted profile.
 * Higher tooth counts blend toward a smoother, wider-tipped version
 * so teeth maintain a good visual aspect ratio.
 */
function getAdaptedProfile(N: number): { a: number; r: number }[] {
  if (N <= 15) return TOOTH_PROFILE

  // For higher tooth counts, widen the tooth tip and soften the flanks.
  // The blend factor goes from 0 (at N=15) to 1 (at N>=50).
  const blend = Math.min(1, (N - 15) / 35)

  // The "wide" profile: wider flat tip, shallower valley, smoother flanks
  return TOOTH_PROFILE.map(pt => {
    let r = pt.r
    let a = pt.a

    // Compress the flanks inward (widen the tooth tip area)
    // Push profile points toward the tooth center (a ≈ 0 or 1) and valley center (a ≈ 0.5)
    if (a < 0.5) {
      // Left half: compress flank toward midpoints
      if (a > 0.08 && a < 0.375) {
        // Flank region: shift points left (toward tooth tip)
        const shift = blend * 0.04
        a = Math.max(0.08, a - shift)
      }
    } else {
      // Right half: mirror
      if (a > 0.625 && a < 0.92) {
        const shift = blend * 0.04
        a = Math.min(0.92, a + shift)
      }
    }

    // Raise the valley floor slightly (less deep for many teeth = less spiky look)
    if (r < 0.1) {
      r = r + blend * 0.08
    }
    // Flatten the tooth tip more (wider plateau)
    if (r > 0.9) {
      r = Math.min(1.0, r + blend * 0.03)
    }

    return { a, r }
  })
}

/**
 * Generate sprocket profile using the real McMaster-Carr tooth shape.
 * The normalized profile is adapted per tooth count and replicated N times.
 */
function generateSprocketProfile(N: number, outerRadius: number): string {
  const step = (2 * Math.PI) / N
  const toothHeight = outerRadius * 0.194  // from McMaster: 19.4% of OD
  const baseR = outerRadius - toothHeight   // inner radius (r=0 in profile)

  const adapted = getAdaptedProfile(N)
  const parts: string[] = []
  let first = true

  for (let tooth = 0; tooth < N; tooth++) {
    const toothStartAngle = tooth * step

    for (let i = 0; i < adapted.length; i++) {
      const pt = adapted[i]
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

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const profile = useMemo(() => generateSprocketProfile(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.08
  const hubRadius = outerRadius * 0.18
  const bodyRadius = outerRadius * 0.80
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const toAngle = direction === 'ccw' ? -360 : 360

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

          {/* Tooth profile */}
          <path
            d={profile}
            fill="#a0a0a6"
            stroke="#b0b0b6"
            strokeWidth={0.3}
            strokeLinejoin="round"
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
