"use client"

import { memo } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { StatsOverview } from "./stats-overview"
import { LiveRecords } from "./live-records"
import { ActiveFlightsSimple } from "./active-flights-simple"
import type { SelectedFlight } from "@/types/aircraft"

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
  isNativeApp,
}: {
  aircraft: Aircraft[]
  searchTerm: string
  onFlightSelect: (flight: Aircraft) => void
  isNativeApp: boolean
}) {
  return (
    <ActiveFlightsSimple
      aircraft={aircraft}
      searchTerm={searchTerm}
      onFlightSelect={onFlightSelect}
      isNativeApp={isNativeApp}
    />
  )
})
