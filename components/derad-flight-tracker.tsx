"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from "react"
import { useAircraftData } from "@/hooks/use-aircraft-data"
import { AircraftInfoPanel } from "./aircraft-info-panel"
import { registration_from_hexid } from "@/lib/registration-lookup"
import { MobileNav } from "./mobile-nav"
import { SystemAlerts } from "./system-alerts"
import { AppHeader } from "./app-header"
import type { SelectedFlight } from "@/types/aircraft"
import { isCapacitor } from "@/lib/capacitor-utils"
import { MobileBottomNav, type MobileTab } from "./mobile-bottom-nav"
import { PullToRefresh } from "./pull-to-refresh"
import { HomeTabContent, FlightsTabContent, MapTabContent } from "./memoized-tab-content"
import { SplashScreen } from "./splash-screen"
import { App } from "@capacitor/app"
import { StatusBar, Style } from "@capacitor/status-bar"
import { FlightFilterSheet, type FlightFilters } from "./flight-filter-sheet"
import { MiniAppsView } from "./mini-apps-view"

// Lazy load heavy components
const AircraftCharts = lazy(() => import("./aircraft-charts"))

const DEFAULT_FILTERS: FlightFilters = {
  minAltitude: 0,
  maxAltitude: 50000,
  minSpeed: 0,
  maxSpeed: 700,
  showEmergency: true,
  showMilitary: true,
  showCommercial: true,
}

