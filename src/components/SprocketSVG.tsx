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

function generateTeethPath(numTeeth: number, outerRadius: number): string {
  const toothHeight = outerRadius * 0.14
  const baseRadius = outerRadius - toothHeight
  const valleyRadius = baseRadius * 0.95
  const angleStep = (2 * Math.PI) / numTeeth
  const toothNarrowness = 0.22 // fraction of step — narrow teeth

  const parts: string[] = []

  for (let i = 0; i < numTeeth; i++) {
    const centerAngle = i * angleStep

    // Tooth tip edges (narrow)
    const leftAngle = centerAngle - angleStep * toothNarrowness / 2
    const rightAngle = centerAngle + angleStep * toothNarrowness / 2

    // Shoulder angles (where tooth meets the base)
    const shoulderLeftAngle = centerAngle - angleStep * 0.28
    const shoulderRightAngle = centerAngle + angleStep * 0.28

    // Valley center
    const valleyAngle = centerAngle + angleStep / 2

    if (i === 0) {
      const sx = Math.cos(shoulderLeftAngle) * baseRadius
      const sy = Math.sin(shoulderLeftAngle) * baseRadius
      parts.push(`M ${sx} ${sy}`)
    }

    // Rise to tooth tip (slight curve via left edge)
    const tipLx = Math.cos(leftAngle) * (outerRadius * 0.97)
    const tipLy = Math.sin(leftAngle) * (outerRadius * 0.97)
    parts.push(`L ${tipLx} ${tipLy}`)

    // Tooth tip (pointed)
    const tipX = Math.cos(centerAngle) * outerRadius
    const tipY = Math.sin(centerAngle) * outerRadius
    parts.push(`L ${tipX} ${tipY}`)

    // Down from tip
    const tipRx = Math.cos(rightAngle) * (outerRadius * 0.97)
    const tipRy = Math.sin(rightAngle) * (outerRadius * 0.97)
    parts.push(`L ${tipRx} ${tipRy}`)

    // Down to shoulder
    const sRx = Math.cos(shoulderRightAngle) * baseRadius
    const sRy = Math.sin(shoulderRightAngle) * baseRadius
    parts.push(`L ${sRx} ${sRy}`)

    // Rounded valley (roller seat) — quadratic curve through valley bottom
    const vx = Math.cos(valleyAngle) * valleyRadius
    const vy = Math.sin(valleyAngle) * valleyRadius

    const nextShoulderAngle = (i + 1) * angleStep - angleStep * 0.28
    const nsLx = Math.cos(nextShoulderAngle) * baseRadius
    const nsLy = Math.sin(nextShoulderAngle) * baseRadius
    parts.push(`Q ${vx} ${vy} ${nsLx} ${nsLy}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const teethPath = useMemo(() => generateTeethPath(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.18
  const hubRadius = outerRadius * 0.38
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const toAngle = direction === 'ccw' ? -360 : 360

  return (
    <g>
      {/* Outer translate positions the sprocket, inner g rotates around origin */}
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
          {/* Tooth ring */}
          <path
            d={teethPath}
            fill="#58585e"
            stroke="#78787e"
            strokeWidth={0.8}
          />
          {/* Body ring */}
          <circle r={outerRadius * 0.72} fill="#48484e" stroke="#5a5a60" strokeWidth={1} />
          {/* Hub */}
          <circle r={hubRadius} fill="#3e3e44" stroke="#5a5a60" strokeWidth={1.5} />
          {/* Lightening holes */}
          {numTeeth > 15 && [0, 120, 240].map((angle) => {
            const holeR = outerRadius * 0.1
            const holeDist = outerRadius * 0.55
            return (
              <circle
                key={angle}
                cx={Math.cos((angle * Math.PI) / 180) * holeDist}
                cy={Math.sin((angle * Math.PI) / 180) * holeDist}
                r={holeR}
                fill="#1a1a2e"
                stroke="#4a4a50"
                strokeWidth={0.8}
              />
            )
          })}
          {/* Spokes for smaller sprockets */}
          {numTeeth <= 15 && [0, 60, 120, 180, 240, 300].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * boreRadius * 1.4}
              y1={Math.sin((angle * Math.PI) / 180) * boreRadius * 1.4}
              x2={Math.cos((angle * Math.PI) / 180) * hubRadius * 0.9}
              y2={Math.sin((angle * Math.PI) / 180) * hubRadius * 0.9}
              stroke="#5a5a6a"
              strokeWidth={2}
            />
          ))}
          {/* Bore hole */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#5a5a60" strokeWidth={1} />
          {/* Keyway */}
          <rect
            x={-boreRadius * 0.35}
            y={-boreRadius - 1}
            width={boreRadius * 0.7}
            height={boreRadius * 0.45}
            fill="#1a1a2e"
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
