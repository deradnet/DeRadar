import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ArrowUp, AlertTriangle, Radio, Plane, Signal } from "lucide-react"
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

export function LiveRecords({
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
  // Helper function to create real-time SVG graphs
  const createMiniGraph = (data: { time: number; value: number }[], color: string, type: "line" | "area" = "line") => {
    if (data.length < 2) return null

    const maxValue = Math.max(...data.map((d) => d.value))
    const minValue = Math.min(...data.map((d) => d.value))
    const range = maxValue - minValue || 1

    const pathD = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 30 - ((d.value - minValue) / range) * 20
        return i === 0 ? `M${x},${y}` : `L${x},${y}`
      })
      .join(" ")

    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
        {type === "area" && <path d={`${pathD} L100,35 L0,35 Z`} fill={color} opacity="0.1" />}
        <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle
          cx={data.length > 0 ? ((data.length - 1) / (data.length - 1)) * 100 : 0}
          cy={data.length > 0 ? 30 - ((data[data.length - 1].value - minValue) / range) * 20 : 30}
          r="2"
          fill={color}
        >
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    )
  }

  // Helper to get change indicator
  const getChangeIndicator = (data: { value: number }[]) => {
    if (data.length < 2) return { change: 0, trend: "stable" }
    const current = data[data.length - 1].value
    const previous = data[data.length - 2].value
    const change = current - previous
    const trend = change > 0 ? "up" : change < 0 ? "down" : "stable"
    return { change: Math.abs(change), trend }
  }

  const cardClass = `bg-slate-900/30 border-slate-800/50 backdrop-blur-xl h-fit ${isPlaybackMode ? "border-purple-500/30" : ""}`
  const contentClass = isPlaybackMode ? "opacity-75" : ""

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${isPlaybackMode ? "text-purple-400" : "text-yellow-400"}`} />
          <span className="text-white">{isPlaybackMode ? "Historical Records" : "Live Records"}</span>
          {isPlaybackMode && (
            <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
              Historical Data
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${contentClass}`}>
        {stats.fastest && (
          <div className="relative p-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/30 backdrop-blur-sm overflow-hidden">
            {/* Full-size background image with overlay */}
            {aircraftImages[stats.fastest.hex] && (
              <div className="absolute inset-0 z-0">
                <img
                  src={aircraftImages[stats.fastest.hex] || "/placeholder.svg"}
                  alt="Aircraft"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 via-orange-600/60 to-orange-500/80"></div>
              </div>
            )}
            {/* Real speed graph */}
            <div className="absolute inset-0 opacity-60 z-10">{createMiniGraph(speedHistory, "#ffffff", "area")}</div>
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <Zap className="w-4 h-4" /> Fastest
                  <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs text-white bg-orange-500/40 px-2 py-1 rounded backdrop-blur-md">
                  {speedHistory.length > 1 ? `${speedHistory.length} samples` : "LIVE"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white truncate max-w-[120px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.fastest.flight ||
                      stats.fastest.r ||
                      registration_from_hexid(stats.fastest.hex) ||
                      stats.fastest.hex}
                  </div>
                  <div className="text-sm text-white font-mono flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {Math.round(stats.fastest.gs || 0)} kts
                    {(() => {
                      const indicator = getChangeIndicator(speedHistory)
                      return (
                        indicator.trend !== "stable" && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              indicator.trend === "up" ? "text-green-200" : "text-red-200"
                            } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                          >
                            {indicator.trend === "up" ? "↗" : "↘"} {indicator.change.toFixed(0)}
                          </span>
                        )
                      )
                    })()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Plane className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {stats.highest && (
          <div className="relative p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30 backdrop-blur-sm overflow-hidden">
            {/* Full-size background image with overlay */}
            {aircraftImages[stats.highest.hex] && (
              <div className="absolute inset-0 z-0">
                <img
                  src={aircraftImages[stats.highest.hex] || "/placeholder.svg"}
                  alt="Aircraft"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 via-blue-600/60 to-blue-500/80"></div>
              </div>
            )}
            {/* Real altitude graph */}
            <div className="absolute inset-0 opacity-60 z-10">
              {createMiniGraph(altitudeHistory, "#ffffff", "line")}
            </div>
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <ArrowUp className="w-4 h-4" /> Highest
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs text-white bg-blue-500/40 px-2 py-1 rounded backdrop-blur-md">
                  FL{Math.floor((stats.highest.alt_baro || 0) / 100)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white truncate max-w-[120px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.highest.flight ||
                      stats.highest.r ||
                      registration_from_hexid(stats.highest.hex) ||
                      stats.highest.hex}
                  </div>
                  <div className="text-sm text-white font-mono flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.highest.alt_baro?.toLocaleString()} ft
                    {(() => {
                      const indicator = getChangeIndicator(altitudeHistory)
                      return (
                        indicator.trend !== "stable" && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              indicator.trend === "up" ? "text-green-200" : "text-red-200"
                            } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                          >
                            {indicator.trend === "up" ? "↑" : "↓"} {indicator.change.toFixed(0)}
                          </span>
                        )
                      )
                    })()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Plane className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {stats.emergency && (
          <div className="relative p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg border border-red-500/30 backdrop-blur-sm overflow-hidden">
            {/* Full-size background image with overlay */}
            {aircraftImages[stats.emergency.hex] && (
              <div className="absolute inset-0 z-0">
                <img
                  src={aircraftImages[stats.emergency.hex] || "/placeholder.svg"}
                  alt="Aircraft"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/85 via-red-600/70 to-red-500/85"></div>
              </div>
            )}
            {/* Real emergency count graph */}
            <div className="absolute inset-0 opacity-20 z-10">
              {emergencyHistory.length > 1 && (
                <svg className="w-full h-full" viewBox="0 0 100 40">
                  {emergencyHistory.map((entry, i) => (
                    <rect
                      key={i}
                      x={i * (100 / emergencyHistory.length)}
                      y={35 - entry.count * 5}
                      width={100 / emergencyHistory.length - 1}
                      height={entry.count * 5}
                      fill="#ffffff"
                      opacity="0.6"
                    />
                  ))}
                </svg>
              )}
            </div>
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <AlertTriangle className="w-4 h-4" /> Emergency
                  <div className="w-2 h-2 bg-red-200 rounded-full animate-ping"></div>
                </div>
                <div className="text-xs text-white bg-red-500/50 px-2 py-1 rounded font-bold backdrop-blur-md">
                  ALERT
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white truncate max-w-[120px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.emergency.flight ||
                      stats.emergency.r ||
                      registration_from_hexid(stats.emergency.hex) ||
                      stats.emergency.hex}
                  </div>
                  <div className="text-sm text-white font-mono uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.emergency.emergency}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Active Aircraft */}
        {stats.mostMessages && (
          <div className="relative p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30 backdrop-blur-sm overflow-hidden">
            {/* Full-size background image with overlay */}
            {aircraftImages[stats.mostMessages.hex] && (
              <div className="absolute inset-0 z-0">
                <img
                  src={aircraftImages[stats.mostMessages.hex] || "/placeholder.svg"}
                  alt="Aircraft"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/80 via-green-600/60 to-green-500/80"></div>
              </div>
            )}
            {/* Real signal strength graph */}
            <div className="absolute inset-0 opacity-60 z-10">{createMiniGraph(signalHistory, "#ffffff", "area")}</div>
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <Radio className="w-4 h-4" /> Most Active
                  <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs text-white bg-green-500/40 px-2 py-1 rounded backdrop-blur-md">
                  {stats.mostMessages.messages || 0} MSG
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white truncate max-w-[120px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {stats.mostMessages.flight ||
                      stats.mostMessages.r ||
                      registration_from_hexid(stats.mostMessages.hex) ||
                      stats.mostMessages.hex}
                  </div>
                  <div className="text-sm text-white font-mono flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Signal: Strong
                    {(() => {
                      const indicator = getChangeIndicator(signalHistory)
                      return (
                        indicator.trend !== "stable" && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              indicator.trend === "up" ? "text-green-200" : "text-yellow-200"
                            } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                          >
                            <Signal className="w-3 h-3" /> {indicator.trend === "up" ? "+" : "-"}
                            {indicator.change.toFixed(0)}
                          </span>
                        )
                      )
                    })()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Radio className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-700/50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span
                className={`text-sm flex items-center gap-2 ${isPlaybackMode ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-slate-400"}`}></div>
                Avg Altitude
              </span>
              <span className={`font-medium font-mono ${isPlaybackMode ? "text-slate-400" : "text-white"}`}>
                {stats.avgAltitude.toLocaleString()} ft
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`text-sm flex items-center gap-2 ${isPlaybackMode ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-slate-400"}`}></div>
                Avg Speed
              </span>
              <span className={`font-medium font-mono ${isPlaybackMode ? "text-slate-400" : "text-white"}`}>
                {stats.avgSpeed} kts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`text-sm flex items-center gap-2 ${isPlaybackMode ? "text-slate-500" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-purple-400 animate-pulse"}`}
                ></div>
                Signal Quality
              </span>
              <span className={`font-medium ${isPlaybackMode ? "text-slate-400" : "text-white"}`}>
                <span className={isPlaybackMode ? "text-slate-500" : "text-purple-400"}>
                  {stats.totalAircraft > 0 ? ((activeSignals / stats.totalAircraft) * 100).toFixed(1) : 0}%
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`text-sm flex items-center gap-2 ${isPlaybackMode ? "text-slate-500" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-blue-400 animate-pulse"}`}
                ></div>
                Message Rate
              </span>
              <span className={`font-medium font-mono ${isPlaybackMode ? "text-slate-400" : "text-white"}`}>
                {messageRate} msg/s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`text-sm flex items-center gap-2 ${isPlaybackMode ? "text-slate-500" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-green-400 animate-pulse"}`}
                ></div>
                Update Rate
              </span>
              <span className={`font-medium font-mono ${isPlaybackMode ? "text-slate-400" : "text-white"}`}>
                {stats.totalAircraft > 0 ? (activeSignals / 3).toFixed(1) : "0"} Hz
              </span>
            </div>
          </div>
        </div>

        <div
          className={`text-xs text-center pt-2 border-t border-slate-700/50 flex items-center justify-center gap-2 ${isPlaybackMode ? "text-slate-600" : "text-slate-500"}`}
        >
          <div
            className={`w-1 h-1 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-green-500 animate-pulse"}`}
          ></div>
          {isPlaybackMode ? "Historical data from archive" : `Updated ${stats.lastUpdate?.toLocaleTimeString()}`}
          <div
            className={`w-1 h-1 rounded-full ${isPlaybackMode ? "bg-slate-600" : "bg-green-500 animate-pulse"}`}
          ></div>
        </div>
      </CardContent>
    </Card>
  )
}
