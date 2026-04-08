'use client'

import { Sprocket } from '@/lib/types'

interface SpecsDisplayProps {
  driver: Sprocket | null
  driven: Sprocket | null
  driverRpm: number
  drivenRpm: number
  gearRatio: number
  chainSpeed: number
}

function SprocketCard({ sprocket, rpm, label, color }: { sprocket: Sprocket; rpm: number; label: string; color: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
      <h3 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{label}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <span className="text-slate-500">Teeth</span>
        <span className="text-slate-200 font-mono">{sprocket.num_teeth}</span>
        <span className="text-slate-500">OD</span>
        <span className="text-slate-200 font-mono">{sprocket.outside_diameter}</span>
        <span className="text-slate-500">Pitch</span>
        <span className="text-slate-200 font-mono">{sprocket.chain_pitch}</span>
        <span className="text-slate-500">Bore</span>
        <span className="text-slate-200 font-mono">{sprocket.bore_size_range}</span>
        <span className="text-slate-500">RPM</span>
        <span className="text-white font-mono font-bold text-base">{rpm.toFixed(1)}</span>
        <span className="text-slate-500">Part #</span>
        <span className="text-slate-200 font-mono">{sprocket.mcmaster_part_number}</span>
        <span className="text-slate-500">Price</span>
        <span className="text-green-400 font-mono">${sprocket.price.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default function SpecsDisplay({ driver, driven, driverRpm, drivenRpm, gearRatio, chainSpeed }: SpecsDisplayProps) {
  if (!driver || !driven) {
    return (
      <div className="text-center text-slate-500 py-8">
        Select both sprockets to see specifications
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SprocketCard sprocket={driver} rpm={driverRpm} label="Driver" color="text-amber-400" />
        <SprocketCard sprocket={driven} rpm={drivenRpm} label="Driven" color="text-cyan-400" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">System</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-slate-500 text-xs mb-1">Gear Ratio</div>
            <div className="text-white font-mono font-bold text-lg">{gearRatio.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Speed Ratio</div>
            <div className="text-white font-mono font-bold text-lg">{(1 / gearRatio).toFixed(3)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Chain Speed</div>
            <div className="text-white font-mono font-bold text-lg">{chainSpeed.toFixed(0)} <span className="text-xs text-slate-400">in/min</span></div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Total Cost</div>
            <div className="text-green-400 font-mono font-bold text-lg">${(driver.price + driven.price).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
