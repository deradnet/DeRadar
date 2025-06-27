"use client"

import { useState, useEffect } from "react"
import type { UserSettings } from "@/components/settings-panel"

// Static configuration for S3 deployment
const SETTINGS_CONFIG = {
  aircraft: {
    trail: {
      defaultLength: 20,
    },
    icon: {
      defaultSize: 24,
    },
  },
  ui: {
    intervals: {
      liveData: 3000,
    },
    animations: {
      defaultSpeed: 300,
    },
  },
  performance: {
    maxAircraft: 999999,
  },
  map: {
    tiles: {
      dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      terrain: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      },
    },
  },
}

const defaultSettings: UserSettings = {
  mapStyle: "dark",
  showTrails: false, // high cpu usage when enabled
  trailLength: SETTINGS_CONFIG.aircraft.trail.defaultLength,
  showAltitudeLabels: false,
  showSpeedLabels: false,
  enableSounds: false,
  alertEmergency: true,
  alertLowAltitude: false,
  autoCenter: false,
  updateInterval: SETTINGS_CONFIG.ui.intervals.liveData,
  maxAircraft: SETTINGS_CONFIG.performance.maxAircraft,
  filterByAltitude: false,
  minAltitude: 0,
  maxAltitude: 50000,
  glassmorphism: true,
  animationSpeed: SETTINGS_CONFIG.ui.animations.defaultSpeed,
  enableLocation: true, // Add this line to match the UI default
  enableExperimentalFeatures: false,
  // Experimental features defaults
  experimentalHeatmap: false,
  experimentalPredictivePath: false,
  experimentalAdvancedFilters: false,
  experimentalPerformanceMode: false,
  experimentalWeatherOverlay: false,
  experimentalAIInsights: false,
  experimentalClusterMode: false,
  experimentalVoiceAlerts: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("adsb-tracker-settings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem("adsb-tracker-settings", JSON.stringify(newSettings))
      console.log("Settings saved:", newSettings)
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  // Apply basic styling
  useEffect(() => {
    if (!isLoaded) return

    // Set dark theme by default
    document.documentElement.classList.add("dark")
    document.body.style.backgroundColor = "#0f172a"
    document.body.style.color = "#ffffff"

    // Force re-render of components by updating CSS custom properties
    document.documentElement.style.setProperty("--theme-updated", Date.now().toString())
  }, [isLoaded])

  // Apply map theme changes
  useEffect(() => {
    if (!isLoaded) return

    console.log("Map style changed to:", settings.mapStyle)

    // Store the map style globally so the map component can access it
    if (typeof window !== "undefined") {
      window.currentMapStyle = settings.mapStyle

      // If map exists, update it immediately
      if (window.map && window.L) {
        updateMapTiles(window.map, window.L)
      }
    }
  }, [settings.mapStyle, isLoaded])

  const updateMapTiles = (map: any, L: any) => {
    if (!map || !L) return

    console.log("Updating map tiles to:", settings.mapStyle)

    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    const tileConfig = SETTINGS_CONFIG.map.tiles[settings.mapStyle as keyof typeof SETTINGS_CONFIG.map.tiles]

    // Add new tile layer
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18,
    }).addTo(map)

    console.log("Map tiles updated successfully")
  }

  // Apply aircraft settings
  useEffect(() => {
    if (!isLoaded) return

    console.log("Updating aircraft settings:", {
      showTrails: settings.showTrails,
      trailLength: settings.trailLength,
    })

    // Store settings globally for map access
    if (typeof window !== "undefined") {
      window.currentSettings = settings

      // Trigger map marker update if map exists
      if (window.updateMapMarkers) {
        setTimeout(() => {
          console.log("Triggering map markers update with new settings")
          window.updateMapMarkers()
        }, 100)
      }
    }
  }, [settings, isLoaded])

  // Apply glassmorphism effects
  useEffect(() => {
    if (!isLoaded) return

    console.log("Applying glassmorphism:", settings.glassmorphism)

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
  }, [settings.glassmorphism, settings.animationSpeed, isLoaded])

  return {
    settings,
    updateSettings,
    isLoaded,
  }
}
