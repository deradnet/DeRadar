"use client"

import { useEffect, useRef, useState } from "react"
import type { Aircraft } from "@/types/aircraft"
import { createAircraftIcon } from "@/lib/aircraft-icons"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export type MapTileStyle = "dark" | "satellite" | "terrain"

interface AircraftMapProps {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
  highlightedHex?: string | null
  onHighlightClear?: () => void
  tileStyle?: MapTileStyle
}

const TILE_LAYERS: Record<MapTileStyle, { url: string; attribution: string; maxZoom?: number; subdomains?: string[] }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: ['a', 'b', 'c', 'd']
  },
  satellite: {
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '© Google',
    maxZoom: 20,
    subdomains: ['0', '1', '2', '3']
  },
  terrain: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c']
  }
}

export function AircraftMapLeaflet({ aircraft, onFlightSelect, highlightedHex, onHighlightClear, tileStyle = "dark" }: AircraftMapProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const highlightCircleRef = useRef<any>(null)
  const updateMarkersRef = useRef<(() => void) | null>(null)
  const cacheRef = useRef<Cache | null>(null) // Pre-opened cache for faster access
  const tileLayerRef = useRef<any>(null) // Reference to current tile layer
  const initialTileStyleRef = useRef<MapTileStyle>(tileStyle) // Track initial tile style

  // Initialize map
  useEffect(() => {
    mountedRef.current = true

    const initMap = async () => {
      if (!containerRef.current) return

      try {
        if (!mountedRef.current) return

        // Pre-open cache in background (non-blocking)
        if ('caches' in window) {
          const cacheName = 'deradar-map-tiles-v1'
          caches.open(cacheName).then(cache => {
            cacheRef.current = cache
          }).catch(() => {
            // Cache not available - tiles will load without caching
          })
        }

        // Initialize Leaflet map immediately (don't wait for cache)
        const map = L.map('aircraft-map-container', {
          center: [50.0, 10.0], // Europe center
          zoom: 5,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          // Enable immediate tile loading during pan/zoom
          fadeAnimation: false, // Disable fade for instant display
          zoomAnimation: true,
          markerZoomAnimation: true,
        })

        // Add tiles with selected style
        const layerConfig = TILE_LAYERS[tileStyle]
        const tileLayer = L.tileLayer(layerConfig.url, {
          maxZoom: layerConfig.maxZoom || 18,
          minZoom: 2,
          subdomains: layerConfig.subdomains,
          crossOrigin: true,
          updateWhenIdle: false, // Load tiles during panning, not after
          updateWhenZooming: true, // Load tiles during zoom
          keepBuffer: 2, // Keep 2 tile rows/cols as buffer for smooth panning
          updateInterval: 150, // Update tiles every 150ms during pan (faster response)
          attribution: layerConfig.attribution,
        })

        // Override tile loading to use fast cache (non-blocking)
        const originalCreateTile = (tileLayer as any)._createTile
        ;(tileLayer as any)._createTile = function() {
          const tile = originalCreateTile.call(this)
          const originalSrc = tile.src

          // Non-blocking cache check - don't wait, tile loads normally
          if (cacheRef.current) {
            cacheRef.current.match(originalSrc).then(response => {
              if (response) {
                // Fast path: Replace tile source with cached version
                response.blob().then(blob => {
                  const cachedUrl = URL.createObjectURL(blob)
                  // Only replace if tile hasn't loaded yet or failed
                  if (!tile.complete || tile.naturalWidth === 0) {
                    tile.src = cachedUrl
                  }
                })
              } else {
                // Cache miss: Let tile load normally, then cache it for next time
                tile.addEventListener('load', () => {
                  if (cacheRef.current) {
                    fetch(originalSrc).then(fetchResponse => {
                      if (fetchResponse.ok) {
                        cacheRef.current!.put(originalSrc, fetchResponse.clone())
                      }
                    }).catch(() => {
                      // Silently fail - caching is optional
                    })
                  }
                }, { once: true })
              }
            }).catch(() => {
              // Cache check failed - tile will load normally
            })
          }

          return tile
        }

        tileLayer.addTo(map)
        tileLayerRef.current = tileLayer

        // Preload tiles for zoom levels 2-4 (world to continent view)
        if (cacheRef.current) {
          const preloadTiles = async () => {
            if (!cacheRef.current) return

            // Preload low zoom tiles (world view)
            const tilesToPreload: string[] = []
            const subdomains = ['a', 'b', 'c', 'd']

            // Zoom level 2-4 for world to continent view
            for (let z = 2; z <= 4; z++) {
              const numTiles = Math.pow(2, z)
              for (let x = 0; x < numTiles; x++) {
                for (let y = 0; y < numTiles; y++) {
                  const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)]
                  tilesToPreload.push(`https://${subdomain}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`)
                }
              }
            }

            // Preload in batches to avoid overwhelming the network
            const batchSize = 20 // Increased batch size for faster preloading
            for (let i = 0; i < tilesToPreload.length; i += batchSize) {
              const batch = tilesToPreload.slice(i, i + batchSize)
              await Promise.allSettled(
                batch.map(url =>
                  fetch(url)
                    .then(response => {
                      if (response.ok && cacheRef.current) {
                        return cacheRef.current.put(url, response.clone())
                      }
                    })
                    .catch(() => {
                      // Silently fail for individual tiles
                    })
                )
              )
              // Smaller delay between batches for faster overall preload
              await new Promise(resolve => setTimeout(resolve, 50))
            }

            console.log('Map tiles preloaded and cached')
          }

          // Start preloading immediately after map is ready (non-blocking)
          setTimeout(() => {
            preloadTiles().catch(() => console.log('Tile preload completed'))
          }, 1000)
        }

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

  // Handle tile style changes
  useEffect(() => {
    // Skip if map not initialized yet
    if (!mapRef.current || !tileLayerRef.current || !mountedRef.current) {
      console.log(`Map tile switch skipped - not ready. Map: ${!!mapRef.current}, Layer: ${!!tileLayerRef.current}, Mounted: ${mountedRef.current}`)
      return
    }

    // Skip ONLY on the very first render (before any user interaction)
    // After first interaction, we need to allow switching back to the initial style
    if (tileStyle === initialTileStyleRef.current && !mapRef.current._tileSwitched) {
      console.log(`Map tile switch skipped - initial style (${tileStyle})`)
      return
    }

    const layerConfig = TILE_LAYERS[tileStyle]
    console.log(`Switching map tiles to: ${tileStyle}`, layerConfig)

    try {
      // Remove old tile layer safely
      if (mapRef.current.hasLayer(tileLayerRef.current)) {
        console.log('Removing old tile layer')
        mapRef.current.removeLayer(tileLayerRef.current)
      }

      // Add new tile layer without caching to avoid issues
      const newTileLayer = L.tileLayer(layerConfig.url, {
        maxZoom: layerConfig.maxZoom || 18,
        minZoom: 2,
        subdomains: layerConfig.subdomains,
        crossOrigin: true,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 2,
        updateInterval: 150,
        attribution: layerConfig.attribution,
      })

      console.log('Adding new tile layer')
      newTileLayer.addTo(mapRef.current)
      tileLayerRef.current = newTileLayer

      // Mark that we've switched at least once
      mapRef.current._tileSwitched = true

      console.log(`Successfully switched to ${tileStyle} tiles`)
    } catch (error) {
      console.error('Error changing tile style:', error)
    }
  }, [tileStyle])

  // Update aircraft markers with batching
  useEffect(() => {
    if (!mapRef.current || !mountedRef.current || aircraft.length === 0) return

    const performUpdate = () => {
      if (!mapRef.current || !mountedRef.current) return

      try {
        // Always get fresh bounds for accurate filtering
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

        // Batch operations for requestAnimationFrame
        const positionUpdates: Array<{ marker: any; lat: number; lon: number }> = []
        const iconUpdates: Array<{ marker: any; icon: any; isSelected: boolean }> = []
        const newMarkers: Array<{ ac: Aircraft; hex: string; isSelected: boolean }> = []

        // Collect updates
        for (const ac of visibleAircraft) {
          if (!mountedRef.current) break

          const hex = ac.hex
          const isSelected = hex === selectedHex

          let marker = markersRef.current.get(hex)

          if (!marker) {
            // Queue new marker creation
            newMarkers.push({ ac, hex, isSelected })
          } else {
            // Queue position update (lat/lon already validated by filter)
            positionUpdates.push({ marker, lat: ac.lat!, lon: ac.lon! })

            // Check if icon needs update
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
              iconUpdates.push({ marker, icon, isSelected })
            }

            marker.aircraftData = ac
          }
        }

        // Apply updates in batches using requestAnimationFrame
        requestAnimationFrame(() => {
          if (!mountedRef.current) return

          // Create new markers
          for (const { ac, hex, isSelected } of newMarkers) {
            const svgString = createAircraftIcon(ac, isSelected)
            const icon = L.divIcon({
              html: svgString,
              className: 'aircraft-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })

            const marker = L.marker([ac.lat!, ac.lon!], { icon })
              .addTo(mapRef.current)
              .on('click', () => {
                if (!mountedRef.current) return

                try {
                  setSelectedHex(hex)
                  onFlightSelect(ac)

                  // Haptic feedback
                  if ((window as any).Capacitor?.Plugins?.Haptics) {
                    (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' }).catch(() => {
                      // Silently fail if haptics not available
                    })
                  }
                } catch (error) {
                  console.error('Error handling aircraft click:', error)
                }
              });

            (marker as any).aircraftData = ac;
            (marker as any).isSelected = isSelected
            markersRef.current.set(hex, marker)
          }

          // Update positions (fast path)
          for (const { marker, lat, lon } of positionUpdates) {
            marker.setLatLng([lat, lon])
          }

          // Update icons (slower path)
          for (const { marker, icon, isSelected } of iconUpdates) {
            marker.setIcon(icon)
            marker.isSelected = isSelected
          }

          // Remove markers for aircraft no longer visible
          markersRef.current.forEach((marker, hex) => {
            if (!currentHexes.has(hex)) {
              marker.remove()
              markersRef.current.delete(hex)
            }
          })
        })
      } catch (error) {
        console.error('Error updating aircraft on map:', error)
      }
    }

    // Store update function in ref so map events can call it
    updateMarkersRef.current = performUpdate

    // Perform update immediately - batching via requestAnimationFrame provides efficiency
    performUpdate()
  }, [aircraft, selectedHex, onFlightSelect])

  // Trigger marker updates when map viewport changes (pan/zoom)
  useEffect(() => {
    if (!mapRef.current) return

    const handleMapMove = () => {
      // Call the latest update function when map moves
      if (updateMarkersRef.current) {
        updateMarkersRef.current()
      }
    }

    // Update on map movement to show/hide aircraft as viewport changes
    mapRef.current.on('moveend', handleMapMove)
    mapRef.current.on('zoomend', handleMapMove)

    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend', handleMapMove)
        mapRef.current.off('zoomend', handleMapMove)
      }
    }
  }, [])

  // Handle highlighted aircraft (zoom out, zoom in, highlight with pulsing circle)
  useEffect(() => {
    if (!highlightedHex || !mapRef.current || !mountedRef.current) return

    const highlightedAircraft = aircraft.find(a => a.hex === highlightedHex)
    if (!highlightedAircraft || !highlightedAircraft.lat || !highlightedAircraft.lon) return

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
          const circle = L.circle([targetLat!, targetLon!], {
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
