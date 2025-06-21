import { resolveUrl, getGatewayInfo } from "@/lib/domain-resolver"

/**
 * Application Configuration
 * Centralized configuration for all URLs, API endpoints, and important parameters
 * Update this file before deployment to customize the application
 *
 * Gateway Resolution:
 * - Use "gateway" to auto-detect from current hostname
 * - Use specific domain to override auto-detection
 *
 * Examples:
 * - Running on map.example.com → gateway resolves to example.com
 */

export const APP_CONFIG = {
  // Application Info
  app: {
    name: "DeRadar",
    version: "1.0.0",
    description: "Decentralized Radar: Real-time and historical aircraft tracking, powered by Ar.io & Arweave.",
    author: "Derad Network",
    contact: "info@derad.net",
  },

  // Deployment Configuration
  deployment: {
    environment: "production", // "development" | "staging" | "production"
    s3Bucket: "your-bucket-name",
    cloudFrontDomain: "your-domain.com",
    enableDebugMode: false,
    enableConsoleLogging: false,
  },

  // Analytics Configuration - Removed external analytics
  analytics: {
    enabled: false, // Analytics disabled
  },

  // API Endpoints and Data Sources
  api: {
    // Live aircraft data
    aircraft: {
      baseUrl: "https://antenna-1.derad.org/data/aircraft.json",
      corsProxy: "https://corsproxy.io/?url=", // Alternative: "https://api.allorigins.win/raw?url=" (can be used when cors problems happening)
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second between retries
      updateInterval: 3000, // 3 seconds between updates
    },

    // Historical data - Smart Gateway Resolution
    // Use "gateway" for auto-detection from hostname
    // Use specific domain like "derad.network" to override
    historical: {
      graphqlUrl: "https://derad.network/graphql", // Auto-detects gateway from hostname
      dataUrl: "https://derad.network", // Auto-detects gateway from hostname
      owner: "Vpu86GpNgl3H7yAPUzl8XvxdQmu3VPqJMsItF29SRB4",
      appName: "DeradNetworkBackup",
      timeout: 15000,
      retries: 3,
      retryDelay: 2000,
    },

    // Alternative: Use specific domain (no auto-detection)
    // historical: {
    //   graphqlUrl: "https://derad.network/graphql",  // Uses specific domain
    //   dataUrl: "https://derad.network",             // Uses specific domain
    //   ...
    // },

    // Aircraft images
    planespotters: {
      baseUrl: "https://api.planespotters.net/pub/photos/hex",
      timeout: 5000, // 5 seconds
      enabled: true, // Set to false to disable image fetching
    },

    // Backup data sources (if primary fails)
    // Used for testing in beta
    backup: {
      aircraft: ["https://backup-antenna-1.derad.org/data/aircraft.json", "https://backup-antenna-2.derad.net/data/aircraft.json"],
      enabled: false,
    },
  },

  // Map Configuration
  map: {
    // Default map center and zoom
    defaultCenter: {
      lat: 41.0, // Georgia region
      lng: 48.0,
    },
    defaultZoom: 6,
    minZoom: 2,
    maxZoom: 16,

    // Tile providers
    tiles: {
      dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      terrain: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS",
      },
      // Alternative tile providers
      openstreetmap: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
      },
    },

    // Leaflet CDN
    leaflet: {
      cssUrl: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      version: "1.9.4",
    },

    // Map behavior
    behavior: {
      enableZoomControl: true,
      enableFullscreen: true,
      enableLocationTracking: true,
      autoRefreshInterval: 1000, // 1 second
    },
  },

  // Aircraft Configuration
  aircraft: {
    // Emergency squawk codes
    emergencySquawks: ["7700", "7600", "7500"],

    // Alert thresholds (more realistic values)
    thresholds: {
      // Altitude thresholds
      veryLowAltitude: 500, // ft - Below this while moving is concerning
      lowAltitude: 2000, // ft - Normal for approach/departure
      highAltitude: 45000, // ft - Very high altitude

      // Speed thresholds
      lowSpeed: 50, // knots - Below this considered stationary
      normalSpeed: 150, // knots - Normal cruising speed
      highSpeed: 600, // knots - Very high speed

      // Other thresholds
      maxReasonableAltitude: 60000, // ft
      maxReasonableSpeed: 800, // knots
      staleDataThreshold: 60, // seconds - when to consider data stale
    },

    // Icon settings
    icon: {
      defaultSize: 24, // pixels
      selectedSize: 32, // pixels
      minSize: 16,
      maxSize: 48,
    },

    // Trail settings
    trail: {
      defaultLength: 20, // number of points
      maxLength: 1000,
      minLength: 5,
      colors: {
        normal: "#FFD700", // Gold
        emergency: "#FF4444", // Red
        selected: "#10B981", // Green
        highAltitude: "#3B82F6", // Blue
        lowAltitude: "#F59E0B", // Orange
      },
    },

    // Data filtering
    filtering: {
      maxAircraft: 999999, // Maximum aircraft to display
      hideGroundVehicles: false,
      hideStationary: false,
      minAltitudeFilter: 0, // ft
      maxAltitudeFilter: 60000, // ft
    },
  },

  // Playback Configuration
  playback: {
    defaultSpeed: 4, // 4x speed
    baseInterval: 1500, // 1.5 seconds between snapshots
    defaultRange: 50, // Default number of snapshots to load

    // Progressive loading settings
    earlyLoadCount: 10, // Load first 10 snapshots for immediate playback
    batchSize: 15, // Batch size for background loading
    concurrency: {
      initial: 8, // Higher concurrency for initial load
      background: 4, // Lower concurrency for background loading
      parallel: 6, // Default parallel requests
    },

    // Speed options
    speedOptions: [0.25, 0.5, 1, 2, 4, 8, 16],

    // Range options
    rangeOptions: [25, 50, 100, 200, 500],

    // Auto-play settings
    autoPlay: true,
    loopPlayback: false,
  },

  // UI Configuration
  ui: {
    // Update intervals
    intervals: {
      liveData: 3000, // 3 seconds
      mapRefresh: 1000, // 1 second
      statsUpdate: 2000, // 2 seconds
      alertCheck: 5000, // 5 seconds
    },

    // Animation settings
    animations: {
      defaultSpeed: 300, // milliseconds
      fastSpeed: 150,
      slowSpeed: 500,
      enableAnimations: true,
    },

    // Mobile breakpoints
    breakpoints: {
      mobile: 768, // pixels
      tablet: 1024,
      desktop: 1280,
      largeDesktop: 1920,
    },

    // Z-index layers
    zIndex: {
      map: 1,
      mapControls: 999,
      mapInfo: 998,
      playbackControls: 999,
      infoPanel: 1001,
      settings: 2000,
      modal: 2100,
      fullscreen: 9999,
      mobileNav: 1000,
    },

    // Theme settings
    theme: {
      defaultMapStyle: "dark", // "dark" | "satellite" | "terrain"
      enableGlassmorphism: true,
      enableBlurEffects: true,
    },
  },

  // Storage Configuration
  storage: {
    keys: {
      settings: "adsb-tracker-settings",
      playbackSpeed: "adsb-tracker-playback-speed",
      mapStyle: "adsb-tracker-map-style",
      userPreferences: "adsb-tracker-preferences",
      alertHistory: "adsb-tracker-alert-history",
    },

    // Cache settings
    cache: {
      maxAge: 3600000, // 1 hour in milliseconds
      maxSize: 100, // Maximum number of cached items
      enableCache: true,
    },
  },

  // Alert System Configuration
  alerts: {
    // Alert types and their priorities
    types: {
      emergency: {
        priority: 1,
        color: "#EF4444",
        icon: "⚠️",
        sound: true,
      },
      warning: {
        priority: 2,
        color: "#F59E0B",
        icon: "⚡",
        sound: false,
      },
      info: {
        priority: 3,
        color: "#3B82F6",
        icon: "ℹ️",
        sound: false,
      },
    },

    // Alert thresholds
    thresholds: {
      emergencySquawks: ["7700", "7600", "7500"],
      veryLowAltitude: 500, // ft
      veryHighSpeed: 600, // knots
      veryHighAltitude: 50000, // ft
      noPositionTimeout: 300, // seconds
    },

    // Alert behavior
    behavior: {
      maxAlerts: 50, // Maximum alerts to keep
      autoExpire: true,
      expireTime: 300000, // 5 minutes
      enableSound: false,
      enableNotifications: false,
    },
  },

  // Feature Flags
  features: {
    enablePlayback: true,
    enableLocation: true,
    enableAlerts: true,
    enableSettings: true,
    enableFullscreen: true,
    enableMobileControls: true,
    enableImageFetch: true,
    enableRegistrationLookup: true,
    enableAnalytics: true,
    enableOfflineMode: false,
    enableExport: false,
    enableSharing: false,
  },

  // Performance Configuration
  performance: {
    // Rendering limits
    maxAircraft: 999999,
    maxTrailPoints: 100,
    maxAlerts: 50,

    // Debounce delays
    debounce: {
      search: 300, // milliseconds
      settings: 500,
      resize: 250,
      mapUpdate: 100,
    },

    // Throttle delays
    throttle: {
      scroll: 16, // ~60fps
      mapUpdate: 100,
      dataUpdate: 1000,
    },

    // Memory management
    memory: {
      maxHistoryEntries: 1000,
      cleanupInterval: 60000, // 1 minute
      enableCleanup: true,
    },
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    enableErrorReporting: true,
    enableFallbacks: true,
    showUserFriendlyErrors: true,
  },

  // Security Configuration
  security: {
    enableCSP: true,
    allowedDomains: ["*"], // Allow all domains
    enableCORS: true,
  },
} as const

