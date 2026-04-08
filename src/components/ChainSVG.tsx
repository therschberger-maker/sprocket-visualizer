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

  // Tangent angle for chain lines connecting different-sized sprockets
  const rDiff = r2 - r1
  const tangentAngle = Math.asin(Math.min(1, Math.max(-1, rDiff / dist)))

  const perpAngle1 = angle + Math.PI / 2 - tangentAngle
  const perpAngle2 = angle - Math.PI / 2 + tangentAngle

  // Top chain strand
  const topStart = {
    x: driver.cx + Math.cos(perpAngle1) * r1,
    y: driver.cy + Math.sin(perpAngle1) * r1,
  }
  const topEnd = {
    x: driven.cx + Math.cos(perpAngle1) * r2,
    y: driven.cy + Math.sin(perpAngle1) * r2,
  }

  // Bottom chain strand
  const bottomStart = {
    x: driver.cx + Math.cos(perpAngle2) * r1,
    y: driver.cy + Math.sin(perpAngle2) * r1,
  }
  const bottomEnd = {
    x: driven.cx + Math.cos(perpAngle2) * r2,
    y: driven.cy + Math.sin(perpAngle2) * r2,
  }

  const visualRpm = Math.min(Math.abs(rpm), 300)
  const chainDuration = visualRpm > 0 ? 20 / visualRpm : 0

  // Unique IDs to avoid conflicts if multiple chains rendered
  const topId = `chainTop-${Math.round(driver.cx)}`
  const bottomId = `chainBottom-${Math.round(driver.cx)}`

  // Full chain loop path for animated markers
  // Top strand -> arc around driven -> bottom strand -> arc around driver
  const topAngle1 = Math.atan2(topEnd.y - driven.cy, topEnd.x - driven.cx)
  const bottomAngle1 = Math.atan2(bottomEnd.y - driven.cy, bottomEnd.x - driven.cx)
  const topAngle2 = Math.atan2(topStart.y - driver.cy, topStart.x - driver.cx)
  const bottomAngle2 = Math.atan2(bottomStart.y - driver.cy, bottomStart.x - driver.cx)

  // Determine sweep for arcs (we want the chain to wrap around the far side)
  const drivenSweep = topAngle1 > bottomAngle1 ? 1 : 0
  const driverSweep = bottomAngle2 > topAngle2 ? 1 : 0

  return (
    <g>
      {/* Chain strands - double line for realistic chain look */}
      <line x1={topStart.x} y1={topStart.y} x2={topEnd.x} y2={topEnd.y}
        stroke="#5a4a2a" strokeWidth={6} strokeLinecap="round" />
      <line x1={topStart.x} y1={topStart.y} x2={topEnd.x} y2={topEnd.y}
        stroke="#8a7a4a" strokeWidth={3} strokeLinecap="round" />

      <line x1={bottomStart.x} y1={bottomStart.y} x2={bottomEnd.x} y2={bottomEnd.y}
        stroke="#5a4a2a" strokeWidth={6} strokeLinecap="round" />
      <line x1={bottomStart.x} y1={bottomStart.y} x2={bottomEnd.x} y2={bottomEnd.y}
        stroke="#8a7a4a" strokeWidth={3} strokeLinecap="round" />

      {/* Animated chain link markers on top strand */}
      <path
        id={topId}
        d={`M ${topStart.x} ${topStart.y} L ${topEnd.x} ${topEnd.y}`}
        fill="none"
        stroke="none"
      />
      {chainDuration > 0 && Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={`lt-${i}`}
          width={5}
          height={8}
          rx={1}
          fill="#c4a44a"
          stroke="#a08838"
          strokeWidth={0.5}
          opacity={0.8}
        >
          <animateMotion
            dur={`${chainDuration}s`}
            repeatCount="indefinite"
            begin={`${(i / 6) * chainDuration}s`}
            rotate="auto"
          >
            <mpath href={`#${topId}`} />
          </animateMotion>
        </rect>
      ))}

      {/* Animated chain link markers on bottom strand */}
      <path
        id={bottomId}
        d={`M ${bottomEnd.x} ${bottomEnd.y} L ${bottomStart.x} ${bottomStart.y}`}
        fill="none"
        stroke="none"
      />
      {chainDuration > 0 && Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={`lb-${i}`}
          width={5}
          height={8}
          rx={1}
          fill="#c4a44a"
          stroke="#a08838"
          strokeWidth={0.5}
          opacity={0.8}
        >
          <animateMotion
            dur={`${chainDuration}s`}
            repeatCount="indefinite"
            begin={`${(i / 6) * chainDuration}s`}
            rotate="auto"
          >
            <mpath href={`#${bottomId}`} />
          </animateMotion>
        </rect>
      ))}
    </g>
  )
}
