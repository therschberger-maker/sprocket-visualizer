'use client'

import { useState, useMemo } from 'react'
import { Sprocket } from '@/lib/types'
import { calculateDrivenRpm, calculateGearRatio, calculateChainSpeed } from '@/lib/calculations'
import ControlPanel from './ControlPanel'
import SprocketSVG from './SprocketSVG'
import ChainSVG from './ChainSVG'
import SpecsDisplay from './SpecsDisplay'

const SVG_WIDTH = 800
const SVG_HEIGHT = 400
const MIN_RADIUS = 40
const MAX_RADIUS = 150

function scaleRadius(diameterInches: number, maxDiameter: number): number {
  const ratio = diameterInches / maxDiameter
  return MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS)
}

export default function SprocketVisualizer() {
  const [driver, setDriver] = useState<Sprocket | null>(null)
  const [driven, setDriven] = useState<Sprocket | null>(null)
  const [driverRpm, setDriverRpm] = useState<number>(100)

  const drivenRpm = useMemo(() => {
    if (!driver || !driven || !driverRpm) return 0
    return calculateDrivenRpm(driverRpm, driver.num_teeth, driven.num_teeth)
  }, [driver, driven, driverRpm])

  const gearRatio = useMemo(() => {
    if (!driver || !driven) return 0
    return calculateGearRatio(driver.num_teeth, driven.num_teeth)
  }, [driver, driven])

  const chainSpeed = useMemo(() => {
    if (!driver || !driverRpm) return 0
    return calculateChainSpeed(driverRpm, driver.num_teeth, driver.chain_pitch_inches)
  }, [driver, driverRpm])

  const maxDiameter = useMemo(() => {
    if (!driver && !driven) return 10
    const d1 = driver?.outside_diameter_inches || 0
    const d2 = driven?.outside_diameter_inches || 0
    return Math.max(d1, d2, 3)
  }, [driver, driven])

  const driverRadius = driver ? scaleRadius(driver.outside_diameter_inches, maxDiameter) : 60
  const drivenRadius = driven ? scaleRadius(driven.outside_diameter_inches, maxDiameter) : 60

  const spacing = driverRadius + drivenRadius + 80
  const driverCx = SVG_WIDTH / 2 - spacing / 2
  const drivenCx = SVG_WIDTH / 2 + spacing / 2
  const centerY = SVG_HEIGHT / 2

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-amber-400">Sprocket</span> Visualizer
          </h1>
          <p className="text-slate-500 text-sm">Chain Drive System Calculator &amp; Visualization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 sticky top-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Configuration</h2>
              <ControlPanel
                onDriverChange={setDriver}
                onDrivenChange={setDriven}
                driverRpm={driverRpm}
                onRpmChange={setDriverRpm}
              />
            </div>
          </div>

          {/* Visualization + Specs */}
          <div className="lg:col-span-3 space-y-6">
            {/* SVG Visualization */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 overflow-hidden">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto"
                style={{ maxHeight: '450px' }}
              >
                <defs>
                  <radialGradient id="bgGrad" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#1a1a2e" />
                    <stop offset="100%" stopColor="#0f0f1a" />
                  </radialGradient>
                </defs>

                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#bgGrad)" rx={12} />

                {/* Grid lines */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <line
                    key={`grid-v-${i}`}
                    x1={i * 40}
                    y1={0}
                    x2={i * 40}
                    y2={SVG_HEIGHT}
                    stroke="#1a1a3a"
                    strokeWidth={0.5}
                  />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`grid-h-${i}`}
                    x1={0}
                    y1={i * 40}
                    x2={SVG_WIDTH}
                    y2={i * 40}
                    stroke="#1a1a3a"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Chain */}
                {driver && driven && (
                  <ChainSVG
                    driver={{ cx: driverCx, cy: centerY, radius: driverRadius * 0.85 }}
                    driven={{ cx: drivenCx, cy: centerY, radius: drivenRadius * 0.85 }}
                    rpm={driverRpm}
                  />
                )}

                {/* Driver sprocket */}
                {driver && (
                  <SprocketSVG
                    numTeeth={driver.num_teeth}
                    outerRadius={driverRadius}
                    rpm={driverRpm}
                    cx={driverCx}
                    cy={centerY}
                    label={`Driver: ${driver.num_teeth}T`}
                    direction="cw"
                  />
                )}

                {/* Driven sprocket */}
                {driven && (
                  <SprocketSVG
                    numTeeth={driven.num_teeth}
                    outerRadius={drivenRadius}
                    rpm={drivenRpm}
                    cx={drivenCx}
                    cy={centerY}
                    label={`Driven: ${driven.num_teeth}T`}
                    direction="cw"
                  />
                )}

                {/* No selection placeholder */}
                {!driver && !driven && (
                  <text
                    x={SVG_WIDTH / 2}
                    y={SVG_HEIGHT / 2}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize={18}
                  >
                    Select a chain size and sprockets to begin
                  </text>
                )}

                {/* RPM display overlay */}
                {driver && driverRpm > 0 && (
                  <>
                    <text x={driverCx} y={centerY - driverRadius - 15} textAnchor="middle" fill="#f59e0b" fontSize={14} fontWeight="bold">
                      {driverRpm} RPM
                    </text>
                    {driven && (
                      <text x={drivenCx} y={centerY - drivenRadius - 15} textAnchor="middle" fill="#06b6d4" fontSize={14} fontWeight="bold">
                        {drivenRpm.toFixed(1)} RPM
                      </text>
                    )}
                  </>
                )}
              </svg>
              {driverRpm > 300 && (
                <p className="text-xs text-slate-600 text-center mt-2">
                  Animation capped at 300 RPM for visibility. Actual values shown above.
                </p>
              )}
            </div>

            {/* Specs */}
            <SpecsDisplay
              driver={driver}
              driven={driven}
              driverRpm={driverRpm}
              drivenRpm={drivenRpm}
              gearRatio={gearRatio}
              chainSpeed={chainSpeed}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
