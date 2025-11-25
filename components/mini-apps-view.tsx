"use client"

import { useState, useEffect } from "react"
import { Grid3x3, ArrowLeft, Settings, Database, MoreVertical, X } from "lucide-react"
import { haptic } from "@/lib/haptics"
import { App } from "@capacitor/app"

interface MiniAppsViewProps {
  isNativeApp?: boolean
  onAppOpen?: (iconUrl: string | null) => void
  autoOpenApp?: { id: string; query?: { callsign?: string; icao?: string } }
}

// SkyQuery Settings Component
function SkyQuerySettings() {
  const [crossSearchEnabled, setCrossSearchEnabled] = useState(false)

  // Load setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skyquery_cross_search_enabled')
    setCrossSearchEnabled(saved === 'true')
  }, [])

  const toggleCrossSearch = async () => {
    await haptic.light()
    const newValue = !crossSearchEnabled
    setCrossSearchEnabled(newValue)
    localStorage.setItem('skyquery_cross_search_enabled', String(newValue))

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('skyquery-settings-changed', {
      detail: { crossSearchEnabled: newValue }
    }))
  }

  return (
    <div className="space-y-3">
      {/* Cross Search Setting */}
      <div className="bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl border border-slate-700/50 transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                <Database className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold mb-1.5">Cross Search</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Enable direct query button in flight list to quickly search aircraft in SkyQuery
                </p>
              </div>
            </div>

            <button
              onClick={toggleCrossSearch}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 flex-shrink-0 ${
                crossSearchEnabled
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-600'
              }`}
              aria-label="Toggle Cross Search"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-200 ${
                  crossSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
        <p className="text-xs text-blue-300/90 text-center leading-relaxed">
          ✨ Changes take effect immediately across all tabs
        </p>
      </div>
    </div>
  )
}

export function MiniAppsView({ isNativeApp = false, onAppOpen, autoOpenApp }: MiniAppsViewProps) {
  const [selectedApp, setSelectedApp] = useState<{ url: string; name: string; iconUrl?: string } | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [showSettings, setShowSettings] = useState<string | null>(null) // app id for settings

  // Define mini apps list (needed by effects below)
  const miniApps = [
    {
      id: "icao-data-loader",
      name: "SkyQuery",
      description: "Query aircraft telemetry from Arweave",
      developer: "Interconsea Inc.",
      iconUrl: "https://app-icons.deradar.app/skyquery%20(1).png",
      color: "from-blue-500 to-cyan-500",
      url: "https://skyquery.pages.dev/",
      comingSoon: false,
    },
    {
      id: "placeholder-1",
      name: "",
      description: "",
      developer: "",
      color: "from-slate-700 to-slate-600",
      comingSoon: true,
    },
    {
      id: "placeholder-2",
      name: "",
      description: "",
      developer: "",
      color: "from-slate-700 to-slate-600",
      comingSoon: true,
    },
    {
      id: "placeholder-3",
      name: "",
      description: "",
      developer: "",
      color: "from-slate-700 to-slate-600",
      comingSoon: true,
    },
    {
      id: "placeholder-4",
      name: "",
      description: "",
      developer: "",
      color: "from-slate-700 to-slate-600",
      comingSoon: true,
    },
    {
      id: "placeholder-5",
      name: "",
      description: "",
      developer: "",
      color: "from-slate-700 to-slate-600",
      comingSoon: true,
    },
  ]

  // Check if warning has been shown before
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem('miniAppsWarningShown')
    if (!hasSeenWarning) {
      setShowWarning(true)
    }
  }, [])

  const dismissWarning = async () => {
    await haptic.light()
    localStorage.setItem('miniAppsWarningShown', 'true')
    setShowWarning(false)
  }

  const openSettings = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await haptic.medium()
    setShowSettings(appId)
  }

  const closeSettings = async () => {
    await haptic.light()
    setShowSettings(null)
  }

  const openMiniApp = async (url: string, name: string, iconUrl?: string, queryParams?: { callsign?: string; icao?: string }) => {
    await haptic.medium()

    // Build URL with query parameters if provided
    let finalUrl = url
    if (queryParams) {
      const params = new URLSearchParams()
      if (queryParams.callsign) params.append('callsign', queryParams.callsign)
      if (queryParams.icao) params.append('icao', queryParams.icao)
      finalUrl = `${url}?${params.toString()}`
    }

    setSelectedApp({ url: finalUrl, name, iconUrl })
    // Notify parent component about the app icon change
    if (onAppOpen && iconUrl) {
      onAppOpen(iconUrl)
    }
  }

  const closeMiniApp = async () => {
    await haptic.light()
    setSelectedApp(null)
    // Reset the icon when closing
    if (onAppOpen) {
      onAppOpen(null)
    }
  }

  // Auto-open app with query parameters when requested
  useEffect(() => {
    if (autoOpenApp && !selectedApp) {
      const app = miniApps.find(a => a.id === autoOpenApp.id)
      if (app && app.url) {
        openMiniApp(app.url, app.name, app.iconUrl, autoOpenApp.query)
      }
    }
  }, [autoOpenApp])

  // Handle Android back button when mini app is open
  useEffect(() => {
    if (!isNativeApp || !selectedApp) return

    let backHandler: any = null

    App.addListener('backButton', () => {
      if (selectedApp) {
        closeMiniApp()
      }
    }).then(handle => {
      backHandler = handle
    })

    return () => {
      if (backHandler) {
        backHandler.remove()
      }
    }
  }, [isNativeApp, selectedApp])

  return (
    <div className={`${isNativeApp ? "h-full" : ""} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Grid3x3 className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold text-white">Mini Apps</h2>
          </div>
          <p className="text-slate-400">Aviation tools and utilities</p>
        </div>

        {/* Friendly Warning Banner - Show once */}
        {showWarning && (
          <div className="mb-6 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">About Mini Apps</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Some mini apps may be provided by third-party developers. Data quality, features, and availability may vary between apps. We verify all apps before listing them here.
                </p>
                <button
                  onClick={dismissWarning}
                  className="text-sm text-blue-400 font-medium hover:text-blue-300 active:text-blue-500 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {miniApps.map((app) => {
            return (
              <div key={app.id} className="relative">
                <button
                  disabled={app.comingSoon}
                  onClick={() => !app.comingSoon && app.url && openMiniApp(app.url, app.name, app.iconUrl)}
                  className={`w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-4 text-left transition-all duration-200 ${
                    app.comingSoon
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-slate-800/70 active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* App Icon */}
                    {app.iconUrl ? (
                      <img
                        src={app.iconUrl}
                        alt={`${app.name} icon`}
                        className="w-16 h-16 rounded-2xl shadow-lg flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-16 h-16 bg-gradient-to-br ${app.color} rounded-2xl flex-shrink-0 shadow-lg`} />
                    )}

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      {app.name ? (
                        <>
                          <h3 className="text-lg font-semibold text-white mb-0.5 truncate">{app.name}</h3>
                          <p className="text-xs text-slate-400 mb-1.5">{app.developer}</p>
                          <p className="text-sm text-slate-400">{app.description}</p>
                        </>
                      ) : (
                        <>
                          <div className="h-5 bg-slate-700/50 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-slate-700/30 rounded w-16 mb-2"></div>
                          <div className="h-4 bg-slate-700/30 rounded w-full mb-1.5"></div>
                          <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
                        </>
                      )}
                    </div>

                    {/* Settings Button - Only for SkyQuery */}
                    {app.id === "icao-data-loader" && !app.comingSoon && (
                      <button
                        onClick={(e) => openSettings(app.id, e)}
                        className="flex-shrink-0 p-2.5 bg-slate-700/50 hover:bg-slate-600/50 active:bg-slate-600/70 border border-slate-600 rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Settings"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-300" />
                      </button>
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Settings Modal for SkyQuery */}
      {showSettings === "icao-data-loader" && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
          onClick={closeSettings}
        >
          <div
            className="bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-800/98 backdrop-blur-2xl border border-slate-700/80 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                    <Settings className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">SkyQuery</h3>
                    <p className="text-xs text-slate-400">App Settings</p>
                  </div>
                </div>
                <button
                  onClick={closeSettings}
                  className="p-2 hover:bg-slate-800/50 active:bg-slate-700/50 rounded-xl transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="px-6 pb-6">
              <SkyQuerySettings />
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2">
              <div className="text-center">
                <button
                  onClick={closeSettings}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:from-cyan-700 active:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Mini App View */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          {/* Header with back button */}
          <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 z-10">
            <button
              onClick={closeMiniApp}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 active:text-blue-500 transition-colors touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-white">{selectedApp.name}</span>
            </div>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>

          {/* iframe container */}
          <iframe
            src={selectedApp.url}
            className="absolute inset-0 top-14 w-full h-[calc(100%-3.5rem)] border-0"
            allow="geolocation; microphone; camera"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      )}
    </div>
  )
}
