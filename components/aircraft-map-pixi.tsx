"use client"

import { useEffect, useRef, useState } from "react"
import { Plane, MapPin } from "lucide-react"
import type { Aircraft } from "@/types/aircraft"
import { useAdaptivePerformance } from "@/hooks/use-adaptive-performance"
import { createAircraftIcon } from "@/lib/aircraft-icons"

interface AircraftMapProps {
  aircraft: Aircraft[]
  onFlightSelect: (flight: Aircraft) => void
}

export function AircraftMapPixi({ aircraft, onFlightSelect }: AircraftMapProps) {
  const mapRef = useRef<any>(null)
  const pixiAppRef = useRef<any>(null)
  const spritesRef = useRef<Map<string, any>>(new Map())
  const texturesRef = useRef<Map<string, any>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const pixiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const { settings } = useAdaptivePerformance()

  // Initialize map and Pixi
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!containerRef.current) return

      try {
        // Wait for Leaflet
        let attempts = 0
        while (typeof (window as any).L === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (typeof (window as any).L === 'undefined') {
          throw new Error('Leaflet failed to load')
        }

        const L = (window as any).L

        // Load map styles
        await loadStylesheet('/map/map-styles.css')

        // Dynamic import Pixi.js
        const PIXI = await import('pixi.js')
        pixiRef.current = PIXI

        // Initialize Leaflet map
        const map = L.map('aircraft-map-container', {
          center: [40, -95],
          zoom: 4,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          minZoom: 2,
          subdomains: 'abcd',
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        mapRef.current = map

        // Initialize Pixi.js overlay
        const mapContainer = map.getContainer()
        const pixiApp = new PIXI.Application()

        await pixiApp.init({
          width: mapContainer.clientWidth,
          height: mapContainer.clientHeight,
          backgroundAlpha: 0,
          antialias: false,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })

        // Add Pixi canvas to map
        const pane = map.getPanes().overlayPane
        pane.appendChild(pixiApp.canvas)
        pixiApp.canvas.style.position = 'absolute'
        pixiApp.canvas.style.top = '0'
        pixiApp.canvas.style.left = '0'
        pixiApp.canvas.style.pointerEvents = 'auto'

        pixiAppRef.current = pixiApp

        // Create aircraft container
        const aircraftContainer = new PIXI.Container()
        aircraftContainer.eventMode = 'static'
        pixiApp.stage.addChild(aircraftContainer)

        // Handle map move/zoom
        const updateProjection = () => {
          if (!pixiAppRef.current || !mapRef.current) return

          spritesRef.current.forEach((sprite, hex) => {
            if (sprite.aircraftData) {
              const point = mapRef.current.latLngToContainerPoint([
                sprite.aircraftData.lat,
                sprite.aircraftData.lon
              ])
              sprite.x = point.x
              sprite.y = point.y
            }
          })
        }

        map.on('move', updateProjection)
        map.on('zoom', updateProjection)

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          if (pixiAppRef.current && mapContainer) {
            pixiAppRef.current.renderer.resize(
              mapContainer.clientWidth,
              mapContainer.clientHeight
            )
          }
        })
        resizeObserver.observe(mapContainer)

        if (!mounted) return

        setIsLoading(false)

        // Center on user location
        setTimeout(() => {
          centerOnUserLocation()
        }, 500)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false

      // Cleanup
      spritesRef.current.forEach(sprite => sprite.destroy())
      spritesRef.current.clear()
      texturesRef.current.forEach(texture => texture.destroy())
      texturesRef.current.clear()

      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true)
        pixiAppRef.current = null
      }

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Create texture from SVG icon
  const createTexture = async (aircraft: Aircraft, isSelected: boolean): Promise<any> => {
    const PIXI = pixiRef.current
    if (!PIXI) return null

    const key = getTextureKey(aircraft, isSelected)

    if (texturesRef.current.has(key)) {
      return texturesRef.current.get(key)
    }

    try {
      // Get SVG from our existing icon function - WITHOUT rotation (we'll handle that in sprite)
      const aircraftWithoutRotation = { ...aircraft, track: 0 }
      const svgString = createAircraftIcon(aircraftWithoutRotation, isSelected)

      // Create an Image element from SVG
      const img = new Image()
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      // Create canvas and draw the image
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      ctx.drawImage(img, 0, 0, 32, 32)

      // Create Pixi texture from canvas
      const texture = PIXI.Texture.from(canvas)
      texturesRef.current.set(key, texture)

      // Clean up
      URL.revokeObjectURL(url)

      return texture
    } catch (error) {
      console.error('Failed to create texture for key:', key, error)
      return null
    }
  }

  const getTextureKey = (aircraft: Aircraft, isSelected: boolean): string => {
    const type = aircraft.t || aircraft.category || 'unknown'
    const emergency = aircraft.emergency && aircraft.emergency !== 'none'
    const onGround = (aircraft.alt_baro || 0) < 100
    const highAlt = (aircraft.alt_baro || 0) > 35000
    const highSpeed = (aircraft.gs || 0) > 400

    let state = 'default'
    if (isSelected) state = 'selected'
    else if (emergency) state = 'emergency'
    else if (onGround) state = 'ground'
    else if (highAlt) state = 'high'
    else if (highSpeed) state = 'fast'

    return `${type}-${state}`
  }

  // Update aircraft on map
  useEffect(() => {
    let mounted = true

    const updateAircraft = async () => {
      if (!mounted) return
      if (!mapRef.current || !pixiAppRef.current || !pixiRef.current || aircraft.length === 0) {
        return
      }

      const PIXI = pixiRef.current
      const container = pixiAppRef.current.stage.children[0]
      if (!container || !mounted) {
        return
      }

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

        if (!mounted) return

        setVisibleCount(visibleAircraft.length)

        const currentHexes = new Set(visibleAircraft.map((a: Aircraft) => a.hex))

        // Update/create sprites
        let createdCount = 0
        let updatedCount = 0

        for (const ac of visibleAircraft) {
          if (!mounted) break

          const hex = ac.hex
          const isSelected = hex === selectedHex

          let sprite = spritesRef.current.get(hex)

          if (!sprite) {
            // Create new sprite
            const texture = await createTexture(ac, isSelected)
            if (!texture || !mounted) continue

            sprite = new PIXI.Sprite(texture)
            sprite.anchor.set(0.5)
            sprite.eventMode = 'static'
            sprite.cursor = 'pointer'

            // Capture aircraft data for closure
            const capturedAc = ac
            const capturedHex = hex

            sprite.on('pointerdown', () => {
              if (!mounted) return
              setSelectedHex(capturedHex)
              onFlightSelect(capturedAc)

              // Haptic feedback
              if ((window as any).Capacitor?.Plugins?.Haptics) {
                (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' })
              }
            })

            if (!mounted) break
            container.addChild(sprite)
            spritesRef.current.set(hex, sprite)
            createdCount++
          } else {
            updatedCount++
          }

          if (!mounted) break

          // Update sprite properties
          sprite.aircraftData = ac

          // Update position
          const point = mapRef.current.latLngToContainerPoint([ac.lat, ac.lon])
          sprite.x = point.x
          sprite.y = point.y

          // Update rotation
          if (ac.track !== undefined) {
            sprite.angle = ac.track
          }

          // Update scale based on zoom
          const zoom = mapRef.current.getZoom()
          const scale = Math.max(0.4, Math.min(1.2, zoom / 10))
          sprite.scale.set(scale)

          // Update texture if selection changed
          const newKey = getTextureKey(ac, isSelected)
          const currentKey = getTextureKey(ac, sprite.isSelected || false)
          if (newKey !== currentKey) {
            const newTexture = await createTexture(ac, isSelected)
            if (newTexture && mounted) {
              sprite.texture = newTexture
              sprite.isSelected = isSelected
            }
          }

          sprite.visible = true
        }

        if (!mounted) return

        // Hide sprites outside viewport
        spritesRef.current.forEach((sprite, hex) => {
          if (!currentHexes.has(hex)) {
            sprite.visible = false
          }
        })
      } catch (error) {
        console.error('Error updating aircraft on map:', error)
      }
    }

    updateAircraft()

    return () => {
      mounted = false
    }
  }, [aircraft, selectedHex, onFlightSelect])

  const centerOnUserLocation = () => {
    if ((window as any).Capacitor?.Plugins?.Geolocation) {
      (window as any).Capacitor.Plugins.Geolocation.getCurrentPosition()
        .then((position: any) => {
          mapRef.current?.setView(
            [position.coords.latitude, position.coords.longitude],
            8
          )
        })
        .catch((error: any) => console.error('Geolocation error:', error))
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.setView(
            [position.coords.latitude, position.coords.longitude],
            8
          )
        },
        (error) => console.error('Geolocation error:', error)
      )
    }
  }

  const handleLocationClick = () => {
    centerOnUserLocation()

    if ((window as any).Capacitor?.Plugins?.Haptics) {
      (window as any).Capacitor.Plugins.Haptics.impact({ style: 'medium' })
    }
  }

  // Helper function to load external stylesheets
  const loadStylesheet = (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
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
            <span className="text-slate-200 text-xs font-semibold">
              {visibleCount.toLocaleString()} of {aircraft.length.toLocaleString()} aircraft
            </span>
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
