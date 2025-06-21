import { Card, CardContent } from "@/components/ui/card"
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
  const cardClass = `bg-slate-900/30 border-slate-800/50 backdrop-blur-xl ${isPlaybackMode ? "opacity-50 pointer-events-none" : ""}`
  const iconClass = (baseClass: string) => `${baseClass} ${isPlaybackMode ? "opacity-50" : ""}`
  const textClass = (baseClass: string) => `${baseClass} ${isPlaybackMode ? "text-slate-500" : ""}`

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Card className={`${cardClass} shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-700/70`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-600/20 rounded-xl backdrop-blur-sm">
              <Globe className={iconClass("w-5 h-5 sm:w-6 sm:h-6 text-blue-400")} />
            </div>
            <div>
              <div className={textClass("text-xl sm:text-3xl font-bold text-white")}>{totalAircraft}</div>
              <div className={textClass("text-sm sm:text-base text-slate-400")}>Total Aircraft</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${cardClass} shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-700/70`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-600/20 rounded-xl backdrop-blur-sm">
              <Activity className={iconClass("w-5 h-5 sm:w-6 sm:h-6 text-green-400")} />
            </div>
            <div>
              <div className={textClass("text-xl sm:text-3xl font-bold text-white")}>{visibleAircraft}</div>
              <div className={textClass("text-sm sm:text-base text-slate-400")}>With Location</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${cardClass} shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-700/70`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-red-600/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle className={iconClass("w-5 h-5 sm:w-6 sm:h-6 text-red-400")} />
            </div>
            <div>
              <div className={textClass("text-xl sm:text-3xl font-bold text-white")}>{emergencyCount}</div>
              <div className={textClass("text-sm sm:text-base text-slate-400")}>Emergencies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${cardClass} shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-700/70`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-purple-600/20 rounded-xl backdrop-blur-sm">
              <Signal className={iconClass("w-5 h-5 sm:w-6 sm:h-6 text-purple-400")} />
            </div>
            <div>
              <div className={textClass("text-xl sm:text-3xl font-bold text-white")}>{activeSignals}</div>
              <div className={textClass("text-sm sm:text-base text-slate-400")}>
                Active Signals
                <div className="text-xs text-slate-500">{messageRate} msg/s avg</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPlaybackMode && (
        <div className="col-span-2 lg:col-span-4 text-center py-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm backdrop-blur-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            Live data disabled during historical playback
          </div>
        </div>
      )}
    </div>
  )
}
