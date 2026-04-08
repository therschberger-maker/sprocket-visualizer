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

function n(v: number): string { return v.toFixed(3) }

/**
 * Generate a sprocket profile matching McMaster-Carr 2D drawings:
 * - Deep U-shaped roller pockets
 * - Wide teeth with slightly tapered sides and rounded tips
 * - Short tooth height relative to body
 */
function generateSprocketProfile(N: number, outerRadius: number): string {
  const step = (2 * Math.PI) / N

  // Proportions matched to McMaster drawings
  const toothHeight = outerRadius * 0.08
  const rootR = outerRadius - toothHeight            // bottom of roller pocket
  const rollerPocketR = step * rootR * 0.38           // roller pocket arc radius

  const parts: string[] = []

  for (let i = 0; i < N; i++) {
    const toothAngle = i * step          // center of tooth
    const valleyAngle = toothAngle + step / 2  // center of valley

    // Tooth profile points
    // The tooth is wide — occupies ~55% of the step
    const toothHalf = step * 0.275

    // Tooth tip: left and right edges at outer radius
    const tipL = toothAngle - toothHalf * 0.6
    const tipR = toothAngle + toothHalf * 0.6

    // Tooth base (where tooth meets the body): wider than the tip
    const baseL = toothAngle - toothHalf
    const baseR = toothAngle + toothHalf

    // Valley edges
    const valleyHalf = step * 0.225
    const valL = valleyAngle - valleyHalf
    const valR = valleyAngle + valleyHalf

    // Points
    const baseLx = Math.cos(baseL) * (rootR + toothHeight * 0.15)
    const baseLy = Math.sin(baseL) * (rootR + toothHeight * 0.15)
    const tipLx = Math.cos(tipL) * outerRadius
    const tipLy = Math.sin(tipL) * outerRadius
    const tipRx = Math.cos(tipR) * outerRadius
    const tipRy = Math.sin(tipR) * outerRadius
    const baseRx = Math.cos(baseR) * (rootR + toothHeight * 0.15)
    const baseRy = Math.sin(baseR) * (rootR + toothHeight * 0.15)

    // Valley (roller pocket) arc endpoints
    const valRx = Math.cos(valL) * rootR
    const valRy = Math.sin(valL) * rootR
    const valLx = Math.cos(valR) * rootR
    const valLy = Math.sin(valR) * rootR

    if (i === 0) {
      parts.push(`M ${n(baseLx)} ${n(baseLy)}`)
    }

    // Left flank: base to tip (straight line with slight taper)
    parts.push(`L ${n(tipLx)} ${n(tipLy)}`)

    // Tooth tip: arc across the top (rounded)
    const tipArcR = outerRadius * step * 0.3
    parts.push(`A ${n(tipArcR)} ${n(tipArcR)} 0 0 1 ${n(tipRx)} ${n(tipRy)}`)

    // Right flank: tip back down to base
    parts.push(`L ${n(baseRx)} ${n(baseRy)}`)

    // Transition to valley
    parts.push(`L ${n(valRx)} ${n(valRy)}`)

    // Roller pocket: deep U-shaped arc
    parts.push(`A ${n(rollerPocketR)} ${n(rollerPocketR)} 0 0 1 ${n(valLx)} ${n(valLy)}`)

    // Transition to next tooth base
    const nextToothAngle = (i + 1) * step
    const nextBaseL = nextToothAngle - toothHalf
    const nextBaseLx = Math.cos(nextBaseL) * (rootR + toothHeight * 0.15)
    const nextBaseLy = Math.sin(nextBaseL) * (rootR + toothHeight * 0.15)
    parts.push(`L ${n(nextBaseLx)} ${n(nextBaseLy)}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Chain wraps at pitch circle (~92% of outer radius) */
export function pitchCircleRatio(numTeeth: number): number {
  return 0.92
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const profile = useMemo(() => generateSprocketProfile(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.10
  const hubRadius = outerRadius * 0.22
  const bodyRadius = outerRadius * 0.88
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

          {/* Body disc */}
          <circle r={bodyRadius} fill="#727278" stroke="none" />

          {/* Tooth profile */}
          <path
            d={profile}
            fill="#8a8a90"
            stroke="#9a9aa0"
            strokeWidth={0.4}
            strokeLinejoin="round"
          />

          {/* Chamfer ring — subtle edge between teeth and body */}
          <circle r={bodyRadius} fill="none" stroke="#62626a" strokeWidth={0.8} />

          {/* Hub raised area */}
          <circle r={hubRadius} fill="#7e7e84" stroke="#6a6a72" strokeWidth={1} />

          {/* Bore */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#4e4e56" strokeWidth={0.8} />

          {/* Keyway */}
          <rect
            x={-boreRadius * 0.4}
            y={-boreRadius - 0.3}
            width={boreRadius * 0.8}
            height={boreRadius * 0.45}
            fill="#1a1a2e"
          />

          {/* Set screw hole on hub */}
          <circle
            cx={hubRadius * 0.65}
            cy={-hubRadius * 0.1}
            r={boreRadius * 0.18}
            fill="#5a5a62"
            stroke="#4e4e56"
            strokeWidth={0.3}
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
