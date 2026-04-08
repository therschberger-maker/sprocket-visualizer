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
  const innerRadius = outerRadius * 0.85
  const toothDepth = outerRadius - innerRadius
  const points: string[] = []

  for (let i = 0; i < numTeeth; i++) {
    const angle = (i / numTeeth) * Math.PI * 2
    const halfTooth = (Math.PI / numTeeth) * 0.35

    const baseAngle1 = angle - halfTooth
    const tipAngle = angle
    const baseAngle2 = angle + halfTooth

    const valleyAngle = angle + Math.PI / numTeeth

    if (i === 0) {
      points.push(`M ${Math.cos(baseAngle1) * innerRadius} ${Math.sin(baseAngle1) * innerRadius}`)
    }

    points.push(`L ${Math.cos(tipAngle) * (innerRadius + toothDepth)} ${Math.sin(tipAngle) * (innerRadius + toothDepth)}`)
    points.push(`L ${Math.cos(baseAngle2) * innerRadius} ${Math.sin(baseAngle2) * innerRadius}`)

    const valleyR = innerRadius * 0.97
    points.push(`L ${Math.cos(valleyAngle) * valleyR} ${Math.sin(valleyAngle) * valleyR}`)

    const nextAngle = ((i + 1) / numTeeth) * Math.PI * 2
    const nextHalfTooth = (Math.PI / numTeeth) * 0.35
    const nextBaseAngle1 = nextAngle - nextHalfTooth
    points.push(`L ${Math.cos(nextBaseAngle1) * innerRadius} ${Math.sin(nextBaseAngle1) * innerRadius}`)
  }

  points.push('Z')
  return points.join(' ')
}

export default function SprocketSVG({ numTeeth, outerRadius, rpm, cx, cy, label, direction = 'cw' }: SprocketSVGProps) {
  const teethPath = useMemo(() => generateTeethPath(numTeeth, outerRadius), [numTeeth, outerRadius])

  const boreRadius = outerRadius * 0.2
  const hubRadius = outerRadius * 0.4
  const visualRpm = Math.min(Math.abs(rpm), 300)
  const duration = visualRpm > 0 ? 60 / visualRpm : 0
  const animDirection = direction === 'ccw' ? 'reverse' : 'normal'

  return (
    <g>
      <g
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: duration > 0 ? `spin ${duration}s linear infinite ${animDirection}` : 'none',
        }}
      >
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Outer tooth ring */}
          <path
            d={teethPath}
            fill="#4a4a5a"
            stroke="#6a6a7a"
            strokeWidth={1}
          />
          {/* Hub */}
          <circle r={hubRadius} fill="#3a3a4a" stroke="#5a5a6a" strokeWidth={1.5} />
          {/* Bore hole */}
          <circle r={boreRadius} fill="#1a1a2e" stroke="#5a5a6a" strokeWidth={1} />
          {/* Spokes */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * boreRadius * 1.3}
              y1={Math.sin((angle * Math.PI) / 180) * boreRadius * 1.3}
              x2={Math.cos((angle * Math.PI) / 180) * hubRadius * 0.9}
              y2={Math.sin((angle * Math.PI) / 180) * hubRadius * 0.9}
              stroke="#5a5a6a"
              strokeWidth={2}
            />
          ))}
        </g>
      </g>
      {/* Label below */}
      <text
        x={cx}
        y={cy + outerRadius + 20}
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
