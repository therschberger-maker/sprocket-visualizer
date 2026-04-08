'use client'

interface ChainSVGProps {
  driver: { cx: number; cy: number; radius: number }
  driven: { cx: number; cy: number; radius: number }
  rpm: number
}

export default function ChainSVG({ driver, driven, rpm }: ChainSVGProps) {
  const dx = driven.cx - driver.cx
  const dy = driven.cy - driver.cy
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist === 0) return null

  const angle = Math.atan2(dy, dx)
  const r1 = driver.radius
  const r2 = driven.radius

  // Calculate tangent lines for the chain
  const rDiff = r2 - r1
  const tangentAngle = Math.asin(Math.min(1, Math.max(-1, rDiff / dist)))

  const perpAngle1 = angle + Math.PI / 2 - tangentAngle
  const perpAngle2 = angle - Math.PI / 2 + tangentAngle

  // Top chain line
  const topStart = {
    x: driver.cx + Math.cos(perpAngle1) * r1,
    y: driver.cy + Math.sin(perpAngle1) * r1,
  }
  const topEnd = {
    x: driven.cx + Math.cos(perpAngle1) * r2,
    y: driven.cy + Math.sin(perpAngle1) * r2,
  }

  // Bottom chain line
  const bottomStart = {
    x: driver.cx + Math.cos(perpAngle2) * r1,
    y: driver.cy + Math.sin(perpAngle2) * r1,
  }
  const bottomEnd = {
    x: driven.cx + Math.cos(perpAngle2) * r2,
    y: driven.cy + Math.sin(perpAngle2) * r2,
  }

  const visualRpm = Math.min(Math.abs(rpm), 300)
  const chainDuration = visualRpm > 0 ? 30 / visualRpm : 0

  // Chain path for animated links
  const chainPath = `
    M ${topStart.x} ${topStart.y}
    L ${topEnd.x} ${topEnd.y}
    A ${r2} ${r2} 0 1 1 ${bottomEnd.x} ${bottomEnd.y}
    L ${bottomStart.x} ${bottomStart.y}
    A ${r1} ${r1} 0 1 1 ${topStart.x} ${topStart.y}
    Z
  `

  return (
    <g>
      {/* Chain outline */}
      <line x1={topStart.x} y1={topStart.y} x2={topEnd.x} y2={topEnd.y} stroke="#8a7a5a" strokeWidth={4} strokeLinecap="round" />
      <line x1={bottomStart.x} y1={bottomStart.y} x2={bottomEnd.x} y2={bottomEnd.y} stroke="#8a7a5a" strokeWidth={4} strokeLinecap="round" />

      {/* Chain link markers along top */}
      <path
        id="chainPathTop"
        d={`M ${topStart.x} ${topStart.y} L ${topEnd.x} ${topEnd.y}`}
        fill="none"
        stroke="none"
      />
      {chainDuration > 0 && Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={`link-top-${i}`}
          width={6}
          height={8}
          rx={1}
          fill="#b8a878"
          stroke="#9a8a6a"
          strokeWidth={0.5}
        >
          <animateMotion
            dur={`${chainDuration}s`}
            repeatCount="indefinite"
            begin={`${(i / 8) * chainDuration}s`}
          >
            <mpath href="#chainPathTop" />
          </animateMotion>
        </rect>
      ))}

      {/* Chain link markers along bottom */}
      <path
        id="chainPathBottom"
        d={`M ${bottomEnd.x} ${bottomEnd.y} L ${bottomStart.x} ${bottomStart.y}`}
        fill="none"
        stroke="none"
      />
      {chainDuration > 0 && Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={`link-bottom-${i}`}
          width={6}
          height={8}
          rx={1}
          fill="#b8a878"
          stroke="#9a8a6a"
          strokeWidth={0.5}
        >
          <animateMotion
            dur={`${chainDuration}s`}
            repeatCount="indefinite"
            begin={`${(i / 8) * chainDuration}s`}
          >
            <mpath href="#chainPathBottom" />
          </animateMotion>
        </rect>
      ))}
    </g>
  )
}
