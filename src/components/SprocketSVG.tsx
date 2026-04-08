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

function n(v: number): string { return v.toFixed(2) }

/**
 * Generate a sprocket profile that looks like the real thing:
 * - Semicircular roller pockets (the deep rounded valleys)
 * - Wide, rounded teeth with flat-ish tops
 * - Proportions that read as "chain sprocket" at any scale
 */
function generateSprocketProfile(N: number, outerRadius: number): string {
  const step = (2 * Math.PI) / N

  // Proportions tuned to look like real chain sprockets
  const toothHeight = outerRadius * 0.10         // teeth are relatively short
  const pitchR = outerRadius - toothHeight * 0.5  // pitch circle ~midway
  const rootR = outerRadius - toothHeight          // bottom of valleys
  const rollerR = step * rootR * 0.34              // roller pocket radius (proportional to gap)
  const tipR = step * outerRadius * 0.22           // tooth tip rounding radius

  const parts: string[] = []

  for (let i = 0; i < N; i++) {
    // Tooth center angle
    const toothAngle = i * step
    // Valley center angle (between this tooth and next)
    const valleyAngle = toothAngle + step / 2

    // Tooth tip arc: centered on tooth, from flank to flank
    const toothHalfWidth = step * 0.28
    const tipLeft = toothAngle - toothHalfWidth
    const tipRight = toothAngle + toothHalfWidth

    const tlx = Math.cos(tipLeft) * outerRadius
    const tly = Math.sin(tipLeft) * outerRadius
    const trx = Math.cos(tipRight) * outerRadius
    const try_ = Math.sin(tipRight) * outerRadius

    // Valley (roller pocket): semicircular arc at root radius
    const valleyHalfWidth = step * 0.22
    const vLeft = valleyAngle - valleyHalfWidth
    const vRight = valleyAngle + valleyHalfWidth

    const vlx = Math.cos(vLeft) * rootR
    const vly = Math.sin(vLeft) * rootR
    const vrx = Math.cos(vRight) * rootR
    const vry = Math.sin(vRight) * rootR

    if (i === 0) {
      parts.push(`M ${n(tlx)} ${n(tly)}`)
    }

    // Tooth tip arc (rounded top of tooth)
    parts.push(`A ${n(tipR)} ${n(tipR)} 0 0 1 ${n(trx)} ${n(try_)}`)

    // Flank: smooth curve from tooth tip down to valley
    // Use a quadratic bezier through a point on the pitch circle
    const flankAngle = toothAngle + toothHalfWidth + (step / 2 - toothHalfWidth - valleyHalfWidth) / 2
    const fmx = Math.cos(flankAngle) * (pitchR * 0.97)
    const fmy = Math.sin(flankAngle) * (pitchR * 0.97)
    parts.push(`Q ${n(fmx)} ${n(fmy)} ${n(vrx)} ${n(vry)}`)

    // Roller pocket (valley arc)
    parts.push(`A ${n(rollerR)} ${n(rollerR)} 0 0 1 ${n(vlx)} ${n(vly)}`)

    // Flank: smooth curve from valley up to next tooth tip
    const nextToothAngle = (i + 1) * step
    const nextTipLeft = nextToothAngle - toothHalfWidth
    const ntlx = Math.cos(nextTipLeft) * outerRadius
    const ntly = Math.sin(nextTipLeft) * outerRadius

    const flankAngle2 = valleyAngle + valleyHalfWidth + (step / 2 - toothHalfWidth - valleyHalfWidth) / 2
    const fm2x = Math.cos(flankAngle2) * (pitchR * 0.97)
    const fm2y = Math.sin(flankAngle2) * (pitchR * 0.97)
    parts.push(`Q ${n(fm2x)} ${n(fm2y)} ${n(ntlx)} ${n(ntly)}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Ratio of pitch circle to outside diameter for chain positioning */
export function pitchCircleRatio(numTeeth: number): number {
  return 0.90  // chain sits ~90% of outer radius
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const profile = useMemo(() => generateSprocketProfile(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.12
  const hubRadius = outerRadius * 0.30
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const toAngle = direction === 'ccw' ? -360 : 360

  // Lightening holes at asymmetric angles
  const holeAngles = numTeeth > 18
    ? [25, 115, 205, 295]
    : numTeeth > 12
    ? [30, 150, 270]
    : []
  const holeDist = outerRadius * 0.56
  const holeR = outerRadius * 0.085

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

          {/* Tooth profile — single unified shape */}
          <path
            d={profile}
            fill="#606068"
            stroke="#80808a"
            strokeWidth={0.5}
          />

          {/* Inner body disc (slightly recessed look) */}
          <circle r={outerRadius * 0.78} fill="#505058" stroke="none" />

          {/* Lightening holes */}
          {holeAngles.map((angle) => (
            <circle
              key={angle}
              cx={Math.cos((angle * Math.PI) / 180) * holeDist}
              cy={Math.sin((angle * Math.PI) / 180) * holeDist}
              r={holeR}
              fill="#1a1a2e"
              stroke="#3e3e46"
              strokeWidth={0.5}
            />
          ))}

          {/* Spokes for small sprockets */}
          {numTeeth <= 12 && [0, 72, 144, 216, 288].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * boreRadius * 1.6}
              y1={Math.sin((angle * Math.PI) / 180) * boreRadius * 1.6}
              x2={Math.cos((angle * Math.PI) / 180) * (outerRadius * 0.6)}
              y2={Math.sin((angle * Math.PI) / 180) * (outerRadius * 0.6)}
              stroke="#3e3e46"
              strokeWidth={2.5}
            />
          ))}

          {/* Hub ring */}
          <circle r={hubRadius} fill="#484850" stroke="#5e5e66" strokeWidth={1.2} />

          {/* Bore */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#4e4e56" strokeWidth={0.8} />

          {/* Keyway */}
          <rect
            x={-boreRadius * 0.35}
            y={-boreRadius - 0.5}
            width={boreRadius * 0.7}
            height={boreRadius * 0.45}
            fill="#1a1a2e"
          />

          {/* Set screw */}
          <circle
            cx={0}
            cy={-(hubRadius * 0.72)}
            r={boreRadius * 0.22}
            fill="#3a3a42"
            stroke="#4e4e56"
            strokeWidth={0.4}
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
