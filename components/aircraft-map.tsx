"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Activity, Radar, Navigation, Plane, NavigationOff } from "lucide-react"
import { MapControls } from "./map-controls"
import { AircraftInfoPanel } from "./aircraft-info-panel"
import type { Aircraft, SelectedFlight, NearestAircraft } from "@/types/aircraft"
import { createAircraftIcon } from "@/lib/aircraft-icons"
import { registration_from_hexid } from "@/lib/registration-lookup"
import { PlaybackControls } from "./playback-controls"
import { CountryFlag } from "@/components/country-flag"
import { getCountryFromICAO } from "@/lib/icao-country-lookup"

// Static configuration for perma deploy
const MAP_CONFIG = {
  defaultCenter: { lat: 41.0, lng: 48.0 },
  defaultZoom: 6,
  maxZoom: 18,
  leaflet: {
    cssUrl: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  },
  tiles: {
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "", // work on this part later
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "", 
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: "", 
    },
  },
  aircraft: {
    trail: {
      defaultLength: 20,
      colors: {
        normal: "#3b82f6",
        emergency: "#ef4444",
      },
    },
    icon: {
      defaultSize: 24,
    },
  },
}

function getMapTileConfig(mapStyle: "dark" | "satellite" | "terrain") {
  return MAP_CONFIG.tiles[mapStyle] || MAP_CONFIG.tiles.dark
}

interface AircraftMapProps {
  aircraft: Aircraft[]
  isLoading: boolean
  settings?: any
  onFullscreenChange?: (isFullscreen: boolean) => void
  isFullscreen: boolean
  isPlaybackMode?: boolean
  onModeChange?: (mode: "live" | "playback") => void
  playbackState?: any
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onSeekTo?: (index: number) => void
  onSetSpeed?: (speed: number) => void
  onNext?: () => void
  onPrevious?: () => void
  onReload?: () => void
  onLoadMore?: () => void
  onChangeRange?: (range: number) => void
  isMobile?: boolean
  enableLocation?: boolean
}

