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
 * Generate sprocket profile matching McMaster-Carr engineering drawings.
 *
 * Key visual features from reference:
 * - Teeth are tall and triangular with slightly rounded tips
 * - Valleys are deep, wide, semicircular (roller seats)
 * - Valleys are wider than the teeth
 * - Smooth curved flanks connecting tooth tips to valley bottoms
 */
function generateSprocketProfile(N: number, outerRadius: number): string {
  const step = (2 * Math.PI) / N

  // Proportions calibrated from McMaster drawings
  // Use a consistent tooth-to-gap proportion regardless of tooth count
  const toothHeight = outerRadius * 0.14
  const rootR = outerRadius - toothHeight       // valley floor radius
  const rollerR = step * rootR * 0.40           // roller pocket arc radius

  const parts: string[] = []

  for (let i = 0; i < N; i++) {
    const toothAngle = i * step
    const valleyAngle = toothAngle + step / 2

    // Tooth is narrow — tip spans ~30% of the step
    const tipHalf = step * 0.15

    // Valley is wide — spans ~70% of the step
    const valHalf = step * 0.30

    // Tooth tip points (at outer radius, narrow)
    const tipLa = toothAngle - tipHalf
    const tipRa = toothAngle + tipHalf
    const tipLx = Math.cos(tipLa) * outerRadius
    const tipLy = Math.sin(tipLa) * outerRadius
    const tipRx = Math.cos(tipRa) * outerRadius
    const tipRy = Math.sin(tipRa) * outerRadius

    // Valley endpoints (at root radius, wide)
    const valLa = valleyAngle - valHalf
    const valRa = valleyAngle + valHalf
    const valLx = Math.cos(valRa) * rootR   // note: right angle of valley = left side going CW
    const valLy = Math.sin(valRa) * rootR
    const valRx = Math.cos(valLa) * rootR
    const valRy = Math.sin(valLa) * rootR

    if (i === 0) {
      parts.push(`M ${n(tipLx)} ${n(tipLy)}`)
    }

    // Tooth tip: small arc (rounded tip)
    const tipArcR = outerRadius * 0.6
    parts.push(`A ${n(tipArcR)} ${n(tipArcR)} 0 0 1 ${n(tipRx)} ${n(tipRy)}`)

    // Right flank: smooth curve down from tooth tip to valley edge
    // Use cubic bezier for smooth S-curve flank
    const flankMidR = (outerRadius + rootR) / 2
    const flankRa1 = tipRa + step * 0.05
    const flankRa2 = valLa - step * 0.05  // valLa is actually on the right going CW
    const cp1x = Math.cos(flankRa1) * (outerRadius * 0.96)
    const cp1y = Math.sin(flankRa1) * (outerRadius * 0.96)
    const cp2x = Math.cos(flankRa2) * (rootR * 1.02)
    const cp2y = Math.sin(flankRa2) * (rootR * 1.02)
    // Use the correct valley endpoint
    const vRx = Math.cos(valLa) * rootR
    const vRy = Math.sin(valLa) * rootR
    parts.push(`C ${n(cp1x)} ${n(cp1y)} ${n(cp2x)} ${n(cp2y)} ${n(vRx)} ${n(vRy)}`)

    // Valley: semicircular roller pocket arc
    const vLx = Math.cos(valRa) * rootR
    const vLy = Math.sin(valRa) * rootR
    parts.push(`A ${n(rollerR)} ${n(rollerR)} 0 0 1 ${n(vLx)} ${n(vLy)}`)

    // Left flank of next tooth: smooth curve up from valley to next tooth tip
    const nextToothAngle = (i + 1) * step
    const nextTipLa = nextToothAngle - tipHalf
    const ntLx = Math.cos(nextTipLa) * outerRadius
    const ntLy = Math.sin(nextTipLa) * outerRadius

    const flankLa1 = valRa + step * 0.05
    const flankLa2 = nextTipLa - step * 0.05
    const cp3x = Math.cos(flankLa1) * (rootR * 1.02)
    const cp3y = Math.sin(flankLa1) * (rootR * 1.02)
    const cp4x = Math.cos(flankLa2) * (outerRadius * 0.96)
    const cp4y = Math.sin(flankLa2) * (outerRadius * 0.96)
    parts.push(`C ${n(cp3x)} ${n(cp3y)} ${n(cp4x)} ${n(cp4y)} ${n(ntLx)} ${n(ntLy)}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Chain wraps at pitch circle */
export function pitchCircleRatio(numTeeth: number): number {
  return 0.90
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const profile = useMemo(() => generateSprocketProfile(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.08
  const hubRadius = outerRadius * 0.18
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

          {/* Tooth profile — single shape */}
          <path
            d={profile}
            fill="#a0a0a6"
            stroke="#b8b8be"
            strokeWidth={0.4}
            strokeLinejoin="round"
          />

          {/* Inner body disc — darker to create depth */}
          <circle r={outerRadius * 0.82} fill="#8a8a90" stroke="none" />

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
