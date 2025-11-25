"use client"

import { useState, useMemo, useEffect } from "react"
import { Plane, MapPin, Locate, Database } from "lucide-react"
import { registration_from_hexid } from "@/lib/registration-lookup"
import type { Aircraft } from "@/types/aircraft"
import { CountryFlag } from "@/components/country-flag"

interface ActiveFlightsSimpleProps {
  aircraft: Aircraft[]
  searchTerm: string
  onFlightSelect: (flight: Aircraft) => void
  onShowOnMap?: (hex: string) => void
  onQueryInSkyQuery?: (callsign: string, icao: string) => void
  isNativeApp?: boolean
}

export function ActiveFlightsSimple({
  aircraft,
  searchTerm,
  onFlightSelect,
  onShowOnMap,
  onQueryInSkyQuery,
  isNativeApp = false,
}: ActiveFlightsSimpleProps) {
  const [visibleCount, setVisibleCount] = useState(30)
  const [crossSearchEnabled, setCrossSearchEnabled] = useState(false)

  // Check if cross search is enabled in settings
  useEffect(() => {
    const checkSetting = () => {
      const saved = localStorage.getItem('skyquery_cross_search_enabled')
      setCrossSearchEnabled(saved === 'true')
    }

    checkSetting()

    // Listen for custom event from settings component
    const handleSettingsChange = (e: CustomEvent) => {
      setCrossSearchEnabled(e.detail.crossSearchEnabled)
    }

    window.addEventListener('skyquery-settings-changed', handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener('skyquery-settings-changed', handleSettingsChange as EventListener)
    }
  }, [])

  const filteredFlights = useMemo(() => {
    return aircraft.filter((flight) => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      const flightMatch = flight.flight?.trim().toLowerCase().includes(searchLower)
      const hexMatch = flight.hex?.toLowerCase().includes(searchLower)
      const regMatch = flight.r?.toLowerCase().includes(searchLower)
      const computedReg = flight.hex ? registration_from_hexid(flight.hex) : null
      const computedRegMatch = computedReg?.toLowerCase().includes(searchLower)
      return flightMatch || hexMatch || regMatch || computedRegMatch
    })
  }, [aircraft, searchTerm])

  const displayedFlights = useMemo(() => {
    return filteredFlights.slice(0, visibleCount)
  }, [filteredFlights, visibleCount])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
    if (scrollPercentage > 80 && visibleCount < filteredFlights.length) {
      setVisibleCount((prev) => Math.min(prev + 30, filteredFlights.length))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Active Flights
        </h2>
        <span className="text-sm text-slate-400">
          {searchTerm ? `${filteredFlights.length} of ${aircraft.length}` : aircraft.length}
        </span>
      </div>

      <div
        className={`overflow-y-auto ${isNativeApp ? "h-[calc(100vh-200px)]" : "h-[500px]"}`}
        onScroll={handleScroll}
      >
        <div className="space-y-2 pr-2">
          {displayedFlights.map((flight) => {
            const registration = flight.r || registration_from_hexid(flight.hex)
            const isEmergency = flight.emergency && flight.emergency !== "none"
            const hasLocation = flight.lat && flight.lon

            return (
              <div
                key={flight.hex}
                className={`rounded-xl border backdrop-blur-sm transition-all overflow-hidden ${
                  isEmergency
                    ? "bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10"
                    : "bg-slate-800/60 border-slate-700/50"
                }`}
              >
                {/* Main Content - Clickable */}
                <div
                  className="p-3.5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => onFlightSelect(flight)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Callsign/Registration */}
                      <div className="flex items-center gap-2 mb-2">
                        <CountryFlag icao={flight.hex} size="sm" />
                        <span className="font-bold text-white text-lg truncate">
                          {flight.flight?.trim() || registration || flight.hex}
                        </span>
                        {hasLocation && (
                          <div className="px-1.5 py-0.5 bg-green-500/20 rounded">
                            <MapPin className="w-3 h-3 text-green-400" />
                          </div>
                        )}
                      </div>

                      {/* Registration (if callsign exists) */}
                      {flight.flight && registration && (
                        <div className="text-sm text-slate-400 mb-2 font-medium">
                          {registration}
                        </div>
                      )}

                      {/* Flight Data */}
                      <div className="flex items-center gap-2.5 text-sm flex-wrap">
                        {flight.alt_baro !== undefined && flight.alt_baro > 0 && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-lg">
                            <span className="text-slate-400 text-xs">ALT</span>
                            <span className="text-blue-400 font-mono font-semibold">
                              {flight.alt_baro.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {flight.gs !== undefined && flight.gs > 0 && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-lg">
                            <span className="text-slate-400 text-xs">SPD</span>
                            <span className="text-orange-400 font-mono font-semibold">
                              {Math.round(flight.gs)}
                            </span>
                          </div>
                        )}
                        {flight.track !== undefined && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded-lg">
                            <span className="text-slate-400 text-xs">HDG</span>
                            <span className="text-purple-400 font-mono font-semibold">
                              {Math.round(flight.track)}°
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Emergency Badge */}
                      {isEmergency && (
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[10px] text-red-300 font-semibold uppercase">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                          {flight.emergency}
                        </div>
                      )}
                    </div>

                    {/* Aircraft Icon */}
                    <div className="flex-shrink-0">
                      <div className={`p-2.5 ${isEmergency ? 'bg-red-500/20' : 'bg-blue-500/15'} rounded-xl`}>
                        <Plane
                          className={`w-5 h-5 ${isEmergency ? 'text-red-400' : 'text-blue-400'}`}
                          style={{ transform: `rotate(${flight.track || 0}deg)` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar - Only show in native app if actions are available */}
                {isNativeApp && (onShowOnMap && hasLocation || crossSearchEnabled && onQueryInSkyQuery) && (
                  <div className="border-t border-slate-700/50 bg-slate-900/30 px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {/* Locate on Map Button */}
                      {onShowOnMap && hasLocation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowOnMap(flight.hex)

                            // Haptic feedback
                            if ((window as any).Capacitor?.Plugins?.Haptics) {
                              (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' })
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border border-blue-500/40 rounded-lg transition-all active:scale-95 text-blue-400 text-xs font-medium"
                        >
                          <Locate className="w-3.5 h-3.5" />
                          <span>Map</span>
                        </button>
                      )}
                      {/* Query in SkyQuery Button - Only show if Cross Search is enabled */}
                      {crossSearchEnabled && onQueryInSkyQuery && (flight.flight?.trim() || flight.hex) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const callsign = flight.flight?.trim() || flight.hex
                            onQueryInSkyQuery(callsign, flight.hex)

                            // Haptic feedback
                            if ((window as any).Capacitor?.Plugins?.Haptics) {
                              (window as any).Capacitor.Plugins.Haptics.impact({ style: 'medium' })
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 border border-cyan-500/40 rounded-lg transition-all active:scale-95 text-cyan-400 text-xs font-medium"
                        >
                          <img
                            src="https://app-icons.deradar.app/skyquery%20(1).png"
                            alt="SkyQuery"
                            className="w-3.5 h-3.5 rounded"
                          />
                          <span>Query</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
