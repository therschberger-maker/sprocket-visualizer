'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sprocket } from '@/lib/types'

interface ControlPanelProps {
  onDriverChange: (s: Sprocket | null) => void
  onDrivenChange: (s: Sprocket | null) => void
  driverRpm: number
  onRpmChange: (rpm: number) => void
}

export default function ControlPanel({ onDriverChange, onDrivenChange, driverRpm, onRpmChange }: ControlPanelProps) {
  const [chainSizes, setChainSizes] = useState<{ chain_size: string; standard: string; count: number }[]>([])
  const [selectedChainSize, setSelectedChainSize] = useState<string>('')
  const [sprockets, setSprockets] = useState<Sprocket[]>([])
  const [driverId, setDriverId] = useState<string>('')
  const [drivenId, setDrivenId] = useState<string>('')

  useEffect(() => {
    async function loadChainSizes() {
      const { data, error } = await supabase
        .from('sprockets')
        .select('chain_size, standard')
        .order('chain_size')

      if (error) {
        console.error('Failed to load chain sizes:', error.message)
        return
      }

      if (data) {
        const counts = new Map<string, { standard: string; count: number }>()
        data.forEach((row) => {
          const existing = counts.get(row.chain_size)
          if (existing) {
            existing.count++
          } else {
            counts.set(row.chain_size, { standard: row.standard, count: 1 })
          }
        })
        const sizes = Array.from(counts.entries())
          .filter(([, v]) => v.count >= 2)
          .map(([chain_size, v]) => ({ chain_size, standard: v.standard, count: v.count }))
        setChainSizes(sizes)
      }
    }
    loadChainSizes()
  }, [])

  useEffect(() => {
    if (!selectedChainSize) {
      setSprockets([])
      return
    }
    async function loadSprockets() {
      const { data, error } = await supabase
        .from('sprockets')
        .select('*')
        .eq('chain_size', selectedChainSize)
        .order('num_teeth')

      if (error) {
        console.error('Failed to load sprockets:', error.message)
        return
      }

      if (data) setSprockets(data as Sprocket[])
    }
    loadSprockets()
  }, [selectedChainSize])

  function handleChainSizeChange(cs: string) {
    setSelectedChainSize(cs)
    setDriverId('')
    setDrivenId('')
    onDriverChange(null)
    onDrivenChange(null)
  }

  function handleDriverChange(id: string) {
    setDriverId(id)
    const s = sprockets.find((s) => s.id === Number(id)) || null
    onDriverChange(s)
  }

  function handleDrivenChange(id: string) {
    setDrivenId(id)
    const s = sprockets.find((s) => s.id === Number(id)) || null
    onDrivenChange(s)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Chain Size</label>
        <select
          value={selectedChainSize}
          onChange={(e) => handleChainSizeChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Select chain size...</option>
          {chainSizes.map((cs) => (
            <option key={cs.chain_size} value={cs.chain_size}>
              {cs.chain_size} ({cs.standard}) - {cs.count} sprockets
            </option>
          ))}
        </select>
      </div>

      {selectedChainSize && (
        <>
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-1.5">Driver Sprocket</label>
            <select
              value={driverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Select driver...</option>
              {sprockets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.num_teeth}T - OD: {s.outside_diameter} - #{s.mcmaster_part_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-1.5">Driven Sprocket</label>
            <select
              value={drivenId}
              onChange={(e) => handleDrivenChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Select driven...</option>
              {sprockets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.num_teeth}T - OD: {s.outside_diameter} - #{s.mcmaster_part_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Driver RPM</label>
            <input
              type="number"
              value={driverRpm || ''}
              onChange={(e) => onRpmChange(Number(e.target.value) || 0)}
              placeholder="Enter RPM..."
              min={0}
              max={50000}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </>
      )}
    </div>
  )
}
