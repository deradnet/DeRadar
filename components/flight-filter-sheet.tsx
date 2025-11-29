"use client"

import { useState } from "react"
import { X, Filter, ChevronRight } from "lucide-react"
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
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
        onClick={() => {
          haptic.light()
          onClose()
        }}
      />

      {/* Filter Sheet - Native style */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-950 rounded-t-[20px] animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-9 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-white tracking-tight">Filters</h1>
            <button
              onClick={() => {
                haptic.light()
                onClose()
              }}
              className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/80" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable with proper padding for buttons */}
        <div className="flex-1 overflow-y-auto pb-safe">
          <div className="px-4 pb-32 space-y-6">

            {/* Altitude Section */}
            <div className="space-y-2">
              <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-wide px-1">Altitude</h2>
              <div className="bg-slate-900/50 rounded-[12px] overflow-hidden border border-white/10">
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                  <span className="text-[17px] text-white flex-1">Minimum</span>
                  <input
                    type="number"
                    value={localFilters.minAltitude}
                    onChange={(e) => {
                      haptic.selection()
                      setLocalFilters({ ...localFilters, minAltitude: Number(e.target.value) })
                    }}
                    className="w-24 text-right text-[17px] bg-transparent text-white/60 outline-none font-mono"
                    placeholder="0"
                  />
                  <span className="text-[17px] text-white/40 ml-2">ft</span>
                </div>
                <div className="flex items-center px-4 py-3">
                  <span className="text-[17px] text-white flex-1">Maximum</span>
                  <input
                    type="number"
                    value={localFilters.maxAltitude}
                    onChange={(e) => {
                      haptic.selection()
                      setLocalFilters({ ...localFilters, maxAltitude: Number(e.target.value) })
                    }}
                    className="w-24 text-right text-[17px] bg-transparent text-white/60 outline-none font-mono"
                    placeholder="50000"
                  />
                  <span className="text-[17px] text-white/40 ml-2">ft</span>
                </div>
              </div>
            </div>

            {/* Speed Section */}
            <div className="space-y-2">
              <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-wide px-1">Speed</h2>
              <div className="bg-slate-900/50 rounded-[12px] overflow-hidden border border-white/10">
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                  <span className="text-[17px] text-white flex-1">Minimum</span>
                  <input
                    type="number"
                    value={localFilters.minSpeed}
                    onChange={(e) => {
                      haptic.selection()
                      setLocalFilters({ ...localFilters, minSpeed: Number(e.target.value) })
                    }}
                    className="w-20 text-right text-[17px] bg-transparent text-white/60 outline-none font-mono"
                    placeholder="0"
                  />
                  <span className="text-[17px] text-white/40 ml-2">kts</span>
                </div>
                <div className="flex items-center px-4 py-3">
                  <span className="text-[17px] text-white flex-1">Maximum</span>
                  <input
                    type="number"
                    value={localFilters.maxSpeed}
                    onChange={(e) => {
                      haptic.selection()
                      setLocalFilters({ ...localFilters, maxSpeed: Number(e.target.value) })
                    }}
                    className="w-20 text-right text-[17px] bg-transparent text-white/60 outline-none font-mono"
                    placeholder="700"
                  />
                  <span className="text-[17px] text-white/40 ml-2">kts</span>
                </div>
              </div>
            </div>

            {/* Aircraft Types Section */}
            <div className="space-y-2">
              <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-wide px-1">Aircraft Types</h2>
              <div className="bg-slate-900/50 rounded-[12px] overflow-hidden border border-white/10 divide-y divide-white/10">
                <label className="flex items-center px-4 py-3.5 active:bg-white/5">
                  <div className="flex-1">
                    <div className="text-[17px] text-white">Emergency</div>
                    <div className="text-[13px] text-white/40 mt-0.5">7700, 7600, 7500</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={localFilters.showEmergency}
                      onChange={(e) => {
                        haptic.selection()
                        setLocalFilters({ ...localFilters, showEmergency: e.target.checked })
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-[51px] h-[31px] bg-white/20 rounded-full peer transition-all peer-checked:bg-[#34C759]" />
                    <div className="absolute left-[2px] top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-[20px]" />
                  </div>
                </label>
                <label className="flex items-center px-4 py-3.5 active:bg-white/5">
                  <div className="flex-1">
                    <div className="text-[17px] text-white">Military</div>
                    <div className="text-[13px] text-white/40 mt-0.5">Government flights</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={localFilters.showMilitary}
                      onChange={(e) => {
                        haptic.selection()
                        setLocalFilters({ ...localFilters, showMilitary: e.target.checked })
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-[51px] h-[31px] bg-white/20 rounded-full peer transition-all peer-checked:bg-[#34C759]" />
                    <div className="absolute left-[2px] top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-[20px]" />
                  </div>
                </label>
                <label className="flex items-center px-4 py-3.5 active:bg-white/5">
                  <div className="flex-1">
                    <div className="text-[17px] text-white">Commercial</div>
                    <div className="text-[13px] text-white/40 mt-0.5">Airlines & cargo</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={localFilters.showCommercial}
                      onChange={(e) => {
                        haptic.selection()
                        setLocalFilters({ ...localFilters, showCommercial: e.target.checked })
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-[51px] h-[31px] bg-white/20 rounded-full peer transition-all peer-checked:bg-[#34C759]" />
                    <div className="absolute left-[2px] top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-[20px]" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom, always visible */}
        <div className="sticky bottom-0 p-4 pt-3 border-t border-white/10 bg-slate-950 space-y-2.5 safe-area-inset-bottom">
          <button
            onClick={handleApply}
            className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-[12px] text-[17px] font-semibold text-white shadow-lg"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-slate-800/80 active:bg-slate-800 rounded-[12px] text-[17px] font-medium text-white"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </>
  )
}
