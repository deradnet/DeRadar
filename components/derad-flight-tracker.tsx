"use client"

import { useState, useEffect } from "react"
import { useAircraftData } from "@/hooks/use-aircraft-data"
import { AircraftMap } from "./aircraft-map"
import { AircraftInfoPanel } from "./aircraft-info-panel"
import { SettingsPanel } from "./settings-panel"
import { useSettings } from "@/hooks/use-settings"
import { registration_from_hexid } from "@/lib/registration-lookup"
import { usePlayback } from "@/hooks/use-playback"
import { MobileNav } from "./mobile-nav"
import { MobilePlaybackControls } from "./mobile-playback-controls"
import { StatsOverview } from "./stats-overview"
import { LiveRecords } from "./live-records"
import { ActiveFlights } from "./active-flights"
import { SystemAlerts } from "./system-alerts"
import { AppHeader } from "./app-header"
import { PlaybackControls } from "./playback-controls"
import type { SelectedFlight } from "@/types/aircraft"
import { Footer } from "./footer"
import { DataUploadsSection } from "./data-uploads-section"
import { ArweaveSnapshotPanel } from "./arweave-snapshot-panel"
import { arweaveSnapshot } from "@/lib/arweave-snapshot"

export default function DeradFlightTracker() {
  const { aircraft, stats, alerts, isLoading } = useAircraftData()
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [visibleAircraft, setVisibleAircraft] = useState(0)
  const [activeSignals, setActiveSignals] = useState(0)
  const [messageRate, setMessageRate] = useState("0")
  const [isMobile, setIsMobile] = useState(false)

  // Add after existing useState declarations
  const [isPlaybackMode, setIsPlaybackMode] = useState(false)
  const playback = usePlayback()
  const [showArweavePanel, setShowArweavePanel] = useState(false)

  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Historical data tracking for live graphs
  const [speedHistory, setSpeedHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [altitudeHistory, setAltitudeHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [emergencyHistory, setEmergencyHistory] = useState<{ time: number; count: number }[]>([])
  const [signalHistory, setSignalHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [aircraftImages, setAircraftImages] = useState<{ [key: string]: string }>({})

  const { settings, updateSettings, isLoaded } = useSettings()
  const [showSettings, setShowSettings] = useState(false)

  // Check wallet connection status
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (arweaveSnapshot.isWalletConnected()) {
        setWalletConnected(true)
        const address = await arweaveSnapshot.getWalletAddress()
        setWalletAddress(address)
      } else {
        setWalletConnected(false)
        setWalletAddress(null)
      }
    }

    checkWalletConnection()

    // Check wallet connection when panel opens/closes
    if (showArweavePanel) {
      checkWalletConnection()
    }
  }, [showArweavePanel])

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Calculate visible aircraft on map and active signals with rate
  useEffect(() => {
    // Aircraft visible on map (have valid coordinates)
    const visible = aircraft.filter((a) => a.lat && a.lon && !isNaN(a.lat) && !isNaN(a.lon)).length
    setVisibleAircraft(visible)

    // Aircraft actively receiving signals with rate calculation
    const activeWithRate = aircraft.filter((a) => {
      const hasRecentData = a.messages && a.messages > 0
      const hasMovement = a.gs && a.gs > 0
      const hasAltitude = a.alt_baro && a.alt_baro > 0
      const hasValidPosition = a.lat && a.lon
      const isRecent = !a.seen || a.seen < 30 // Less than 30 seconds since last seen
      return (hasRecentData || hasMovement || hasAltitude || hasValidPosition) && isRecent
    })

    // Calculate total message rate (messages per second)
    const totalMessages = aircraft.reduce((sum, a) => sum + (a.messages || 0), 0)
    const avgMessageRate = aircraft.length > 0 ? (totalMessages / aircraft.length).toFixed(1) : "0"

    setActiveSignals(activeWithRate.length)
    setMessageRate(avgMessageRate)
  }, [aircraft])

  // Track historical data for graphs
  useEffect(() => {
    const now = Date.now()

    if (stats.fastest) {
      setSpeedHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.fastest.gs || 0,
          aircraft: stats.fastest.flight || stats.fastest.hex,
        }
        const updated = [...prev, newEntry].slice(-20) // Keep last 20 data points
        return updated
      })
    }

    if (stats.highest) {
      setAltitudeHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.highest.alt_baro || 0,
          aircraft: stats.highest.flight || stats.highest.hex,
        }
        const updated = [...prev, newEntry].slice(-20)
        return updated
      })
    }

    const emergencyCount = aircraft.filter((a) => a.emergency && a.emergency !== "none").length
    setEmergencyHistory((prev) => {
      const newEntry = { time: now, count: emergencyCount }
      const updated = [...prev, newEntry].slice(-20)
      return updated
    })

    if (stats.mostMessages) {
      setSignalHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.mostMessages.messages || 0,
          aircraft: stats.mostMessages.flight || stats.mostMessages.hex,
        }
        const updated = [...prev, newEntry].slice(-20)
        return updated
      })
    }
  }, [stats])

  // Fetch aircraft images for record holders
  useEffect(() => {
    const fetchImages = async () => {
      const recordAircraft = [stats.fastest, stats.highest, stats.emergency, stats.mostMessages].filter(Boolean)

      for (const aircraft of recordAircraft) {
        if (aircraft && aircraft.hex && !aircraftImages[aircraft.hex]) {
          try {
            const response = await fetch(`https://api.planespotters.net/pub/photos/hex/${aircraft.hex}`)
            if (response.ok) {
              const data = await response.json()
              if (data.photos && data.photos.length > 0) {
                setAircraftImages((prev) => ({
                  ...prev,
                  [aircraft.hex]: data.photos[0].thumbnail_large.src,
                }))
              }
            }
          } catch (error) {
            console.error("Failed to fetch aircraft image:", error)
          }
        }
      }
    }

    fetchImages()
  }, [stats])

  const handleFlightSelect = (flight: any) => {
    const registration = flight.r || (flight.hex ? registration_from_hexid(flight.hex) : null)

    const flightData: SelectedFlight = {
      id: flight.hex,
      callsign: flight.flight || flight.hex,
      aircraft: flight.t || flight.category || "Unknown",
      altitude: flight.alt_baro || 0,
      speed: Math.round(flight.gs || 0),
      heading: Math.round(flight.track || 0),
      lat: flight.lat || 0,
      lng: flight.lon || 0,
      squawk: flight.squawk || "N/A",
      status: flight.emergency && flight.emergency !== "none" ? "Emergency" : "En Route",
      registration: registration,
      hex: flight.hex,
      type: flight.t || flight.category || "Unknown",
    }
    setSelectedFlight(flightData)
  }

  const handleModeChange = (mode: "live" | "playback") => {
    setIsPlaybackMode(mode === "playback")
    if (mode === "playback") {
      playback.stop() // Reset playback when switching to playback mode
      // Auto-start playback after a short delay to allow data loading
      setTimeout(() => {
        if (playback.canStartPlayback) {
          playback.play()
        }
      }, 1000)
    }
  }

  const handleFullscreenChange = (isFullscreen: boolean) => {
    setIsMapFullscreen(isFullscreen)
  }

  // Add this useEffect to handle settings changes that affect the map
  useEffect(() => {
    console.log("Settings changed in main component:", settings)

    // Store settings globally for other components to access
    if (typeof window !== "undefined") {
      window.currentSettings = settings
    }

    // Apply glassmorphism effects
    const elements = document.querySelectorAll(".backdrop-blur-xl, .backdrop-blur-sm")
    elements.forEach((element) => {
      if (settings.glassmorphism) {
        element.classList.add("backdrop-blur-xl")
        element.classList.remove("bg-slate-900/90")
      } else {
        element.classList.remove("backdrop-blur-xl")
        element.classList.add("bg-slate-900/90")
      }
    })

    // Apply animation speed
    document.documentElement.style.setProperty("--animation-speed", `${settings.animationSpeed}ms`)

    // Force map update if settings changed
    if (window.updateMapMarkers) {
      setTimeout(() => {
        console.log("Triggering map update from main component")
        window.updateMapMarkers()
      }, 100)
    }
  }, [settings])

  // Auto-start playback when switching to playback mode and data is ready
  useEffect(() => {
    if (isPlaybackMode && playback.canStartPlayback && !playback.isPlaying && playback.currentIndex === 0) {
      console.log("🎬 Auto-starting playback...")
      playback.play()
    }
  }, [isPlaybackMode, playback.canStartPlayback, playback.isPlaying, playback.currentIndex])

  // Update the settings loading check
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative">
        {/* Lightweight settings loader overlay */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-lg p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm text-slate-300">Initializing settings...</span>
            </div>
          </div>
        </div>

        {/* Show skeleton/placeholder content behind */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 opacity-30">
          {/* Skeleton header */}
          <div className="h-16 bg-slate-800/50 rounded-lg animate-pulse"></div>

          {/* Skeleton stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse"></div>
            ))}
          </div>

          {/* Skeleton map */}
          <div className="h-96 bg-slate-800/50 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (isMapFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950">
        <AircraftMap
          aircraft={isPlaybackMode ? playback.getCurrentAircraft() : aircraft}
          isLoading={isPlaybackMode ? playback.isLoading : isLoading}
          settings={settings}
          onFullscreenChange={handleFullscreenChange}
          isFullscreen={true}
          isPlaybackMode={isPlaybackMode}
          onModeChange={handleModeChange}
          playbackState={playback}
          onPlay={playback.play}
          onPause={playback.pause}
          onStop={playback.stop}
          onSeekTo={playback.seekTo}
          onSetSpeed={playback.setSpeed}
          onNext={playback.nextSnapshot}
          onPrevious={playback.previousSnapshot}
          onReload={playback.reload}
          onLoadMore={playback.loadMoreSnapshots}
          onChangeRange={playback.changeRange}
          isMobile={isMobile}
          enableLocation={settings.enableLocation} // Add this prop
        />

        {/* Fullscreen Playback Controls - Always visible in fullscreen */}
        {isPlaybackMode && (
          <>
            {/* Desktop Fullscreen Playback Controls */}
            {!isMobile && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[10000] w-full max-w-md px-4">
                <PlaybackControls
                  playbackState={playback}
                  onPlay={playback.play}
                  onPause={playback.pause}
                  onStop={playback.stop}
                  onSeekTo={playback.seekTo}
                  onSetSpeed={playback.setSpeed}
                  onNext={playback.nextSnapshot}
                  onPrevious={playback.previousSnapshot}
                  onReload={playback.reload}
                  onLoadMore={playback.loadMoreSnapshots}
                  onChangeRange={playback.changeRange}
                />
              </div>
            )}

            {/* Mobile Fullscreen Playback Controls */}
            {isMobile && (
              <MobilePlaybackControls
                playbackState={playback}
                onPlay={playback.play}
                onPause={playback.pause}
                onStop={playback.stop}
                onSeekTo={playback.seekTo}
                onSetSpeed={playback.setSpeed}
                onNext={playback.nextSnapshot}
                onPrevious={playback.previousSnapshot}
                onReload={playback.reload}
                onLoadMore={playback.loadMoreSnapshots}
                onChangeRange={playback.changeRange}
              />
            )}
          </>
        )}
      </div>
    )
  }

  const emergencyCount = aircraft.filter((a) => a.emergency && a.emergency !== "none").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Selected Flight Info Panel */}
      {selectedFlight && <AircraftInfoPanel selectedFlight={selectedFlight} onClose={() => setSelectedFlight(null)} />}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          lastUpdate={lastUpdate}
          totalAircraft={stats.totalAircraft}
          onSettingsClick={() => setShowSettings(true)}
          onArweaveClick={() => setShowArweavePanel(true)}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          isPlaybackMode={isPlaybackMode}
        />
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <AppHeader
          lastUpdate={lastUpdate}
          onSettingsClick={() => setShowSettings(true)}
          onArweaveClick={() => setShowArweavePanel(true)}
          isPlaybackMode={isPlaybackMode}
          onModeChange={handleModeChange}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
        />
      )}

      {/* Main Content */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 ${isMobile ? "pt-20" : ""} ${isPlaybackMode && isMobile ? "pb-32" : ""}`}
      >
        {/* Stats Overview - Placeholder during playback */}
        {isPlaybackMode ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-900/30 border-slate-800/50 backdrop-blur-xl rounded-lg p-3 sm:p-4 opacity-50"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-slate-600/20 rounded-lg backdrop-blur-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-600 rounded"></div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-slate-500">--</div>
                    <div className="text-xs sm:text-sm text-slate-600">Disabled</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-span-2 lg:col-span-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                Live data disabled during historical playback
              </div>
            </div>
          </div>
        ) : (
          <StatsOverview
            totalAircraft={stats.totalAircraft}
            visibleAircraft={visibleAircraft}
            emergencyCount={emergencyCount}
            activeSignals={activeSignals}
            messageRate={messageRate}
            isPlaybackMode={isPlaybackMode}
          />
        )}

        {/* Main Content Grid */}
        <div className={`grid ${isPlaybackMode ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-4"} gap-6`}>
          {/* Map - Full width during playback */}
          <div className={isPlaybackMode ? "col-span-1" : "xl:col-span-3 h-fit"}>
            <AircraftMap
              aircraft={isPlaybackMode ? playback.getCurrentAircraft() : aircraft}
              isLoading={isPlaybackMode ? playback.isLoading : isLoading}
              settings={settings}
              onFullscreenChange={handleFullscreenChange}
              isPlaybackMode={isPlaybackMode}
              onModeChange={handleModeChange}
              playbackState={playback}
              onPlay={playback.play}
              onPause={playback.pause}
              onStop={playback.stop}
              onSeekTo={playback.seekTo}
              onSetSpeed={playback.setSpeed}
              onNext={playback.nextSnapshot}
              onPrevious={playback.previousSnapshot}
              onReload={playback.reload}
              onLoadMore={playback.loadMoreSnapshots}
              onChangeRange={playback.changeRange}
              isMobile={isMobile}
              enableLocation={settings.enableLocation} // Add this prop
            />
          </div>

          {/* Live Records - Placeholder during playback */}
          {isPlaybackMode ? (
            <div className="bg-slate-900/30 border-slate-800/50 backdrop-blur-xl rounded-lg h-fit opacity-50">
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-600 rounded"></div>
                  <span className="text-slate-500">Historical Records</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-600/20 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                    Disabled
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                        Record #{i}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-slate-600">--</div>
                        <div className="text-sm text-slate-600">Disabled</div>
                      </div>
                      <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <LiveRecords
                stats={stats}
                isPlaybackMode={isPlaybackMode}
                aircraftImages={aircraftImages}
                speedHistory={speedHistory}
                altitudeHistory={altitudeHistory}
                emergencyHistory={emergencyHistory}
                signalHistory={signalHistory}
                activeSignals={activeSignals}
                messageRate={messageRate}
              />
            </>
          )}
        </div>

        {/* Bottom Grid - Placeholders during playback */}
        {isPlaybackMode ? (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isMobile ? "hidden" : ""}`}>
            {/* Active Flights Placeholder */}
            <div className="lg:col-span-2 bg-slate-900/30 border-slate-800/50 backdrop-blur-xl rounded-lg opacity-50">
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-600 rounded"></div>
                  <span className="text-slate-500">Historical Flights</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-600/20 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                    Disabled
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg border bg-slate-800/30 border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-600">Flight #{i}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-slate-600">Alt: --</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Speed: --</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Squawk: --</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Type: --</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Alerts Placeholder */}
            <div className="bg-slate-900/30 border-slate-800/50 backdrop-blur-xl rounded-lg opacity-50">
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-600 rounded"></div>
                  <span className="text-slate-500">System Alerts</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-600/20 px-2 py-1 rounded-full">
                    Disabled
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-center py-8 text-slate-600">
                  <div className="w-8 h-8 mx-auto mb-2 bg-slate-600 rounded opacity-50"></div>
                  <div>Alerts disabled during playback</div>
                  <div className="text-xs mt-1">Historical mode active</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isMobile && isPlaybackMode ? "hidden" : ""}`}>
            <ActiveFlights
              aircraft={aircraft}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onFlightSelect={handleFlightSelect}
              isPlaybackMode={isPlaybackMode}
            />
            <SystemAlerts alerts={alerts} />
          </div>
        )}

        {/* Data Uploads Section - Full width after Active Flights */}
        {!isPlaybackMode && (
          <div className={`${isMobile && isPlaybackMode ? "hidden" : ""}`}>
            <DataUploadsSection />
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={updateSettings}
        />
      )}

      {/* Mobile Playback Controls - Only show when NOT in fullscreen */}
      {isMobile && isPlaybackMode && !isMapFullscreen && (
        <MobilePlaybackControls
          playbackState={playback}
          onPlay={playback.play}
          onPause={playback.pause}
          onStop={playback.stop}
          onSeekTo={playback.seekTo}
          onSetSpeed={playback.setSpeed}
          onNext={playback.nextSnapshot}
          onPrevious={playback.previousSnapshot}
          onReload={playback.reload}
          onLoadMore={playback.loadMoreSnapshots}
          onChangeRange={playback.changeRange}
        />
      )}

      {/* Arweave Snapshot Panel - Works on both mobile and desktop */}
      {showArweavePanel && (
        <ArweaveSnapshotPanel
          aircraftData={isPlaybackMode ? playback.getCurrentAircraft() : aircraft}
          isVisible={showArweavePanel}
          onClose={() => setShowArweavePanel(false)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
