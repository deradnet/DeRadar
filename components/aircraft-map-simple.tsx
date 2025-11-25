"use client"

import { useEffect, useRef, useState } from "react"
import { Plane, MapPin } from "lucide-react"
import type { Aircraft } from "@/types/aircraft"
import { useAdaptivePerformance } from "@/hooks/use-adaptive-performance"

interface AircraftMapProps {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
}

export function AircraftMapSimple({ aircraft, onFlightSelect }: AircraftMapProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const { settings } = useAdaptivePerformance()
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      if (!containerRef.current) return

      try {
        // Wait for Leaflet to be available
        let attempts = 0
        while (typeof (window as any).L === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (typeof (window as any).L === 'undefined') {
          throw new Error('Leaflet failed to load')
        }

        // Load map styles and script
        await loadStylesheet('/map/map-styles.css')
        await loadScript('/map/simple-aircraft-map.js')

        if (!mounted) return

        // Determine device tier
        const deviceTier = settings?.tier || 'medium'

        // Initialize map
        const map = new (window as any).SimpleAircraftMap('aircraft-map-container', {
          deviceTier,
          onAircraftClick: (aircraft: Aircraft) => {
            onFlightSelect(aircraft)
            // Haptic feedback on mobile
            if ((window as any).Capacitor?.Plugins?.Haptics) {
              (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' })
            }
          },
        })

        mapRef.current = map
        setIsLoading(false)

        // Center on user location after a short delay
        setTimeout(() => {
          if (map && !map.isDestroyed) {
            map.centerOnUserLocation()
          }
        }, 500)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      mounted = false
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [settings?.tier])

  // Update aircraft data
  useEffect(() => {
    if (mapRef.current && aircraft.length > 0) {
      mapRef.current.updateAircraftData(aircraft)

      // Update visible count
      const tier = settings?.tier || 'medium'
      const limits = { low: 500, medium: 2000, high: 5000 }
      setVisibleCount(Math.min(aircraft.length, limits[tier as keyof typeof limits]))
    }
  }, [aircraft, settings?.tier])

  const handleLocationClick = () => {
    if (mapRef.current) {
      mapRef.current.centerOnUserLocation()
      // Haptic feedback
      if ((window as any).Capacitor?.Plugins?.Haptics) {
        (window as any).Capacitor.Plugins.Haptics.impact({ style: 'medium' })
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950">
      {/* Map container */}
      <div id="aircraft-map-container" className="w-full h-full" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-slate-900/90 backdrop-blur-md px-8 py-5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-slate-300 text-sm font-medium">Loading map...</span>
          </div>
        </div>
      )}

      {/* Aircraft count badge */}
      {!isLoading && visibleCount > 0 && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-400" />
            <span className="text-slate-200 text-xs font-semibold">{visibleCount.toLocaleString()} aircraft</span>
          </div>
        </div>
      )}

      {/* My location button */}
      {!isLoading && (
        <button
          onClick={handleLocationClick}
          className="absolute bottom-20 right-3 z-[1000] w-11 h-11 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-lg flex items-center justify-center shadow-lg hover:bg-slate-700/90 active:scale-95 transition-all"
          aria-label="Center on my location"
        >
          <MapPin className="w-5 h-5 text-slate-200" />
        </button>
      )}
    </div>
  )
}

// Helper function to load external scripts
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

// Helper function to load external stylesheets
function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`))
    document.head.appendChild(link)
  })
}
