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
}

function generateSprocketPath(numTeeth: number, outerRadius: number): string {
  const toothHeight = outerRadius * 0.14
  const baseRadius = outerRadius - toothHeight
  const valleyRadius = baseRadius * 0.95
  const hubRadius = outerRadius * 0.38
  const angleStep = (2 * Math.PI) / numTeeth
  const toothNarrowness = 0.22

  // Outer tooth ring path
  const outer: string[] = []
  for (let i = 0; i < numTeeth; i++) {
    const centerAngle = i * angleStep
    const leftAngle = centerAngle - angleStep * toothNarrowness / 2
    const rightAngle = centerAngle + angleStep * toothNarrowness / 2
    const shoulderLeftAngle = centerAngle - angleStep * 0.28
    const shoulderRightAngle = centerAngle + angleStep * 0.28
    const valleyAngle = centerAngle + angleStep / 2

    if (i === 0) {
      const sx = Math.cos(shoulderLeftAngle) * baseRadius
      const sy = Math.sin(shoulderLeftAngle) * baseRadius
      outer.push(`M ${sx} ${sy}`)
    }

    outer.push(`L ${Math.cos(leftAngle) * (outerRadius * 0.97)} ${Math.sin(leftAngle) * (outerRadius * 0.97)}`)
    outer.push(`L ${Math.cos(centerAngle) * outerRadius} ${Math.sin(centerAngle) * outerRadius}`)
    outer.push(`L ${Math.cos(rightAngle) * (outerRadius * 0.97)} ${Math.sin(rightAngle) * (outerRadius * 0.97)}`)
    outer.push(`L ${Math.cos(shoulderRightAngle) * baseRadius} ${Math.sin(shoulderRightAngle) * baseRadius}`)

    const vx = Math.cos(valleyAngle) * valleyRadius
    const vy = Math.sin(valleyAngle) * valleyRadius
    const nextShoulderAngle = (i + 1) * angleStep - angleStep * 0.28
    outer.push(`Q ${vx} ${vy} ${Math.cos(nextShoulderAngle) * baseRadius} ${Math.sin(nextShoulderAngle) * baseRadius}`)
  }
  outer.push('Z')

  // Cut out the hub hole (drawn counter-clockwise to create a hole via even-odd rule)
  // We'll approximate the circle with 4 arcs
  outer.push(`M ${hubRadius} 0`)
  outer.push(`A ${hubRadius} ${hubRadius} 0 0 0 ${-hubRadius} 0`)
  outer.push(`A ${hubRadius} ${hubRadius} 0 0 0 ${hubRadius} 0`)
  outer.push('Z')

  return outer.join(' ')
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const sprocketPath = useMemo(() => generateSprocketPath(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.18
  const hubRadius = outerRadius * 0.38
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const toAngle = direction === 'ccw' ? -360 : 360

  // Lightening holes — use 4 at non-symmetric angles for visible rotation
  const holeAngles = numTeeth > 15
    ? [15, 105, 195, 285]
    : []
  const holeDist = outerRadius * 0.58
  const holeR = outerRadius * 0.09

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
          {/* Single unified sprocket shape (teeth + body with hub cutout) */}
          <path
            d={sprocketPath}
            fill="#58585e"
            stroke="#78787e"
            strokeWidth={0.8}
            fillRule="evenodd"
          />
          {/* Lightening holes */}
          {holeAngles.map((angle) => (
            <circle
              key={angle}
              cx={Math.cos((angle * Math.PI) / 180) * holeDist}
              cy={Math.sin((angle * Math.PI) / 180) * holeDist}
              r={holeR}
              fill="#1a1a2e"
              stroke="#4a4a50"
              strokeWidth={0.8}
            />
          ))}
          {/* Spokes for smaller sprockets */}
          {numTeeth <= 15 && [0, 72, 144, 216, 288].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * boreRadius * 1.4}
              y1={Math.sin((angle * Math.PI) / 180) * boreRadius * 1.4}
              x2={Math.cos((angle * Math.PI) / 180) * hubRadius * 0.9}
              y2={Math.sin((angle * Math.PI) / 180) * hubRadius * 0.9}
              stroke="#4a4a50"
              strokeWidth={2.5}
            />
          ))}
          {/* Hub ring (visual detail, not a separate circle covering teeth) */}
          <circle r={hubRadius} fill="none" stroke="#6a6a70" strokeWidth={1.5} />
          {/* Bore hole */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#5a5a60" strokeWidth={1} />
          {/* Keyway notch (asymmetric — shows rotation) */}
          <rect
            x={-boreRadius * 0.35}
            y={-boreRadius - 1}
            width={boreRadius * 0.7}
            height={boreRadius * 0.5}
            fill="#1a1a2e"
          />
          {/* Set screw detail */}
          <circle
            cx={0}
            cy={-(hubRadius * 0.7)}
            r={boreRadius * 0.25}
            fill="#3a3a40"
            stroke="#5a5a60"
            strokeWidth={0.5}
          />
        </g>
      </g>
      {/* Label below */}
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
