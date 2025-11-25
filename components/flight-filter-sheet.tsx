"use client"

import { useState } from "react"
import { X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { haptic } from "@/lib/haptics"

export interface FlightFilters {
  minAltitude: number
  maxAltitude: number
  minSpeed: number
  maxSpeed: number
  showEmergency: boolean
  showMilitary: boolean
  showCommercial: boolean
}

interface FlightFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  filters: FlightFilters
  onApplyFilters: (filters: FlightFilters) => void
}

export function FlightFilterSheet({ isOpen, onClose, filters, onApplyFilters }: FlightFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FlightFilters>(filters)

  if (!isOpen) return null

  const handleApply = () => {
    haptic.medium()
    onApplyFilters(localFilters)
    onClose()
  }

  const handleReset = () => {
    haptic.light()
    const defaultFilters: FlightFilters = {
      minAltitude: 0,
      maxAltitude: 50000,
      minSpeed: 0,
      maxSpeed: 700,
      showEmergency: true,
      showMilitary: true,
      showCommercial: true,
    }
    setLocalFilters(defaultFilters)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Filter Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Filter Flights</h2>
          </div>
          <button
            onClick={() => {
              haptic.light()
              onClose()
            }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Altitude Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Altitude (feet)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Min</label>
                <input
                  type="number"
                  value={localFilters.minAltitude}
                  onChange={(e) => setLocalFilters({ ...localFilters, minAltitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400/50 focus:bg-white/10 transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max</label>
                <input
                  type="number"
                  value={localFilters.maxAltitude}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxAltitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400/50 focus:bg-white/10 transition-all"
                  placeholder="50000"
                />
              </div>
            </div>
          </div>

          {/* Speed Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Speed (knots)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Min</label>
                <input
                  type="number"
                  value={localFilters.minSpeed}
                  onChange={(e) => setLocalFilters({ ...localFilters, minSpeed: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400/50 focus:bg-white/10 transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max</label>
                <input
                  type="number"
                  value={localFilters.maxSpeed}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxSpeed: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400/50 focus:bg-white/10 transition-all"
                  placeholder="700"
                />
              </div>
            </div>
          </div>

          {/* Aircraft Types */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Aircraft Types</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-white">Emergency Aircraft</span>
                <input
                  type="checkbox"
                  checked={localFilters.showEmergency}
                  onChange={(e) => {
                    haptic.selection()
                    setLocalFilters({ ...localFilters, showEmergency: e.target.checked })
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-400/50"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-white">Military Aircraft</span>
                <input
                  type="checkbox"
                  checked={localFilters.showMilitary}
                  onChange={(e) => {
                    haptic.selection()
                    setLocalFilters({ ...localFilters, showMilitary: e.target.checked })
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-400/50"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-white">Commercial Aircraft</span>
                <input
                  type="checkbox"
                  checked={localFilters.showCommercial}
                  onChange={(e) => {
                    haptic.selection()
                    setLocalFilters({ ...localFilters, showCommercial: e.target.checked })
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-400/50"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-slate-950/50 backdrop-blur-xl grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  )
}