export function AircraftMap({
  aircraft,
  isLoading,
  settings,
  onFullscreenChange,
  isFullscreen: propIsFullscreen,
  isPlaybackMode = false,
  onModeChange,
  playbackState,
  onPlay,
  onPause,
  onStop,
  onSeekTo,
  onSetSpeed,
  onNext,
  onPrevious,
  onReload,
  onLoadMore,
  onChangeRange,
  isMobile = false,
  enableLocation = true,
}: AircraftMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null)
  const [showAircraftPanel, setShowAircraftPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(propIsFullscreen || false)
  const [visibleAircraft, setVisibleAircraft] = useState(0)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearestAircraft, setNearestAircraft] = useState<NearestAircraft[]>([])
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown")
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showWeather, setShowWeather] = useState(false)
  const [weatherStateBeforePlayback, setWeatherStateBeforePlayback] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // RainViewer helper function
  const getRainviewerLayers = async (key: string) => {
    if (!isClient) return null

    try {
      const response = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
        credentials: "omit",
      })
      const jsonData = await response.json()
      return jsonData[key]
    } catch (error) {
      console.error("Failed to fetch RainViewer data:", error)
      return null
    }
  }

  // Refresh RainViewer clouds function
  const refreshRainviewerClouds = async () => {
    if (!isClient || !window.map || !window.L) return

    try {
      const latestLayer = await getRainviewerLayers("satellite")

      if (latestLayer && latestLayer.infrared && latestLayer.infrared.length > 0) {
        const latestInfrared = latestLayer.infrared[latestLayer.infrared.length - 1]

        // Remove existing weather layer
        if (window.weatherLayer) {
          window.map.removeLayer(window.weatherLayer)
        }

        // Create new weather layer with latest data
        window.weatherLayer = window.L.tileLayer(
          `https://tilecache.rainviewer.com${latestInfrared.path}/512/{z}/{x}/{y}/0/0_0.png`,
          {
            attribution: '<a href="https://www.rainviewer.com/api.html" target="_blank">RainViewer.com</a>',
            opacity: 0.5,
            zIndex: 200,
            maxZoom: 20,
          },
        )

        window.weatherLayer.addTo(window.map)
        console.log("Cloud layer refreshed with path:", latestInfrared.path)
      } else {
        console.error("No infrared satellite data available")
      }
    } catch (error) {
      console.error("Failed to refresh cloud data:", error)
    }
  }

  const handleWeatherToggle = async () => {
    if (!isClient) return

    // Prevent toggling in playback mode. will enable if i found a way to playback clouds
    if (isPlaybackMode) {
      alert(
        "Weather layers are not available in playback mode. Switch to live mode to view current weather conditions.",
      )
      return
    }

    setShowWeather(!showWeather)

    if (window.map && window.L) {
      if (!showWeather) {
        try {
          // Initial load of cloud data
          await refreshRainviewerClouds()

          // Set up auto-refresh interval (every 2 minutes)
          if (window.refreshRainviewerCloudsInterval) {
            clearInterval(window.refreshRainviewerCloudsInterval)
          }
          window.refreshRainviewerCloudsInterval = setInterval(refreshRainviewerClouds, 2 * 60 * 1000)

          console.log("Cloud layer enabled with auto-refresh")
        } catch (error) {
          console.error("Failed to load cloud data:", error)
          alert("Failed to load cloud data. Please check your internet connection.")
          setShowWeather(false)
        }
      } else {
        // Remove cloud layer and clear interval
        if (window.weatherLayer) {
          window.map.removeLayer(window.weatherLayer)
          window.weatherLayer = null
        }

        if (window.refreshRainviewerCloudsInterval) {
          clearInterval(window.refreshRainviewerCloudsInterval)
          window.refreshRainviewerCloudsInterval = null
        }

        console.log("Cloud layer disabled")
      }
    }
  }

  // Handle mode changes and weather state
  useEffect(() => {
    if (!isClient) return

    if (isPlaybackMode) {
      // Entering playback mode - save current weather state and disable clouds
      setWeatherStateBeforePlayback(showWeather)

      if (showWeather) {
        // Fade out weather layer
        if (window.map && window.weatherLayer) {
          let opacity = 0.5
          const fadeOut = setInterval(() => {
            opacity -= 0.1
            if (window.weatherLayer) {
              window.weatherLayer.setOpacity(Math.max(0, opacity))
            }
            if (opacity <= 0) {
              clearInterval(fadeOut)
              // Remove layer completely
              if (window.weatherLayer) {
                window.map.removeLayer(window.weatherLayer)
                window.weatherLayer = null
              }
              if (window.refreshRainviewerCloudsInterval) {
                clearInterval(window.refreshRainviewerCloudsInterval)
                window.refreshRainviewerCloudsInterval = null
              }
            }
          }, 50)
        }
        setShowWeather(false)
        console.log("Cloud layer faded out for playback mode")
      }
    } else {
      // Entering live mode - restore previous weather state if it was enabled
      if (weatherStateBeforePlayback && !showWeather) {
        setShowWeather(true)

        // Re-enable clouds with fade in effect
        setTimeout(async () => {
          if (window.map && window.L) {
            try {
              await refreshRainviewerClouds()

              // Fade in weather layer
              if (window.weatherLayer) {
                window.weatherLayer.setOpacity(0)
                let opacity = 0
                const fadeIn = setInterval(() => {
                  opacity += 0.1
                  if (window.weatherLayer) {
                    window.weatherLayer.setOpacity(Math.min(0.5, opacity))
                  }
                  if (opacity >= 0.5) {
                    clearInterval(fadeIn)
                  }
                }, 50)
              }

              if (window.refreshRainviewerCloudsInterval) {
                clearInterval(window.refreshRainviewerCloudsInterval)
              }
              window.refreshRainviewerCloudsInterval = setInterval(refreshRainviewerClouds, 2 * 60 * 1000)
              console.log("Cloud layer faded in for live mode")
            } catch (error) {
              console.error("Failed to restore cloud data:", error)
              setShowWeather(false)
            }
          }
        }, 200)
      }
    }
  }, [isPlaybackMode, isClient])

  // Check location permission status on mount
  useEffect(() => {
    if (!isClient) return

    const checkLocationPermission = async () => {
      if (!enableLocation) {
        setLocationPermission("denied")
        return
      }

      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" })
          setLocationPermission(permission.state)

          // Listen for permission changes
          permission.onchange = () => {
            setLocationPermission(permission.state)
          }

          // If permission is granted, automatically get location
          if (permission.state === "granted") {
            getCurrentLocation()
          }
        } catch (error) {
          console.error("Error checking location permission:", error)
          setLocationPermission("unknown")
        }
      } else {
        setLocationPermission("unknown")
      }
    }

    checkLocationPermission()
  }, [enableLocation, isClient])

  // Function to get current location
  const getCurrentLocation = () => {
    if (!isClient || !navigator.geolocation) return

    setIsLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setIsLocationLoading(false)

        if (window.map && window.L) {
          window.map.setView([latitude, longitude], 10)
          const userIcon = window.L.divIcon({
            className: "user-location-marker",
            html: `<div style="color: #10b981; font-size: 16px; text-shadow: 0 0 3px rgba(0,0,0,0.8);"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
          if (window.userMarker) {
            window.map.removeLayer(window.userMarker)
          }
          window.userMarker = window.L.marker([latitude, longitude], { icon: userIcon })
            .addTo(window.map)
            .bindPopup("Your Location (Local Only)")
        }
      },
      (error) => {
        setIsLocationLoading(false)
        console.error("Geolocation error:", error)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission("denied")
        }
      },
    )
  }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Update nearest aircraft when user location or aircraft data changes
  useEffect(() => {
    if (!isClient) return

    if (userLocation && aircraft.length > 0) {
      const aircraftWithDistance = aircraft
        .filter((a) => a.lat && a.lon)
        .map((a) => ({
          ...a,
          distance: calculateDistance(userLocation.lat, userLocation.lng, a.lat!, a.lon!),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)

      setNearestAircraft(aircraftWithDistance)
    } else {
      setNearestAircraft([])
    }
  }, [userLocation, aircraft, isClient])

  // Add this useEffect to calculate visible aircraft in current map frame
  useEffect(() => {
    if (!isClient) return

    if (window.map && aircraft.length > 0) {
      const bounds = window.map.getBounds()
      if (bounds) {
        const visible = aircraft.filter((a) => {
          if (!a.lat || !a.lon) return false
          return bounds.contains([a.lat, a.lon])
        }).length
        setVisibleAircraft(visible)
      }
    }
  }, [aircraft, isClient])

  const toggleFullscreen = () => {
    if (!isClient) return

    const newFullscreenState = !isFullscreen
    setIsFullscreen(newFullscreenState)
    if (onFullscreenChange) {
      onFullscreenChange(newFullscreenState)
    }
  }

  const handleLocationRequest = () => {
    if (!isClient) return

    if (!enableLocation) {
      alert("Location features are disabled in settings. Please enable them in the settings panel to use this feature.")
      return
    }

    if (locationPermission === "granted") {
      // If permission is already granted, just get location
      getCurrentLocation()
    } else if (locationPermission === "denied") {
      // If permission is denied, show instructions to enable it
      alert(
        "Location access is currently blocked. To enable location features:\n\n" +
          "1. Click the location icon in your browser's address bar\n" +
          "2. Select 'Allow' for location access\n" +
          "3. Refresh the page\n\n" +
          "Your location data is processed entirely locally and never sent to any server.",
      )
    } else {
      // If permission is prompt or unknown, request permission
      const confirmed = window.confirm(
        "DeRadar will access your location to show nearby aircraft. Your location data is processed entirely locally on your device and is never sent to any server or third party. Do you want to continue?",
      )

      if (confirmed) {
        getCurrentLocation()
      }
    }
  }

  const handleLocationDisable = () => {
    if (!isClient) return

    setUserLocation(null)
    setNearestAircraft([])
    if (window.map && window.userMarker) {
      window.map.removeLayer(window.userMarker)
      window.userMarker = null
    }
  }

  useEffect(() => {
    if (!isClient) return

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [isClient])

  // Map initialization useEffect - ONLY runs once or when settings change, NOT when selectedFlight changes
  useEffect(() => {
    if (!isClient) return

    let mapInstance: any = null
    const markersArray: any[] = []
    const trailsArray: any[] = []

    const initializeMap = async () => {
      if (!mapRef.current) return

      try {
        // Clear any existing map
        if (window.map) {
          window.map.remove()
          window.map = null
        }

        // Clear the container
        mapRef.current.innerHTML = ""

        // Load Leaflet dynamically
        const L = await import("leaflet")

        // Initialize map with config values
        mapInstance = L.default.map(mapRef.current, {
          center: [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng],
          zoom: MAP_CONFIG.defaultZoom,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
        })

        // Get map style from settings or global window
        const mapStyle = settings?.mapStyle || window.currentMapStyle || "dark"
        console.log("Initializing map with style:", mapStyle)

        const tileConfig = getMapTileConfig(mapStyle as any)

        L.default
          .tileLayer(tileConfig.url, {
            attribution: "", // Remove attribution
            maxZoom: MAP_CONFIG.maxZoom,
          })
          .addTo(mapInstance)

        // Store globally
        window.map = mapInstance
        window.L = L.default
        window.mapMarkers = markersArray
        window.mapTrails = trailsArray

        // Update markers function
        const updateMarkers = () => {
          console.log("Updating markers with settings:", window.currentSettings || settings)

          // Get current settings
          const currentSettings = window.currentSettings || settings || {}

          // Clear existing markers
          markersArray.forEach((marker) => {
            if (mapInstance) {
              mapInstance.removeLayer(marker)
            }
          })
          markersArray.length = 0

          // Clear existing trails
          trailsArray.forEach((trail) => {
            if (mapInstance) {
              mapInstance.removeLayer(trail)
            }
          })
          trailsArray.length = 0

          // Add aircraft markers
          const currentData = window.currentFlightData || aircraft

          currentData.forEach((flight: Aircraft) => {
            const lat = flight.lat
            const lon = flight.lon

            if (
              lat &&
              lon &&
              !isNaN(lat) &&
              !isNaN(lon) &&
              lat >= -90 &&
              lat <= 90 &&
              lon >= -180 &&
              lon <= 180 &&
              mapInstance
            ) {
              // Get current selected flight from global state
              const currentSelectedFlight = window.currentSelectedFlight
              const isSelected = currentSelectedFlight?.id === flight.hex

              // Update aircraft trail
              const trailKey = flight.hex
              if (!window.aircraftTrails) window.aircraftTrails = {}

              if (!window.aircraftTrails[trailKey]) {
                window.aircraftTrails[trailKey] = []
              }

              // Add current position to trail
              window.aircraftTrails[trailKey].push([lat, lon])

              // Keep only last N positions for trail based on settings
              const trailLength = currentSettings.trailLength || MAP_CONFIG.aircraft.trail.defaultLength
              if (window.aircraftTrails[trailKey].length > trailLength) {
                window.aircraftTrails[trailKey] = window.aircraftTrails[trailKey].slice(-trailLength)
              }

              // Draw trail if enabled OR if aircraft is selected
              if ((currentSettings.showTrails === true || isSelected) && window.aircraftTrails[trailKey].length > 2) {
                const trailColor =
                  flight.emergency && flight.emergency !== "none"
                    ? MAP_CONFIG.aircraft.trail.colors.emergency
                    : MAP_CONFIG.aircraft.trail.colors.normal
                const trail = L.default
                  .polyline(window.aircraftTrails[trailKey], {
                    color: trailColor,
                    weight: 2,
                    opacity: 0.6,
                    smoothFactor: 1,
                  })
                  .addTo(mapInstance)
                trailsArray.push(trail)
              }

              try {
                // Get icon size from settings
                const iconSize = currentSettings.aircraftIconSize || MAP_CONFIG.aircraft.icon.defaultSize

                // Create custom aircraft icon
                const aircraftIcon = L.default.divIcon({
                  className: "aircraft-marker",
                  html: createAircraftIcon(flight, isSelected),
                  iconSize: [iconSize, iconSize],
                  iconAnchor: [iconSize / 2, iconSize / 2],
                })

                // Get registration for display
                const registration = flight.r || registration_from_hexid(flight.hex)

                // Create popup content with altitude/speed labels if enabled
                const { country } = getCountryFromICAO(flight.hex)
                const popupContent = `
                  <div style="color: #fff; background: #1e293b; padding: 12px; border-radius: 6px; min-width: 220px; font-family: system-ui;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                      <img src="/flags/${flight.hex ? getCountryFromICAO(flight.hex).countryCode?.toUpperCase() || "XX" : "XX"}.svg" 
                           style="width: 16px; height: 12px; object-fit: cover; border-radius: 2px;" 
                           onerror="this.style.display='none'" />
                      ${flight.flight ? flight.flight.trim() : registration || flight.hex}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Country:</span> <span style="color: #fff; font-weight: 500;">${country}</span>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Altitude:</span> <span style="color: #fff; font-weight: 500;">${flight.alt_baro ? flight.alt_baro.toLocaleString() + " ft" : "N/A"}</span>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Speed:</span> <span style="color: #fff; font-weight: 500;">${flight.gs ? Math.round(flight.gs) + " kts" : "N/A"}</span>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Squawk:</span> <span style="color: #fff; font-weight: 500;">${flight.squawk || "N/A"}</span>
                    </div>
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Track:</span> <span style="color: #fff; font-weight: 500;">${flight.track ? Math.round(flight.track) + "°" : "N/A"}</span>
                    </div>
                    ${registration ? `<div style="margin-bottom: 6px;"><span style="color: #94a3b8;">Registration:</span> <span style="color: #10b981; font-weight: 500;">${registration}</span></div>` : ""}
                    <div style="margin-bottom: 6px;">
                      <span style="color: #94a3b8;">Type:</span> <span style="color: #fff; font-weight: 500;">${flight.t || flight.category || "N/A"}</span>
                    </div>
                    ${flight.emergency && flight.emergency !== "none" ? `<div style="color: #ef4444; font-weight: bold; margin-top: 8px; padding: 4px 8px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">⚠️ Emergency: ${flight.emergency}</div>` : ""}
                  </div>
                `

                const marker = L.default
                  .marker([lat, lon], { icon: aircraftIcon })
                  .addTo(mapInstance)
                  .bindPopup(popupContent, {
                    className: "custom-popup",
                  })
                  .on("click", () => {
                    const flightData: SelectedFlight = {
                      id: flight.hex,
                      callsign: flight.flight ? flight.flight.trim() : flight.hex,
                      aircraft: flight.t || flight.category || "Unknown",
                      altitude: flight.alt_baro || 0,
                      speed: Math.round(flight.gs || 0),
                      heading: Math.round(flight.track || 0),
                      lat: lat,
                      lng: lon,
                      squawk: flight.squawk || "N/A",
                      status: flight.emergency && flight.emergency !== "none" ? "Emergency" : "En Route",
                      registration: registration,
                      hex: flight.hex,
                      type: flight.t || flight.category || "Unknown",
                    }

                    // Store selected flight globally and trigger React state update
                    window.currentSelectedFlight = flightData
                    setSelectedFlight(flightData)
                    setShowAircraftPanel(true)
                  })

                // Add altitude/speed labels if enabled
                if (currentSettings.showAltitudeLabels && flight.alt_baro) {
                  const altLabel = L.default.divIcon({
                    className: "altitude-label",
                    html: `<div style="background: rgba(0,0,0,0.7); color: white; padding: 2px 4px; border-radius: 3px; font-size: 10px; white-space: nowrap;">${flight.alt_baro.toLocaleString()}ft</div>`,
                    iconSize: [60, 20],
                    iconAnchor: [30, -5],
                  })
                  const altMarker = L.default.marker([lat, lon], { icon: altLabel }).addTo(mapInstance)
                  markersArray.push(altMarker)
                }

                if (currentSettings.showSpeedLabels && flight.gs) {
                  const speedLabel = L.default.divIcon({
                    className: "speed-label",
                    html: `<div style="background: rgba(0,0,0,0.7); color: white; padding: 2px 4px; border-radius: 3px; font-size: 10px; white-space: nowrap;">${Math.round(flight.gs)}kts</div>`,
                    iconSize: [50, 20],
                    iconAnchor: [25, 25],
                  })
                  const speedMarker = L.default.marker([lat, lon], { icon: speedLabel }).addTo(mapInstance)
                  markersArray.push(speedMarker)
                }

                markersArray.push(marker)
              } catch (error) {
                console.error(`Error adding marker for aircraft ${flight.hex}:`, error)
              }
            }
          })

          console.log(`Updated ${markersArray.length} markers with current settings`)
        }

        // Store update function globally
        window.updateMapMarkers = updateMarkers

        // Initial marker update
        updateMarkers()
      } catch (error) {
        console.error("Failed to initialize map:", error)
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-slate-900 text-white rounded-lg">
              <div class="text-center">
                <div class="text-lg font-semibold mb-2">Map Error</div>
                <div class="text-sm text-slate-400">Failed to load map</div>
                <div class="mt-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                </div>
              </div>
            </div>
          `
        }
      }
    }

    // Initialize map with delay
    const timer = setTimeout(initializeMap, 100)

    // Cleanup
    return () => {
      clearTimeout(timer)
      if (markersArray) {
        markersArray.forEach((marker) => {
          if (mapInstance) {
            mapInstance.removeLayer(marker)
          }
        })
      }
      if (trailsArray) {
        trailsArray.forEach((trail) => {
          if (mapInstance) {
            mapInstance.removeLayer(trail)
          }
        })
      }
      if (mapInstance) {
        // Clean up weather layer and interval
        if (window.weatherLayer) {
          mapInstance.removeLayer(window.weatherLayer)
          window.weatherLayer = null
        }
        if (window.refreshRainviewerCloudsInterval) {
          clearInterval(window.refreshRainviewerCloudsInterval)
          window.refreshRainviewerCloudsInterval = null
        }
        mapInstance.remove()
        mapInstance = null
      }
      if (window.map) {
        window.map = null
      }
    }
  }, [settings, isClient])

  // Separate useEffect to handle selection changes WITHOUT reinitializing the map
  useEffect(() => {
    if (!isClient) return

    // Store selected flight globally for marker updates
    window.currentSelectedFlight = selectedFlight

    // Update markers when selection changes without reinitializing the map
    if (window.updateMapMarkers) {
      setTimeout(() => {
        window.updateMapMarkers()
      }, 50)
    }
  }, [selectedFlight, isClient])

  // Update markers when aircraft data changes
  useEffect(() => {
    if (!isClient) return

    if (window.updateMapMarkers && aircraft.length > 0) {
      window.currentFlightData = aircraft
      setTimeout(() => {
        window.updateMapMarkers()
      }, 100)
    }
  }, [aircraft, isClient])

  // Load Leaflet CSS and custom styles
  useEffect(() => {
    if (!isClient) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = MAP_CONFIG.leaflet.cssUrl
    document.head.appendChild(link)

    const style = document.createElement("style")
    style.textContent = `
      .aircraft-marker {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      .leaflet-popup-content-wrapper {
        background: #1e293b !important;
        color: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
      }
      .leaflet-popup-tip {
        background: #1e293b !important;
      }
      .leaflet-popup-close-button {
        color: #fff !important;
        font-size: 18px !important;
        padding: 4px 8px !important;
      }
      .custom-popup .leaflet-popup-content {
        margin: 0 !important;
        font-size: 18px !important;
        padding: 4px 8px !important;
      }
      .custom-popup .leaflet-popup-content {
        margin: 0 !important;
      }
      .leaflet-container {
        background: #0f172a !important;
      }
      .user-location-marker {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(style)
    }
  }, [isClient])

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    if (!isClient) return

    const handleMapClick = (e: any) => {
      // Check if the click was on the map container but not on an aircraft marker
      if (
        e.target &&
        e.target.classList &&
        !e.target.closest(".aircraft-marker") &&
        !e.target.closest(".leaflet-popup")
      ) {
        setShowAircraftPanel(false)
        setSelectedFlight(null)
        // Clear global selection
        window.currentSelectedFlight = null
      }
    }

    // Add click listener to map container
    if (mapRef.current) {
      mapRef.current.addEventListener("click", handleMapClick)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener("click", handleMapClick)
      }
    }
  }, [isClient])

  const handleRefresh = () => {
    if (!isClient) return

    if (window.updateMapMarkers) {
      window.updateMapMarkers()
    }
  }

  const handleAircraftSelect = (aircraft: NearestAircraft) => {
    if (!isClient) return

    const registration = aircraft.r || registration_from_hexid(aircraft.hex)

    const flightData: SelectedFlight = {
      id: aircraft.hex,
      callsign: aircraft.flight ? aircraft.flight.trim() : aircraft.hex,
      aircraft: aircraft.t || aircraft.category || "Unknown",
      altitude: aircraft.alt_baro || 0,
      speed: Math.round(aircraft.gs || 0),
      heading: Math.round(aircraft.track || 0),
      lat: aircraft.lat || 0,
      lng: aircraft.lon || 0,
      squawk: aircraft.squawk || "N/A",
      status: aircraft.emergency && aircraft.emergency !== "none" ? "Emergency" : "En Route",
      registration: registration,
      hex: aircraft.hex,
      type: aircraft.t || aircraft.category || "Unknown",
    }
    setSelectedFlight(flightData)
    setShowAircraftPanel(true)

    // Center map on selected aircraft
    if (window.map && aircraft.lat && aircraft.lon) {
      window.map.setView([aircraft.lat, aircraft.lon], Math.max(window.map.getZoom(), 10))
    }
  }

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Card className="xl:col-span-3 bg-slate-900/30 border-slate-800/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-white">Loading Aircraft Map...</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[600px] overflow-hidden rounded-b-lg bg-slate-900">
              <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Initializing Map...</div>
                  <div className="text-sm text-slate-400">Loading professional map interface</div>
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="xl:col-span-3 bg-slate-900/30 border-slate-800/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="text-white">{isPlaybackMode ? "Historical Aircraft Map" : "Live Aircraft Map"}</span>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 backdrop-blur-sm">
                {aircraft.length} Aircraft
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                {aircraft.filter((a) => a.r || registration_from_hexid(a.hex)).length} with Registration
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className={`relative ${isFullscreen ? "h-screen w-screen fixed inset-0 z-[9999]" : "h-[600px]"} overflow-hidden rounded-b-lg bg-slate-900`}
          >
            <div ref={mapRef} className="w-full h-full"></div>

            {/* Aircraft Info Panel */}
            {showAircraftPanel && selectedFlight && (
              <AircraftInfoPanel selectedFlight={selectedFlight} onClose={() => setShowAircraftPanel(false)} />
            )}

            {/* Map Controls */}
            <MapControls
              onRefresh={handleRefresh}
              onFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              onLocationRequest={handleLocationRequest}
              onLocationDisable={handleLocationDisable}
              locationPermission={locationPermission}
              userLocation={userLocation}
              isLocationLoading={isLocationLoading}
              onWeatherToggle={handleWeatherToggle}
              showWeather={showWeather}
              isPlaybackMode={isPlaybackMode}
            />

            {/* Mode Switch */}
            <div className="absolute top-4 left-4 z-[999]">
              <div className="bg-slate-800/90 border border-slate-600/50 rounded-lg p-2 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-white text-sm">
                  <span
                    className={`px-3 py-1 rounded cursor-pointer transition-all duration-300 ${
                      !isPlaybackMode ? "bg-green-600 shadow-lg transform scale-105" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => onModeChange?.("live")}
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Live
                    </span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded cursor-pointer transition-all duration-300 ${
                      isPlaybackMode ? "bg-purple-600 shadow-lg transform scale-105" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => onModeChange?.("playback")}
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Playback
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Playback Controls - Only show when NOT in fullscreen */}
            {isPlaybackMode && playbackState && onPlay && !isMobile && !isFullscreen && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[999] w-full max-w-md px-4">
                <PlaybackControls
                  playbackState={playbackState}
                  onPlay={onPlay}
                  onPause={onPause}
                  onStop={onStop}
                  onSeekTo={onSeekTo}
                  onSetSpeed={onSetSpeed}
                  onNext={onNext}
                  onPrevious={onPrevious}
                  onReload={onReload}
                  onLoadMore={onLoadMore}
                  onChangeRange={onChangeRange}
                />
              </div>
            )}

            {/* Info Button - Bottom left corner */}
            <div className="absolute bottom-4 left-4 z-[999]">
              <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="w-10 h-10 bg-slate-800/95 border border-slate-600/50 rounded-lg flex items-center justify-center text-white hover:bg-slate-700/95 transition-colors backdrop-blur-xl"
                title="Aircraft Status Legend"
              >
                <span className="text-sm font-bold">i</span>
              </button>
            </div>

            {/* Info Panel Modal */}
            {showInfoPanel && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1001] backdrop-blur-sm">
                <div className="bg-slate-800/95 border border-slate-600/50 rounded-lg p-6 max-w-md mx-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">Aircraft Status Legend</h3>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      <span className="text-white">Normal Flight</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                      <span className="text-white">Emergency Status</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                      <span className="text-white">High Altitude &gt;35,000 ft</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                      <span className="text-white">High Speed &gt;400 kts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span className="text-white">Ground/Low Altitude</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      <span className="text-white">Selected Aircraft</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <p className="text-xs text-slate-400 text-center">
                      Click on any aircraft marker for detailed information
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Map Info Panel */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[998] hidden sm:block">
              <div className="bg-slate-800/95 border border-slate-600/50 rounded-lg px-4 py-2 backdrop-blur-xl">
                <div className="flex items-center gap-4 text-white text-sm">
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span>{isPlaybackMode ? "Historical Playback" : "Live Tracking"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radar className="w-4 h-4 text-blue-400" />
                    <span>{visibleAircraft || aircraft.length} Aircraft in Frame</span>
                  </div>
                  {userLocation && !isPlaybackMode && (
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-green-400" />
                      <span>Location Enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading state */}
            {!window?.map && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Initializing Map...</div>
                  <div className="text-sm text-slate-400">Loading professional map interface</div>
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nearest Aircraft Panel - Only show when NOT in fullscreen AND location is enabled */}
      {!isFullscreen && enableLocation && (
        <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              {userLocation ? (
                <>
                  <Navigation className="w-5 h-5 text-green-400" />
                  <span>Nearest Aircraft to Your Location</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    Local Only
                  </Badge>
                </>
              ) : (
                <>
                  <NavigationOff className="w-5 h-5 text-slate-400" />
                  <span>Nearest Aircraft Feature</span>
                  <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                    Location Disabled
                  </Badge>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userLocation && nearestAircraft.length > 0 ? (
              // Show nearest aircraft when location is enabled and aircraft are found
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nearestAircraft.map((aircraft, index) => {
                  const registration = aircraft.r || registration_from_hexid(aircraft.hex)

                  return (
                    <div
                      key={aircraft.hex}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-all hover:border-green-500/50 group"
                      onClick={() => handleAircraftSelect(aircraft)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-1">
                            <Plane className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-400">#{index + 1} Closest</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-300 font-mono">
                            {aircraft.distance.toFixed(1)} km
                          </div>
                          <div className="text-xs text-slate-400">distance</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 font-semibold text-white text-lg group-hover:text-green-300 transition-colors">
                          <CountryFlag icao={aircraft.hex} size="sm" />
                          <span>{aircraft.flight || registration || aircraft.hex}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {aircraft.t || aircraft.category || "Unknown Type"}
                        </div>
                        {registration && <div className="text-xs text-green-400 font-mono">{registration}</div>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Altitude:</span>
                          <div className="font-mono text-white">
                            {aircraft.alt_baro ? `${aircraft.alt_baro.toLocaleString()} ft` : "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Speed:</span>
                          <div className="font-mono text-white">
                            {aircraft.gs ? `${Math.round(aircraft.gs)} kts` : "N/A"}
                          </div>
                        </div>
                      </div>

                      {aircraft.emergency && aircraft.emergency !== "none" && (
                        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm font-medium">
                          ⚠️ Emergency: {aircraft.emergency}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : userLocation && nearestAircraft.length === 0 ? (
              // Show when location is enabled but no aircraft found
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radar className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-slate-400 mb-2">No aircraft detected in your area</div>
                <div className="text-sm text-slate-500">Aircraft will appear here when they come within range</div>
              </div>
            ) : (
              // Show when location is not enabled
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <NavigationOff className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-slate-400 mb-2">Location access required</div>
                <div className="text-sm text-slate-500 mb-4">Enable location access to see aircraft nearest to you</div>
                <button
                  onClick={handleLocationRequest}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Getting Location...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Enable Location
                    </span>
                  )}
                </button>
                <div className="text-xs text-slate-500 mt-2">
                  Your location is processed locally and never sent to any server
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
