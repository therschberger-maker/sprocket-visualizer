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

  const rDiff = r2 - r1
  const tangentAngle = Math.asin(Math.min(1, Math.max(-1, rDiff / dist)))

  // In SVG, +Y is down. perpAngle1 (angle + PI/2) points downward = visual bottom.
  // perpAngle2 (angle - PI/2) points upward = visual top.
  const perpAngleBottom = angle + Math.PI / 2 - tangentAngle
  const perpAngleTop = angle - Math.PI / 2 + tangentAngle

  // Visual top strand (tight side for CW rotation: driver → driven)
  const topDriverPt = {
    x: driver.cx + Math.cos(perpAngleTop) * r1,
    y: driver.cy + Math.sin(perpAngleTop) * r1,
  }
  const topDrivenPt = {
    x: driven.cx + Math.cos(perpAngleTop) * r2,
    y: driven.cy + Math.sin(perpAngleTop) * r2,
  }

  // Visual bottom strand (slack side: driven → driver)
  const bottomDriverPt = {
    x: driver.cx + Math.cos(perpAngleBottom) * r1,
    y: driver.cy + Math.sin(perpAngleBottom) * r1,
  }
  const bottomDrivenPt = {
    x: driven.cx + Math.cos(perpAngleBottom) * r2,
    y: driven.cy + Math.sin(perpAngleBottom) * r2,
  }

  const visualRpm = Math.min(Math.abs(rpm), 300)
  const chainDuration = visualRpm > 0 ? 20 / visualRpm : 0

  const topId = `chainTop-${Math.round(driver.cx)}`
  const bottomId = `chainBottom-${Math.round(driver.cx)}`

  return (
    <g>
      {/* Chain strands - double line for realistic chain look */}
      <line x1={topDriverPt.x} y1={topDriverPt.y} x2={topDrivenPt.x} y2={topDrivenPt.y}
        stroke="#5a4a2a" strokeWidth={6} strokeLinecap="round" />
      <line x1={topDriverPt.x} y1={topDriverPt.y} x2={topDrivenPt.x} y2={topDrivenPt.y}
        stroke="#8a7a4a" strokeWidth={3} strokeLinecap="round" />

      <line x1={bottomDriverPt.x} y1={bottomDriverPt.y} x2={bottomDrivenPt.x} y2={bottomDrivenPt.y}
        stroke="#5a4a2a" strokeWidth={6} strokeLinecap="round" />
      <line x1={bottomDriverPt.x} y1={bottomDriverPt.y} x2={bottomDrivenPt.x} y2={bottomDrivenPt.y}
        stroke="#8a7a4a" strokeWidth={3} strokeLinecap="round" />

      {/* Top strand: chain moves driver → driven (CW rotation) */}
      <path
        id={topId}
        d={`M ${topDriverPt.x} ${topDriverPt.y} L ${topDrivenPt.x} ${topDrivenPt.y}`}
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

      {/* Bottom strand: chain moves driven → driver (return path) */}
      <path
        id={bottomId}
        d={`M ${bottomDrivenPt.x} ${bottomDrivenPt.y} L ${bottomDriverPt.x} ${bottomDriverPt.y}`}
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