// Type definitions for better TypeScript support
export type AppConfig = typeof APP_CONFIG
export type MapTileProvider = keyof typeof APP_CONFIG.map.tiles
export type PlaybackSpeed = (typeof APP_CONFIG.playback.speedOptions)[number]
export type PlaybackRange = (typeof APP_CONFIG.playback.rangeOptions)[number]
export type AlertType = keyof typeof APP_CONFIG.alerts.types

// Helper functions for common config access
export const getApiUrl = (endpoint: keyof typeof APP_CONFIG.api) => {
  return APP_CONFIG.api[endpoint]
}

export const getMapTileConfig = (provider: MapTileProvider) => {
  return APP_CONFIG.map.tiles[provider]
}

export const isFeatureEnabled = (feature: keyof typeof APP_CONFIG.features) => {
  return APP_CONFIG.features[feature]
}

export const getStorageKey = (key: keyof typeof APP_CONFIG.storage.keys) => {
  return APP_CONFIG.storage.keys[key]
}

export const getAlertConfig = (type: AlertType) => {
  return APP_CONFIG.alerts.types[type]
}

export const getThreshold = (category: string, threshold: string) => {
  const config = APP_CONFIG as any
  return config[category]?.thresholds?.[threshold] || config.aircraft?.thresholds?.[threshold]
}