export default function DeradFlightTracker() {
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("home")

  // Optimized: 2 second updates reduce CPU by 50% with minimal UX impact
  const { aircraft, stats, alerts, refresh } = useAircraftData(2000)
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FlightFilters>(DEFAULT_FILTERS)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const lastUpdateRef = useRef(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeStartY, setSwipeStartY] = useState(0)
  const [highlightedAircraftHex, setHighlightedAircraftHex] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  const [miniAppIcon, setMiniAppIcon] = useState<string | null>(null)
  const [miniAppAutoOpen, setMiniAppAutoOpen] = useState<{ id: string; query?: { callsign?: string; icao?: string } } | undefined>(undefined)

  // Reset mini app icon when switching away from miniapps tab
  useEffect(() => {
    if (activeMobileTab !== "miniapps" && miniAppIcon) {
      setMiniAppIcon(null)
    }
  }, [activeMobileTab, miniAppIcon])

  // Clear mini app auto-open after it's been used
  useEffect(() => {
    if (activeMobileTab === "miniapps" && miniAppAutoOpen) {
      // Clear after a short delay to ensure the MiniAppsView has received the prop
      const timer = setTimeout(() => {
        setMiniAppAutoOpen(undefined)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeMobileTab, miniAppAutoOpen])

  // Handle query in SkyQuery - switch to miniapps tab and open with params
  const handleQueryInSkyQuery = useCallback((callsign: string, icao: string) => {
    setMiniAppAutoOpen({ id: 'icao-data-loader', query: { callsign, icao } })
    setActiveMobileTab('miniapps')
  }, [])

  // Historical data tracking for live graphs
  const [speedHistory, setSpeedHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [altitudeHistory, setAltitudeHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [emergencyHistory, setEmergencyHistory] = useState<{ time: number; count: number }[]>([])
  const [signalHistory, setSignalHistory] = useState<{ time: number; value: number; aircraft: string }[]>([])
  const [aircraftImages, setAircraftImages] = useState<{ [key: string]: string }>({})
  const aircraftImagesRef = useRef<{ [key: string]: string }>({})

  // Check if mobile and native app on mount and orientation change
  useEffect(() => {
    const checkPlatform = () => {
      try {
        // Enhanced mobile detection for foldable devices
        // Google Pixel 9 Pro Fold: unfolded is 2076x2152, folded is 1080x2152
        // Treat as mobile if:
        // 1. Width < 768 (traditional mobile breakpoint)
        // 2. Running on Capacitor (native app) - always treat as mobile for native apps
        // 3. Touch device with tall aspect ratio (height > width * 1.5)
        const isCapacitorApp = isCapacitor()

        // For native apps, always use mobile mode regardless of screen size
        if (isCapacitorApp) {
          setIsMobile(true)
          setIsNativeApp(true)
          return
        }

        // For web, use traditional detection with foldable support
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        const width = window.innerWidth
        const height = window.innerHeight
        const aspectRatio = height / width
        const isPortraitTall = aspectRatio > 1.5

        // Consider mobile if width < 768 OR (touch device AND tall portrait)
        const mobile = width < 768 || (isTouchDevice && isPortraitTall)

        setIsMobile(mobile)
        setIsNativeApp(false)
      } catch (error) {
        console.error('Error in platform detection:', error)
        // Fallback to safe defaults
        setIsMobile(window.innerWidth < 768)
        setIsNativeApp(false)
      }
    }

    checkPlatform()
    window.addEventListener("resize", checkPlatform)
    window.addEventListener("orientationchange", checkPlatform)
    return () => {
      window.removeEventListener("resize", checkPlatform)
      window.removeEventListener("orientationchange", checkPlatform)
    }
  }, [])

  // Android back button handling for native navigation feel
  useEffect(() => {
    if (!isNativeApp) return

    let backHandler: any = null

    App.addListener('backButton', ({ canGoBack }) => {
      // Priority 1: Close aircraft info panel if open
      if (selectedFlight) {
        setSelectedFlight(null)
        return
      }

      // Priority 2: Return to home tab if on another tab
      if (activeMobileTab !== 'home') {
        setActiveMobileTab('home')
        return
      }

      // Priority 3: Exit app only if on home tab and can't go back
      if (!canGoBack) {
        App.exitApp()
      }
    }).then(handle => {
      backHandler = handle
    })

    return () => {
      if (backHandler) {
        backHandler.remove()
      }
    }
  }, [isNativeApp, selectedFlight, activeMobileTab])

  // Dynamic StatusBar management based on active tab
  useEffect(() => {
    if (!isNativeApp) return

    const updateStatusBar = async () => {
      try {
        // Always use dark style (light text) since our app has dark backgrounds
        await StatusBar.setStyle({ style: Style.Dark })

        // Set background color based on active tab for a seamless look
        const colors: Record<MobileTab, string> = {
          home: '#0f172a',      // slate-950 - matches home gradient
          flights: '#1e293b',   // slate-800 - matches flights list
          miniapps: '#0f172a',  // slate-950 - matches mini apps background
          map: '#020617',       // slate-950 - darker for map
          charts: '#0f172a',    // slate-950 - matches charts background
          stats: '#0f172a',     // slate-950 - matches stats background
        }

        await StatusBar.setBackgroundColor({ color: colors[activeMobileTab] })
      } catch (error) {
        // Silently fail if StatusBar not available
      }
    }

    updateStatusBar()
  }, [isNativeApp, activeMobileTab])

  // Swipe gesture handling for tab switching (iOS-style)
  useEffect(() => {
    if (!isNativeApp || !isMobile) return

    const tabs: MobileTab[] = ["flights", "miniapps", "home", "map", "charts"]

    const handleTouchStart = (e: TouchEvent) => {
      // Disable swipe gestures when touching the map
      const target = e.target as HTMLElement
      if (target.closest('#aircraft-map-container') ||
          target.closest('.leaflet-container')) {
        return
      }

      setSwipeStartX(e.touches[0].clientX)
      setSwipeStartY(e.touches[0].clientY)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // Disable swipe gestures when touching the map
      const target = e.target as HTMLElement
      if (target.closest('#aircraft-map-container') ||
          target.closest('.leaflet-container')) {
        return
      }

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const diffX = swipeStartX - touchEndX
      const diffY = Math.abs(swipeStartY - touchEndY)

      // Only handle horizontal swipes (ignore vertical)
      if (Math.abs(diffX) > 50 && diffY < 100) {
        const currentIndex = tabs.indexOf(activeMobileTab)

        if (diffX > 0 && currentIndex < tabs.length - 1) {
          setActiveMobileTab(tabs[currentIndex + 1])
        } else if (diffX < 0 && currentIndex > 0) {
          setActiveMobileTab(tabs[currentIndex - 1])
        }
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isNativeApp, isMobile, activeMobileTab, swipeStartX, swipeStartY])

  // Update lastUpdate ref without causing re-render
  useEffect(() => {
    const interval = setInterval(() => {
      lastUpdateRef.current = new Date()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Check if filters are active (different from defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.minAltitude !== DEFAULT_FILTERS.minAltitude ||
      filters.maxAltitude !== DEFAULT_FILTERS.maxAltitude ||
      filters.minSpeed !== DEFAULT_FILTERS.minSpeed ||
      filters.maxSpeed !== DEFAULT_FILTERS.maxSpeed ||
      !filters.showEmergency ||
      !filters.showMilitary ||
      !filters.showCommercial
    )
  }, [filters])

  // Filter aircraft based on filter criteria - memoized for performance
  const filteredAircraft = useMemo(() => {
    if (!hasActiveFilters) return aircraft

    return aircraft.filter((a) => {
      // Altitude filter
      const altitude = a.alt_baro || 0
      if (altitude < filters.minAltitude || altitude > filters.maxAltitude) return false

      // Speed filter
      const speed = a.gs || 0
      if (speed < filters.minSpeed || speed > filters.maxSpeed) return false

      // Emergency filter
      const hasEmergency = a.emergency && a.emergency !== "none"
      if (hasEmergency && !filters.showEmergency) return false

      // Military filter (basic detection - military often has specific hex codes)
      const isMilitary = a.category && (a.category.includes("MIL") || a.hex?.startsWith("ae"))
      if (isMilitary && !filters.showMilitary) return false

      // Commercial filter (has flight number and not military)
      const isCommercial = a.flight && a.flight.trim() !== "" && !isMilitary
      if (isCommercial && !filters.showCommercial) return false

      return true
    })
  }, [aircraft, filters, hasActiveFilters])

  // Calculate active signals with rate - memoized for performance (no state, just computation)
  const activeSignals = useMemo(() => {
    return aircraft.filter((a) => {
      const hasRecentData = a.messages && a.messages > 0
      const hasMovement = a.gs && a.gs > 0
      const hasAltitude = a.alt_baro && a.alt_baro > 0
      const hasValidPosition = a.lat && a.lon
      const isRecent = !a.seen || a.seen < 30
      return (hasRecentData || hasMovement || hasAltitude || hasValidPosition) && isRecent
    }).length
  }, [aircraft])

  const messageRate = useMemo(() => {
    const totalMessages = aircraft.reduce((sum, a) => sum + (a.messages || 0), 0)
    return aircraft.length > 0 ? (totalMessages / aircraft.length).toFixed(1) : "0"
  }, [aircraft])

  // Memoize emergency count calculation
  const emergencyCount = useMemo(() => {
    return aircraft.filter((a) => a.emergency && a.emergency !== "none").length
  }, [aircraft])

  // Track historical data for graphs - only when needed for performance
  // Use refs to batch updates and reduce re-renders
  const lastHistoryUpdate = useRef(0)
  const HISTORY_UPDATE_INTERVAL = 2000 // Update every 2 seconds instead of every data fetch

  useEffect(() => {
    if (isNativeApp && isMobile && activeMobileTab !== "home") return

    const now = Date.now()
    // Throttle history updates to reduce re-renders
    if (now - lastHistoryUpdate.current < HISTORY_UPDATE_INTERVAL) return
    lastHistoryUpdate.current = now

    // Batch all state updates together to reduce re-renders
    if (stats.fastest) {
      setSpeedHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.fastest!.gs || 0,
          aircraft: stats.fastest!.flight || stats.fastest!.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }

    if (stats.highest) {
      setAltitudeHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.highest!.alt_baro || 0,
          aircraft: stats.highest!.flight || stats.highest!.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }

    setEmergencyHistory((prev) => {
      const newEntry = { time: now, count: emergencyCount }
      return [...prev, newEntry].slice(-20)
    })

    if (stats.mostMessages) {
      setSignalHistory((prev) => {
        const newEntry = {
          time: now,
          value: stats.mostMessages!.messages || 0,
          aircraft: stats.mostMessages!.flight || stats.mostMessages!.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }
  }, [stats, isNativeApp, isMobile, activeMobileTab, emergencyCount])

  // Keep ref in sync with state
  useEffect(() => {
    aircraftImagesRef.current = aircraftImages
  }, [aircraftImages])

  // Fetch aircraft images for record holders - only when on home tab
  useEffect(() => {
    if (isNativeApp && isMobile && activeMobileTab !== "home") return

    const fetchImages = async () => {
      const recordAircraft = [stats.fastest, stats.highest, stats.emergency, stats.mostMessages].filter(Boolean)

      for (const aircraft of recordAircraft) {
        if (aircraft && aircraft.hex && !aircraftImagesRef.current[aircraft.hex]) {
          try {
            const response = await fetch(`https://api.planespotters.net/pub/photos/hex/${aircraft.hex}`)
            if (response.ok) {
              const data = await response.json()
              if (data.photos && data.photos.length > 0) {
                const imageUrl = data.photos[0].thumbnail_large.src
                setAircraftImages((prev) => ({
                  ...prev,
                  [aircraft.hex]: imageUrl,
                }))
                aircraftImagesRef.current[aircraft.hex] = imageUrl
              }
            }
          } catch (error) {
            console.error("Failed to fetch aircraft image:", error)
          }
        }
      }
    }

    fetchImages()
  }, [stats.fastest?.hex, stats.highest?.hex, stats.emergency?.hex, stats.mostMessages?.hex, isNativeApp, isMobile, activeMobileTab])

  const handleFlightSelect = useCallback((flight: any) => {
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
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {!showSplash && (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
          {selectedFlight && (
            <AircraftInfoPanel
              selectedFlight={selectedFlight}
              onClose={() => setSelectedFlight(null)}
              onShowOnMap={(hex: string) => {
                setHighlightedAircraftHex(hex)
                setActiveMobileTab("map")
                setSelectedFlight(null) // Close the panel
              }}
            />
          )}

      {isMobile && (
        <MobileNav
          lastUpdate={lastUpdateRef.current}
          totalAircraft={stats.totalAircraft}
          isNativeApp={isNativeApp}
        />
      )}

      {!isMobile && (
        <AppHeader
          lastUpdate={lastUpdateRef.current}
          isNativeApp={isNativeApp}
        />
      )}

      <PullToRefresh onRefresh={refresh} enabled={isMobile && isNativeApp}>
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 ${isMobile && isNativeApp ? "pt-24 pb-24" : isMobile ? "pt-32 pb-6" : "py-6"}`}
      >
        {((isMobile && isNativeApp && activeMobileTab === "home") || !isNativeApp || !isMobile) && (
          <HomeTabContent
            stats={stats}
            emergencyCount={emergencyCount}
            activeSignals={activeSignals}
            messageRate={messageRate}
            aircraftImages={aircraftImages}
            speedHistory={speedHistory}
            altitudeHistory={altitudeHistory}
            emergencyHistory={emergencyHistory}
            signalHistory={signalHistory}
            onShowOnMap={(hex: string) => {
              setHighlightedAircraftHex(hex)
              setActiveMobileTab("map")
            }}
            onFlightSelect={handleFlightSelect}
            isNativeApp={isNativeApp}
          />
        )}

        {/* Map Tab - Full Screen */}
        {isMobile && isNativeApp && activeMobileTab === "map" && (
          <div className="fixed inset-0 top-[60px] bottom-[64px] z-30">
            <MapTabContent
              aircraft={filteredAircraft}
              onFlightSelect={handleFlightSelect}
              highlightedHex={highlightedAircraftHex}
              onHighlightClear={() => setHighlightedAircraftHex(null)}
            />
          </div>
        )}

        {/* Mini Apps Tab - Full Screen */}
        {isMobile && isNativeApp && activeMobileTab === "miniapps" && (
          <div className="fixed inset-0 top-[60px] bottom-[64px] z-30 overflow-y-auto">
            <MiniAppsView
              isNativeApp={isNativeApp}
              onAppOpen={setMiniAppIcon}
              autoOpenApp={miniAppAutoOpen}
            />
          </div>
        )}

        <div className={`grid grid-cols-1 ${isMobile && isNativeApp ? "" : "lg:grid-cols-3"} gap-6`}>
          {((isMobile && isNativeApp && activeMobileTab === "flights") || !isNativeApp || !isMobile) && (
            <FlightsTabContent
              aircraft={filteredAircraft}
              searchTerm={searchTerm}
              onFlightSelect={handleFlightSelect}
              onShowOnMap={(hex: string) => {
                setHighlightedAircraftHex(hex)
                setActiveMobileTab("map")
              }}
              onQueryInSkyQuery={handleQueryInSkyQuery}
              isNativeApp={isNativeApp}
            />
          )}
          {!isNativeApp && !isMobile && (
            <SystemAlerts alerts={alerts} />
          )}
        </div>

        {aircraft.length > 0 && (
          <div
            className={`${isMobile && isNativeApp ? "fixed inset-0 top-0 z-30" : ""}`}
            style={{
              display: (isMobile && isNativeApp && activeMobileTab === "charts") || (!isNativeApp && !isMobile) ? "block" : "none",
              visibility: (isMobile && isNativeApp && activeMobileTab === "charts") || (!isNativeApp && !isMobile) ? "visible" : "hidden",
              contain: "strict",
            }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading charts...</div>
              </div>
            }>
              <AircraftCharts
                aircraft={aircraft}
                isNativeApp={isNativeApp}
                isMobile={isMobile}
                isVisible={(isMobile && isNativeApp && activeMobileTab === "charts") || (!isNativeApp && !isMobile)}
                onActiveChartChange={setActiveChartIndex}
              />
            </Suspense>
          </div>
        )}

      </div>
      </PullToRefresh>

      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={setActiveMobileTab}
        isNativeApp={isNativeApp}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onHomeRefresh={refresh}
        miniAppIcon={miniAppIcon}
      />

      <FlightFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />
        </div>
      )}
    </>
  )
}
