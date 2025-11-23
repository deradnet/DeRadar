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
import { HomeTabContent, FlightsTabContent } from "./memoized-tab-content"

// Lazy load heavy components
const AircraftCharts = lazy(() => import("./aircraft-charts"))

export default function DeradFlightTracker() {
  const { aircraft, stats, alerts, refresh } = useAircraftData()
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [activeSignals, setActiveSignals] = useState(0)
  const [messageRate, setMessageRate] = useState("0")
  const [isMobile, setIsMobile] = useState(false)
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("home")
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeStartY, setSwipeStartY] = useState(0)

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
      const mobile = window.innerWidth < 768
      const nativeApp = isCapacitor()
      console.log('📱 Platform check - width:', window.innerWidth, 'isMobile:', mobile, 'isNativeApp:', nativeApp)
      setIsMobile(mobile)
      setIsNativeApp(nativeApp)
    }

    checkPlatform()
    window.addEventListener("resize", checkPlatform)
    window.addEventListener("orientationchange", checkPlatform)
    return () => {
      window.removeEventListener("resize", checkPlatform)
      window.removeEventListener("orientationchange", checkPlatform)
    }
  }, [])

  // Swipe gesture handling for tab switching (iOS-style)
  useEffect(() => {
    if (!isNativeApp || !isMobile) return

    const tabs: MobileTab[] = ["flights", "home", "charts"]

    const handleTouchStart = (e: TouchEvent) => {
      setSwipeStartX(e.touches[0].clientX)
      setSwipeStartY(e.touches[0].clientY)
    }

    const handleTouchEnd = (e: TouchEvent) => {
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

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Calculate active signals with rate - memoized for performance
  const { activeCount, avgRate } = useMemo(() => {
    const activeWithRate = aircraft.filter((a) => {
      const hasRecentData = a.messages && a.messages > 0
      const hasMovement = a.gs && a.gs > 0
      const hasAltitude = a.alt_baro && a.alt_baro > 0
      const hasValidPosition = a.lat && a.lon
      const isRecent = !a.seen || a.seen < 30
      return (hasRecentData || hasMovement || hasAltitude || hasValidPosition) && isRecent
    })

    const totalMessages = aircraft.reduce((sum, a) => sum + (a.messages || 0), 0)
    const avgMessageRate = aircraft.length > 0 ? (totalMessages / aircraft.length).toFixed(1) : "0"

    return { activeCount: activeWithRate.length, avgRate: avgMessageRate }
  }, [aircraft])

  useEffect(() => {
    setActiveSignals(activeCount)
    setMessageRate(avgRate)
  }, [activeCount, avgRate])

  // Track historical data for graphs - only when needed for performance
  useEffect(() => {
    if (isNativeApp && isMobile && activeMobileTab !== "home") return

    const now = Date.now()

    if (stats.fastest) {
      const fastest = stats.fastest
      setSpeedHistory((prev) => {
        const newEntry = {
          time: now,
          value: fastest.gs || 0,
          aircraft: fastest.flight || fastest.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }

    if (stats.highest) {
      const highest = stats.highest
      setAltitudeHistory((prev) => {
        const newEntry = {
          time: now,
          value: highest.alt_baro || 0,
          aircraft: highest.flight || highest.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }

    const emergencyCount = aircraft.filter((a) => a.emergency && a.emergency !== "none").length
    setEmergencyHistory((prev) => {
      const newEntry = { time: now, count: emergencyCount }
      return [...prev, newEntry].slice(-20)
    })

    if (stats.mostMessages) {
      const mostMessages = stats.mostMessages
      setSignalHistory((prev) => {
        const newEntry = {
          time: now,
          value: mostMessages.messages || 0,
          aircraft: mostMessages.flight || mostMessages.hex,
        }
        return [...prev, newEntry].slice(-20)
      })
    }
  }, [stats, isNativeApp, isMobile, activeMobileTab, aircraft])

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


  const emergencyCount = aircraft.filter((a) => a.emergency && a.emergency !== "none").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {selectedFlight && <AircraftInfoPanel selectedFlight={selectedFlight} onClose={() => setSelectedFlight(null)} />}

      {isMobile && (
        <MobileNav
          lastUpdate={lastUpdate}
          totalAircraft={stats.totalAircraft}
          isNativeApp={isNativeApp}
        />
      )}

      {!isMobile && (
        <AppHeader
          lastUpdate={lastUpdate}
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
          />
        )}

        <div className={`grid grid-cols-1 ${isMobile && isNativeApp ? "" : "lg:grid-cols-3"} gap-6`}>
          {((isMobile && isNativeApp && activeMobileTab === "flights") || !isNativeApp || !isMobile) && (
            <FlightsTabContent
              aircraft={aircraft}
              searchTerm={searchTerm}
              onFlightSelect={handleFlightSelect}
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
        onFilterClick={() => {}}
        hasActiveFilters={false}
        onHomeRefresh={refresh}
      />
    </div>
  )
}
