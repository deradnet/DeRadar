"use client"

import { memo, Suspense, lazy } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { StatsOverview } from "./stats-overview"
import { LiveRecords } from "./live-records"
import { ActiveFlightsSimple } from "./active-flights-simple"
import type { SelectedFlight } from "@/types/aircraft"

// Lazy load map component for better performance
const AircraftMapLeaflet = lazy(() => import("./aircraft-map-leaflet").then(mod => ({ default: mod.AircraftMapLeaflet })))

// Memoized Home Tab Content
export const HomeTabContent = memo(function HomeTabContent({
  stats,
  emergencyCount,
  activeSignals,
  messageRate,
  aircraftImages,
  speedHistory,
  altitudeHistory,
  emergencyHistory,
  signalHistory,
  onShowOnMap,
  isNativeApp,
}: {
  stats: AircraftStats
  emergencyCount: number
  activeSignals: number
  messageRate: string
  aircraftImages: { [key: string]: string }
  speedHistory: { time: number; value: number; aircraft: string }[]
  altitudeHistory: { time: number; value: number; aircraft: string }[]
  emergencyHistory: { time: number; count: number }[]
  signalHistory: { time: number; value: number; aircraft: string }[]
  onShowOnMap?: (hex: string) => void
  isNativeApp: boolean
}) {
  return (
    <>
      <StatsOverview
        totalAircraft={stats.totalAircraft}
        visibleAircraft={stats.totalAircraft}
        emergencyCount={emergencyCount}
        activeSignals={activeSignals}
        messageRate={messageRate}
        isPlaybackMode={false}
      />

      <div className="space-y-6">
        <LiveRecords
          stats={stats}
          isPlaybackMode={false}
          aircraftImages={aircraftImages}
          speedHistory={speedHistory}
          altitudeHistory={altitudeHistory}
          emergencyHistory={emergencyHistory}
          signalHistory={signalHistory}
          activeSignals={activeSignals}
          messageRate={messageRate}
          onShowOnMap={onShowOnMap}
          isNativeApp={isNativeApp}
        />
      </div>
    </>
  )
})

// Memoized Flights Tab Content
export const FlightsTabContent = memo(function FlightsTabContent({
  aircraft,
  searchTerm,
  onFlightSelect,
  onShowOnMap,
  onQueryInSkyQuery,
  isNativeApp,
}: {
  aircraft: Aircraft[]
  searchTerm: string
  onFlightSelect: (flight: Aircraft) => void
  onShowOnMap?: (hex: string) => void
  onQueryInSkyQuery?: (callsign: string, icao: string) => void
  isNativeApp: boolean
}) {
  return (
    <ActiveFlightsSimple
      aircraft={aircraft}
      searchTerm={searchTerm}
      onFlightSelect={onFlightSelect}
      onShowOnMap={onShowOnMap}
      onQueryInSkyQuery={onQueryInSkyQuery}
      isNativeApp={isNativeApp}
    />
  )
})

// Memoized Map Tab Content
export const MapTabContent = memo(function MapTabContent({
  aircraft,
  onFlightSelect,
  highlightedHex,
  onHighlightClear,
}: {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
  highlightedHex?: string | null
  onHighlightClear?: () => void
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Loading map...</p>
          </div>
        </div>
      }
    >
      <AircraftMapLeaflet
        aircraft={aircraft}
        onFlightSelect={onFlightSelect}
        highlightedHex={highlightedHex}
        onHighlightClear={onHighlightClear}
      />
    </Suspense>
  )
})
