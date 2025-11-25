"use client"

import { useEffect, useRef, useState } from "react"
import type { Aircraft } from "@/types/aircraft"
import { createAircraftIcon } from "@/lib/aircraft-icons"

interface AircraftMapProps {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
  highlightedHex?: string | null
  onHighlightClear?: () => void
}

export function AircraftMapLeaflet({ aircraft, onFlightSelect, highlightedHex, onHighlightClear }: AircraftMapProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const highlightCircleRef = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    mountedRef.current = true

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

        if (!mountedRef.current) return

        const L = (window as any).L

        // Initialize Leaflet map centered on Europe
        const map = L.map('aircraft-map-container', {
          center: [50.0, 10.0], // Europe center
          zoom: 5,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
        })

        // Add dark theme tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          minZoom: 2,
          subdomains: 'abcd',
        }).addTo(map)

        mapRef.current = map
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      mountedRef.current = false
      if (mapRef.current) {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current.clear()
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update aircraft markers
  useEffect(() => {
    if (!mapRef.current || !mountedRef.current || aircraft.length === 0) return

    const L = (window as any).L
    if (!L) return

    try {
      const bounds = mapRef.current.getBounds()

      // Filter visible aircraft
      const visibleAircraft = aircraft.filter((a: Aircraft) =>
        a.lat !== undefined &&
        a.lon !== undefined &&
        a.lat !== null &&
        a.lon !== null &&
        !isNaN(a.lat) &&
        !isNaN(a.lon) &&
        bounds.contains([a.lat, a.lon])
      )

      const currentHexes = new Set(visibleAircraft.map((a: Aircraft) => a.hex))

      // Update/create markers
      for (const ac of visibleAircraft) {
        if (!mountedRef.current) break

        const hex = ac.hex
        const isSelected = hex === selectedHex

        let marker = markersRef.current.get(hex)

        if (!marker) {
          // Create SVG icon
          const svgString = createAircraftIcon(ac, isSelected)
          const icon = L.divIcon({
            html: svgString,
            className: 'aircraft-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          // Create marker
          marker = L.marker([ac.lat, ac.lon], { icon })
            .addTo(mapRef.current)
            .on('click', () => {
              if (!mountedRef.current) return
              setSelectedHex(hex)
              onFlightSelect(ac)

              // Haptic feedback
              if ((window as any).Capacitor?.Plugins?.Haptics) {
                (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' })
              }
            })

          marker.aircraftData = ac
          markersRef.current.set(hex, marker)
        } else {
          // Update existing marker
          marker.setLatLng([ac.lat, ac.lon])

          // Update icon if selection changed or aircraft properties changed
          const needsUpdate =
            marker.isSelected !== isSelected ||
            marker.aircraftData?.emergency !== ac.emergency ||
            marker.aircraftData?.alt_baro !== ac.alt_baro ||
            marker.aircraftData?.gs !== ac.gs

          if (needsUpdate) {
            const svgString = createAircraftIcon(ac, isSelected)
            const icon = L.divIcon({
              html: svgString,
              className: 'aircraft-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
            marker.setIcon(icon)
            marker.isSelected = isSelected
          }

          marker.aircraftData = ac
        }
      }

      // Remove markers for aircraft no longer visible
      markersRef.current.forEach((marker, hex) => {
        if (!currentHexes.has(hex)) {
          marker.remove()
          markersRef.current.delete(hex)
        }
      })
    } catch (error) {
      console.error('Error updating aircraft on map:', error)
    }
  }, [aircraft, selectedHex, onFlightSelect])

  // Handle highlighted aircraft (zoom out, zoom in, highlight with pulsing circle)
  useEffect(() => {
    if (!highlightedHex || !mapRef.current || !mountedRef.current) return

    const highlightedAircraft = aircraft.find(a => a.hex === highlightedHex)
    if (!highlightedAircraft || !highlightedAircraft.lat || !highlightedAircraft.lon) return

    const L = (window as any).L
    if (!L) return

    // Wait a bit for markers to be created
    const timeout = setTimeout(() => {
      if (!mapRef.current || !mountedRef.current) return

      const targetLat = highlightedAircraft.lat
      const targetLon = highlightedAircraft.lon
      const currentZoom = mapRef.current.getZoom()

      // Step 1: Zoom out
      mapRef.current.setView([targetLat, targetLon], Math.max(currentZoom - 2, 5), {
        animate: true,
        duration: 0.3,
      })

      // Step 2: Zoom in to target location after zoom out completes
      setTimeout(() => {
        if (!mapRef.current || !mountedRef.current) return

        mapRef.current.setView([targetLat, targetLon], 12, {
          animate: true,
          duration: 0.5,
        })

        // Step 3: Add pulsing circle highlight after zoom in
        setTimeout(() => {
          if (!mountedRef.current) return

          // Remove old circle if exists
          if (highlightCircleRef.current) {
            highlightCircleRef.current.remove()
            highlightCircleRef.current = null
          }

          // Create pulsing circle around the aircraft
          const circle = L.circle([targetLat, targetLon], {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 3,
            radius: 500, // 500 meters
            className: 'highlight-circle-pulse'
          }).addTo(mapRef.current)

          highlightCircleRef.current = circle

          // Also highlight the marker
          const marker = markersRef.current.get(highlightedHex)
          if (marker) {
            const element = marker.getElement()
            if (element) {
              element.classList.remove('aircraft-highlight')
              void element.offsetWidth // Trigger reflow
              element.classList.add('aircraft-highlight')
            }
          }

          // Remove circle and highlight after 5 seconds
          setTimeout(() => {
            if (highlightCircleRef.current && mountedRef.current) {
              highlightCircleRef.current.remove()
              highlightCircleRef.current = null
            }

            const marker = markersRef.current.get(highlightedHex)
            if (marker) {
              const element = marker.getElement()
              if (element) {
                element.classList.remove('aircraft-highlight')
              }
            }

            if (onHighlightClear) {
              onHighlightClear()
            }
          }, 5000)
        }, 600) // Wait for zoom in to complete
      }, 350) // Wait for zoom out to complete
    }, 200)

    return () => {
      clearTimeout(timeout)
      if (highlightCircleRef.current) {
        highlightCircleRef.current.remove()
        highlightCircleRef.current = null
      }
    }
  }, [highlightedHex, aircraft, onHighlightClear])

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
    </div>
  )
}
