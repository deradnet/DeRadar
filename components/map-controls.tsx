"use client"

import { Button } from "@/components/ui/button"
import { Navigation, RefreshCw, Maximize, Minimize, NavigationOff, Loader2, X, Cloud } from "lucide-react"

interface MapControlsProps {
  onRefresh: () => void
  onFullscreen: () => void
  isFullscreen: boolean
  onLocationRequest?: () => void
  onLocationDisable?: () => void
  locationPermission?: "granted" | "denied" | "prompt" | "unknown"
  userLocation?: { lat: number; lng: number } | null
  isLocationLoading?: boolean
  onWeatherToggle?: () => void
  showWeather?: boolean
  isPlaybackMode?: boolean
}

export function MapControls({
  onRefresh,
  onFullscreen,
  isFullscreen,
  onLocationRequest,
  onLocationDisable,
  locationPermission = "unknown",
  userLocation,
  isLocationLoading = false,
  onWeatherToggle,
  showWeather = false,
  isPlaybackMode = false,
}: MapControlsProps) {
  const handleZoomIn = () => {
    if (typeof window !== "undefined" && window.map) {
      window.map.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (typeof window !== "undefined" && window.map) {
      window.map.zoomOut()
    }
  }

  const getLocationButtonProps = () => {
    if (isLocationLoading) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        title: "Getting location...",
        className: "bg-blue-600/90 border-blue-500/50 text-white hover:bg-blue-500/90 backdrop-blur-xl p-2",
        disabled: true,
      }
    }

    if (userLocation) {
      return {
        icon: <X className="w-4 h-4" />,
        title: "Disable location tracking",
        className: "bg-green-600/90 border-green-500/50 text-white hover:bg-red-600/90 backdrop-blur-xl p-2",
        onClick: onLocationDisable,
      }
    }

    switch (locationPermission) {
      case "granted":
        return {
          icon: <Navigation className="w-4 h-4" />,
          title: "Get current location",
          className: "bg-green-600/90 border-green-500/50 text-white hover:bg-green-500/90 backdrop-blur-xl p-2",
          onClick: onLocationRequest,
        }
      case "denied":
        return {
          icon: <NavigationOff className="w-4 h-4" />,
          title: "Location access blocked - click for instructions",
          className: "bg-red-600/90 border-red-500/50 text-white hover:bg-red-500/90 backdrop-blur-xl p-2",
          onClick: onLocationRequest,
        }
      case "prompt":
      case "unknown":
      default:
        return {
          icon: <Navigation className="w-4 h-4" />,
          title: "Enable location to show nearest aircraft",
          className: "bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90 backdrop-blur-xl p-2",
          onClick: onLocationRequest,
        }
    }
  }

  const locationButtonProps = getLocationButtonProps()

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
      <Button
        size="sm"
        className="bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90 backdrop-blur-xl"
        onClick={handleZoomIn}
      >
        +
      </Button>
      <Button
        size="sm"
        className="bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90 backdrop-blur-xl"
        onClick={handleZoomOut}
      >
        -
      </Button>
      {onWeatherToggle && (
        <Button
          size="sm"
          className={`${
            isPlaybackMode
              ? "bg-slate-700/50 border-slate-600/30 text-slate-500 cursor-not-allowed"
              : showWeather
                ? "bg-blue-600/90 border-blue-500/50 text-white hover:bg-blue-500/90"
                : "bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90"
          } backdrop-blur-xl p-2`}
          onClick={onWeatherToggle}
          disabled={isPlaybackMode}
          title={
            isPlaybackMode
              ? "Weather layers not available in playback mode"
              : showWeather
                ? "Hide weather overlay"
                : "Show weather overlay"
          }
        >
          <Cloud className="w-4 h-4" />
        </Button>
      )}
      {onLocationRequest && (
        <Button
          size="sm"
          className={locationButtonProps.className}
          onClick={locationButtonProps.onClick}
          title={locationButtonProps.title}
          disabled={locationButtonProps.disabled}
        >
          {locationButtonProps.icon}
        </Button>
      )}
      <Button
        size="sm"
        className="bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90 backdrop-blur-xl p-2"
        onClick={onRefresh}
        title="Refresh markers"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        className="bg-slate-800/90 border-slate-600/50 text-white hover:bg-slate-700/90 backdrop-blur-xl p-2"
        onClick={onFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </Button>
    </div>
  )
}
