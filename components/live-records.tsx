import { memo } from "react"
import { Zap, ArrowUp, Radio, Plane } from "lucide-react"
import { registration_from_hexid } from "@/lib/registration-lookup"
import type { AircraftStats } from "@/types/aircraft"

interface LiveRecordsProps {
  stats: AircraftStats
  isPlaybackMode: boolean
  aircraftImages: { [key: string]: string }
  speedHistory: { time: number; value: number; aircraft: string }[]
  altitudeHistory: { time: number; value: number; aircraft: string }[]
  emergencyHistory: { time: number; count: number }[]
  signalHistory: { time: number; value: number; aircraft: string }[]
  activeSignals: number
  messageRate: string
}

export const LiveRecords = memo(function LiveRecords({
  stats,
  isPlaybackMode,
  aircraftImages,
  speedHistory,
  altitudeHistory,
  emergencyHistory,
  signalHistory,
  activeSignals,
  messageRate,
}: LiveRecordsProps) {
  const getAircraftLabel = (aircraft: any) => {
    return aircraft.flight || aircraft.r || registration_from_hexid(aircraft.hex) || aircraft.hex
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-3">Live Records</h2>

      {/* Fastest Aircraft */}
      {stats.fastest && (
        <div className="relative bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm rounded-xl p-4 border border-orange-500/30 overflow-hidden">
          {aircraftImages[stats.fastest.hex] && (
            <div className="absolute inset-0 opacity-10">
              <img
                src={aircraftImages[stats.fastest.hex]}
                alt="Aircraft"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm font-semibold text-orange-400">Fastest</span>
              </div>
              <div className="px-2 py-1 bg-orange-500/20 rounded-lg">
                <Plane className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {getAircraftLabel(stats.fastest)}
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {Math.round(stats.fastest.gs || 0)} <span className="text-sm text-orange-300">kts</span>
            </div>
          </div>
        </div>
      )}

      {/* Highest Aircraft */}
      {stats.highest && (
        <div className="relative bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 overflow-hidden">
          {aircraftImages[stats.highest.hex] && (
            <div className="absolute inset-0 opacity-10">
              <img
                src={aircraftImages[stats.highest.hex]}
                alt="Aircraft"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ArrowUp className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-blue-400">Highest</span>
              </div>
              <div className="px-2 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-300 font-mono">
                FL{Math.floor((stats.highest.alt_baro || 0) / 100)}
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {getAircraftLabel(stats.highest)}
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats.highest.alt_baro?.toLocaleString()} <span className="text-sm text-blue-300">ft</span>
            </div>
          </div>
        </div>
      )}

      {/* Most Active Aircraft */}
      {stats.mostMessages && (
        <div className="relative bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 overflow-hidden">
          {aircraftImages[stats.mostMessages.hex] && (
            <div className="absolute inset-0 opacity-10">
              <img
                src={aircraftImages[stats.mostMessages.hex]}
                alt="Aircraft"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Radio className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm font-semibold text-green-400">Most Active</span>
              </div>
              <div className="px-2 py-1 bg-green-500/20 rounded-lg text-xs text-green-300 font-mono">
                {stats.mostMessages.messages} MSG
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {getAircraftLabel(stats.mostMessages)}
            </div>
            <div className="text-lg font-semibold text-green-400">
              Strong Signal
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Avg Speed</span>
          <span className="text-base font-semibold text-white">{stats.avgSpeed} kts</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Avg Altitude</span>
          <span className="text-base font-semibold text-white">{stats.avgAltitude.toLocaleString()} ft</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Signal Quality</span>
          <span className="text-base font-semibold text-purple-400">
            {stats.totalAircraft > 0 ? ((activeSignals / stats.totalAircraft) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Message Rate</span>
          <span className="text-base font-semibold text-blue-400">{messageRate} msg/s</span>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          Updated {stats.lastUpdate?.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
})