// Environment-specific configuration
export const getConfig = () => {
  const config = { ...APP_CONFIG }

  // Override based on deployment environment
  switch (config.deployment.environment) {
    case "development":
      config.deployment.enableDebugMode = true
      config.deployment.enableConsoleLogging = true
      config.api.aircraft.updateInterval = 5000 // Slower updates in dev
      break

    case "staging":
      config.deployment.enableDebugMode = true
      config.deployment.enableConsoleLogging = true
      break

    case "production":
      config.deployment.enableDebugMode = false
      config.deployment.enableConsoleLogging = false
      break
  }

  return config
}

// Quick deployment configuration presets
export const DEPLOYMENT_PRESETS = {
  // For high-traffic production deployment
  production: {
    api: {
      aircraft: { updateInterval: 2000, timeout: 8000 },
      historical: { timeout: 12000 },
    },
    performance: {
      maxAircraft: 500,
      debounce: { mapUpdate: 50 },
    },
  },

  // For demo/showcase deployment
  demo: {
    api: {
      aircraft: { updateInterval: 5000 },
    },
    features: {
      enablePlayback: true,
      enableLocation: false, // Disable location for demo
    },
  },

  // For development/testing
  development: {
    deployment: { enableDebugMode: true, enableConsoleLogging: true },
    api: { aircraft: { updateInterval: 10000 } },
  },
} as const

// Smart gateway resolution helper
export const resolveApiUrls = async () => {
  const config = getConfig()
  return {
    graphqlUrl: await resolveUrl(config.api.historical.graphqlUrl),
    dataUrl: await resolveUrl(config.api.historical.dataUrl),
  }
}

// Get current gateway info for debugging
export const getGatewayDebugInfo = () => {
  return getGatewayInfo()
}

export default APP_CONFIG
