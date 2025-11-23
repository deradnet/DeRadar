"use client"

import { Globe, Activity, AlertTriangle, Signal } from "lucide-react"

interface StatsOverviewProps {
  totalAircraft: number
  visibleAircraft: number
  emergencyCount: number
  activeSignals: number
  messageRate: string
  isPlaybackMode?: boolean
}

export function StatsOverview({
  totalAircraft,
  visibleAircraft,
  emergencyCount,
  activeSignals,
  messageRate,
  isPlaybackMode = false,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* Total Aircraft */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
        <div className="mb-1.5 p-1.5 bg-blue-500/15 rounded-lg">
          <Globe className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{totalAircraft}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Total</div>
      </div>

      {/* With Location */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
        <div className="mb-1.5 p-1.5 bg-green-500/15 rounded-lg">
          <Activity className="w-4 h-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{visibleAircraft}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Located</div>
      </div>

      {/* Emergencies */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
        <div className="mb-1.5 p-1.5 bg-red-500/15 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{emergencyCount}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Emergency</div>
      </div>

      {/* Active Signals */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
        <div className="mb-1.5 p-1.5 bg-purple-500/15 rounded-lg">
          <Signal className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{activeSignals}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Signals</div>
      </div>
    </div>
  )
}
