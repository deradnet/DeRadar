"use client"

import { useEffect, useRef, useState } from "react"
import { Plane, MapPin } from "lucide-react"
import type { Aircraft } from "@/types/aircraft"
import { useAdaptivePerformance } from "@/hooks/use-adaptive-performance"

interface AircraftMapProps {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
}

export function AircraftMapWebGL({ aircraft, onFlightSelect }: AircraftMapProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const { settings } = useAdaptivePerformance()

  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      if (!containerRef.current) return

      try {
        // Load dependencies
        await loadScript('/map/quadtree.js')
        await loadScript('/map/svg-to-texture.js')
        await loadScript('/map/webgl-aircraft-map.js')
        await loadStylesheet('/map/map-styles.css')

        if (!mounted) return

        // Determine device tier
        const deviceTier = settings?.tier || 'medium'

        // Initialize map
        const map = new (window as any).WebGLAircraftMap('aircraft-map-container', {
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

        // Center on user location
        setTimeout(() => {
          map.centerOnUserLocation()
        }, 500)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      mounted = false
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
      // Update visible count (estimate based on viewport)
      const tier = settings?.tier || 'medium'
      const limits = { low: 500, medium: 2000, high: 10000 }
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
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>Loading map...</span>
        </div>
      )}

      {/* Aircraft count badge */}
      {!isLoading && visibleCount > 0 && (
        <div className="map-aircraft-count">
          <Plane className="map-aircraft-count-icon" />
          <span>{visibleCount.toLocaleString()} aircraft</span>
        </div>
      )}

      {/* My location button */}
      {!isLoading && (
        <button
          onClick={handleLocationClick}
          className="map-location-btn"
          aria-label="Center on my location"
        >
          <MapPin />
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
