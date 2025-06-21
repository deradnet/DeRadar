"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  X,
  Map,
  Plane,
  Bell,
  Eye,
  RotateCcw,
  Check,
  Navigation,
  NavigationOff,
  FlaskRoundIcon as Flask,
  Zap,
  Brain,
  Layers,
  TrendingUp,
  Globe,
  Info,
} from "lucide-react"
import { APP_CONFIG } from "@/config/app.config"

export interface UserSettings {
  mapStyle: "dark" | "satellite" | "terrain"
  showTrails: boolean
  trailLength: number
  showAltitudeLabels: boolean
  showSpeedLabels: boolean
  enableSounds: boolean
  alertEmergency: boolean
  alertLowAltitude: boolean
  autoCenter: boolean
  updateInterval: number
  maxAircraft: number
  filterByAltitude: boolean
  minAltitude: number
  maxAltitude: number
  glassmorphism: boolean
  animationSpeed: number
  enableLocation: boolean
  enableExperimentalFeatures: boolean
  // CORS settings
  customCorsProxy: string
  useCustomCorsProxy: boolean
  // Experimental features
  experimentalHeatmap: boolean
  experimentalPredictivePath: boolean
  experimentalAdvancedFilters: boolean
  experimentalPerformanceMode: boolean
  experimentalWeatherOverlay: boolean
  experimentalAIInsights: boolean
  experimentalClusterMode: boolean
  experimentalVoiceAlerts: boolean
}

const defaultSettings: UserSettings = {
  mapStyle: "dark",
  showTrails: true,
  trailLength: 20,
  showAltitudeLabels: false,
  showSpeedLabels: false,
  enableSounds: false,
  alertEmergency: true,
  alertLowAltitude: false,
  autoCenter: false,
  updateInterval: 3000,
  maxAircraft: 999999,
  filterByAltitude: false,
  minAltitude: 0,
  maxAltitude: 50000,
  glassmorphism: true,
  animationSpeed: 300,
  enableLocation: true,
  enableExperimentalFeatures: false,
  // CORS settings
  customCorsProxy: "",
  useCustomCorsProxy: false,
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

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings?: UserSettings
  onSettingsChange?: (s: UserSettings) => void
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings = defaultSettings,
  onSettingsChange = () => {},
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings)
    setHasChanges(false)
  }, [settings])

  // Debounced update function to prevent excessive re-renders
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (newSettings: UserSettings) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onSettingsChange(newSettings)
          setHasChanges(false)
        }, 500)
      }
    })(),
    [onSettingsChange],
  )

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const newSettings = { ...localSettings, [key]: value }
      setLocalSettings(newSettings)
      setHasChanges(true)

      // For immediate feedback settings, apply instantly
      if (key === "mapStyle" || key === "glassmorphism") {
        onSettingsChange(newSettings)
        setHasChanges(false)
      } else {
        debouncedUpdate(newSettings)
      }
    },
    [localSettings, debouncedUpdate, onSettingsChange],
  )

  const resetToDefaults = useCallback(() => {
    setLocalSettings(defaultSettings)
    onSettingsChange(defaultSettings)
    setHasChanges(false)
  }, [onSettingsChange])

  const applyChanges = useCallback(async () => {
    setIsSaving(true)
    try {
      onSettingsChange(localSettings)
      setHasChanges(false)
      // Small delay to show the saving state
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }, [localSettings, onSettingsChange])

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to close without saving?")
      if (!confirmed) return
    }
    onClose()
  }, [hasChanges, onClose])

  // Memoized components to prevent unnecessary re-renders
  const mapStyleSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Map className="w-4 h-4 text-green-400" />
            Map Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Map Style</label>
            <Select
              value={localSettings.mapStyle}
              onValueChange={(value: "dark" | "satellite" | "terrain") => updateSetting("mapStyle", value)}
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select map style" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 z-[2100]">
                <SelectItem value="dark" className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  Dark
                </SelectItem>
                <SelectItem value="satellite" className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  Satellite
                </SelectItem>
                <SelectItem value="terrain" className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  Terrain
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Glassmorphism Effects</label>
            <Switch
              checked={localSettings.glassmorphism}
              onCheckedChange={(checked) => updateSetting("glassmorphism", checked)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">
              Animation Speed: {localSettings.animationSpeed}ms
            </label>
            <Slider
              value={[localSettings.animationSpeed]}
              onValueChange={([value]) => updateSetting("animationSpeed", value)}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    ),
    [localSettings.mapStyle, localSettings.glassmorphism, localSettings.animationSpeed, updateSetting],
  )

  const corsSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="w-4 h-4 text-cyan-400" />
            CORS Proxy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <div className="font-medium mb-1">What is CORS?</div>
                <div>
                  CORS (Cross-Origin Resource Sharing) is a browser security feature that blocks requests to different
                  domains. We always try to fetch aircraft data directly first. Only when that fails due to CORS
                  restrictions, we automatically fall back to using a CORS proxy as a bridge.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm text-slate-300">Use Custom CORS Proxy</label>
              <span className="text-xs text-slate-500">
                Override the fallback CORS proxy service (used only when direct access fails)
              </span>
            </div>
            <Switch
              checked={localSettings.useCustomCorsProxy}
              onCheckedChange={(checked) => updateSetting("useCustomCorsProxy", checked)}
            />
          </div>

          {localSettings.useCustomCorsProxy && (
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Custom CORS Proxy URL</label>
              <Input
                type="url"
                placeholder="https://your-cors-proxy.com/?url="
                value={localSettings.customCorsProxy}
                onChange={(e) => updateSetting("customCorsProxy", e.target.value)}
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-slate-500 mt-1">
                Must end with "?url=" or similar parameter. Examples:
                <br />• https://corsproxy.io/?url=
                <br />• https://api.allorigins.win/raw?url=
                <br />• https://cors-anywhere.herokuapp.com/
              </div>
            </div>
          )}

          {!localSettings.useCustomCorsProxy && (
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="text-xs text-slate-400">
                <div className="font-medium mb-1">Default CORS Proxy (Fallback Only)</div>
                <div>Fallback proxy: {APP_CONFIG.api.aircraft.corsProxy}</div>
                <div className="mt-1 text-slate-500">
                  <strong>Smart fetching:</strong> Direct URL → CORS proxy (only if needed) → Error handling
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [localSettings.useCustomCorsProxy, localSettings.customCorsProxy, updateSetting],
  )

  const aircraftDisplaySection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Plane className="w-4 h-4 text-blue-400" />
            Aircraft Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Show Aircraft Trails</label>
            <Switch
              checked={localSettings.showTrails}
              onCheckedChange={(checked) => updateSetting("showTrails", checked)}
            />
          </div>

          {localSettings.showTrails && (
            <div>
              <label className="text-sm text-slate-300 mb-2 block">
                Trail Length: {localSettings.trailLength} points
              </label>
              <Slider
                value={[localSettings.trailLength]}
                onValueChange={([value]) => updateSetting("trailLength", value)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Show Altitude Labels</label>
            <Switch
              checked={localSettings.showAltitudeLabels}
              onCheckedChange={(checked) => updateSetting("showAltitudeLabels", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Show Speed Labels</label>
            <Switch
              checked={localSettings.showSpeedLabels}
              onCheckedChange={(checked) => updateSetting("showSpeedLabels", checked)}
            />
          </div>
        </CardContent>
      </Card>
    ),
    [
      localSettings.showTrails,
      localSettings.trailLength,
      localSettings.showAltitudeLabels,
      localSettings.showSpeedLabels,
      updateSetting,
    ],
  )

  const mapSettingsSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Map className="w-4 h-4 text-green-400" />
            Map Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Auto Center on Aircraft</label>
            <Switch
              checked={localSettings.autoCenter}
              onCheckedChange={(checked) => updateSetting("autoCenter", checked)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">
              Update Interval: {localSettings.updateInterval / 1000}s
            </label>
            <Slider
              value={[localSettings.updateInterval]}
              onValueChange={([value]) => updateSetting("updateInterval", value)}
              min={1000}
              max={10000}
              step={1000}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">
              Max Aircraft: {localSettings.maxAircraft === 999999 ? "Unlimited" : localSettings.maxAircraft}
            </label>
            <Slider
              value={[localSettings.maxAircraft === 999999 ? 1000 : localSettings.maxAircraft]}
              onValueChange={([value]) => updateSetting("maxAircraft", value === 1000 ? 999999 : value)}
              min={50}
              max={1000}
              step={50}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    ),
    [localSettings.autoCenter, localSettings.updateInterval, localSettings.maxAircraft, updateSetting],
  )

  const filtersSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="w-4 h-4 text-orange-400" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Filter by Altitude</label>
            <Switch
              checked={localSettings.filterByAltitude}
              onCheckedChange={(checked) => updateSetting("filterByAltitude", checked)}
            />
          </div>

          {localSettings.filterByAltitude && (
            <>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Min Altitude: {localSettings.minAltitude.toLocaleString()} ft
                </label>
                <Slider
                  value={[localSettings.minAltitude]}
                  onValueChange={([value]) => updateSetting("minAltitude", value)}
                  min={0}
                  max={25000}
                  step={1000}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Max Altitude: {localSettings.maxAltitude.toLocaleString()} ft
                </label>
                <Slider
                  value={[localSettings.maxAltitude]}
                  onValueChange={([value]) => updateSetting("maxAltitude", value)}
                  min={25000}
                  max={60000}
                  step={1000}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    ),
    [localSettings.filterByAltitude, localSettings.minAltitude, localSettings.maxAltitude, updateSetting],
  )

  const alertsSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="w-4 h-4 text-red-400" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Enable Sounds</label>
            <Switch
              checked={localSettings.enableSounds}
              onCheckedChange={(checked) => updateSetting("enableSounds", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Emergency Alerts</label>
            <Switch
              checked={localSettings.alertEmergency}
              onCheckedChange={(checked) => updateSetting("alertEmergency", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Low Altitude Alerts</label>
            <Switch
              checked={localSettings.alertLowAltitude}
              onCheckedChange={(checked) => updateSetting("alertLowAltitude", checked)}
            />
          </div>
        </CardContent>
      </Card>
    ),
    [localSettings.enableSounds, localSettings.alertEmergency, localSettings.alertLowAltitude, updateSetting],
  )

  const locationSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Navigation className="w-4 h-4 text-green-400" />
            Location Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm text-slate-300">Enable Nearest Aircraft Feature</label>
              <span className="text-xs text-slate-500">Show 3 nearest aircraft to your location</span>
            </div>
            <Switch
              checked={localSettings.enableLocation}
              onCheckedChange={(checked) => updateSetting("enableLocation", checked)}
            />
          </div>

          {!localSettings.enableLocation && (
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="flex items-start gap-2">
                <NavigationOff className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-400">
                  <div className="font-medium mb-1">Location features disabled</div>
                  <div>The nearest aircraft panel will be hidden and location tracking will be disabled.</div>
                </div>
              </div>
            </div>
          )}

          {localSettings.enableLocation && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-300">
                  <div className="font-medium mb-1">Privacy Notice</div>
                  <div>
                    Your location data is processed entirely locally on your device and is never sent to any server or
                    third party.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [localSettings.enableLocation, updateSetting],
  )

  const experimentalSection = useMemo(
    () => (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Flask className="w-4 h-4 text-purple-400" />
            Experimental Features
            <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              Beta
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm text-slate-300">Enable Experimental Features</label>
              <span className="text-xs text-slate-500">Unlock beta features and advanced options</span>
            </div>
            <Switch
              checked={localSettings.enableExperimentalFeatures}
              onCheckedChange={(checked) => updateSetting("enableExperimentalFeatures", checked)}
            />
          </div>

          {!localSettings.enableExperimentalFeatures && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Flask className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-purple-300">
                  <div className="font-medium mb-1">Experimental features disabled</div>
                  <div>
                    Enable to access beta features like AI insights, predictive paths, and advanced visualizations.
                  </div>
                </div>
              </div>
            </div>
          )}

          {localSettings.enableExperimentalFeatures && (
            <>
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-300">
                    <div className="font-medium mb-1">⚠️ Beta Warning</div>
                    <div>
                      These features are experimental and may be unstable. They could affect performance or cause
                      unexpected behavior.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                      Traffic Heatmap
                    </label>
                    <span className="text-xs text-slate-500">Show aircraft density visualization</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalHeatmap}
                    onCheckedChange={(checked) => updateSetting("experimentalHeatmap", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Brain className="w-3 h-3 text-green-400" />
                      Predictive Flight Paths
                    </label>
                    <span className="text-xs text-slate-500">AI-powered trajectory prediction</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalPredictivePath}
                    onCheckedChange={(checked) => updateSetting("experimentalPredictivePath", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Eye className="w-3 h-3 text-orange-400" />
                      Advanced Filters
                    </label>
                    <span className="text-xs text-slate-500">Filter by airline, aircraft type, route</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalAdvancedFilters}
                    onCheckedChange={(checked) => updateSetting("experimentalAdvancedFilters", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      Performance Mode
                    </label>
                    <span className="text-xs text-slate-500">Optimized rendering for low-end devices</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalPerformanceMode}
                    onCheckedChange={(checked) => updateSetting("experimentalPerformanceMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      Weather Overlay
                    </label>
                    <span className="text-xs text-slate-500">Live weather data on map</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalWeatherOverlay}
                    onCheckedChange={(checked) => updateSetting("experimentalWeatherOverlay", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Brain className="w-3 h-3 text-purple-400" />
                      AI Traffic Insights
                    </label>
                    <span className="text-xs text-slate-500">Smart analysis and recommendations</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalAIInsights}
                    onCheckedChange={(checked) => updateSetting("experimentalAIInsights", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Aircraft Clustering
                    </label>
                    <span className="text-xs text-slate-500">Group nearby aircraft at low zoom</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalClusterMode}
                    onCheckedChange={(checked) => updateSetting("experimentalClusterMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Bell className="w-3 h-3 text-red-400" />
                      Voice Alerts
                    </label>
                    <span className="text-xs text-slate-500">Spoken emergency notifications</span>
                  </div>
                  <Switch
                    checked={localSettings.experimentalVoiceAlerts}
                    onCheckedChange={(checked) => updateSetting("experimentalVoiceAlerts", checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    ),
    [
      localSettings.enableExperimentalFeatures,
      localSettings.experimentalHeatmap,
      localSettings.experimentalPredictivePath,
      localSettings.experimentalAdvancedFilters,
      localSettings.experimentalPerformanceMode,
      localSettings.experimentalWeatherOverlay,
      localSettings.experimentalAIInsights,
      localSettings.experimentalClusterMode,
      localSettings.experimentalVoiceAlerts,
      updateSetting,
    ],
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900/95 border-l border-slate-700/50 backdrop-blur-xl overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xl pb-4 border-b border-slate-700/50 z-10">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50 rounded-md">
                v{APP_CONFIG.app.version}
              </span>
              {hasChanges && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
                  <span className="text-xs text-orange-400">Unsaved</span>
                </div>
              )}
              {isSaving && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Saving...</span>
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={handleClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Sections */}
          {mapStyleSection}
          {aircraftDisplaySection}
          {mapSettingsSection}
          {filtersSection}
          {alertsSection}
          {locationSection}
          {corsSection}
          {experimentalSection}

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-0 bg-slate-900/95 backdrop-blur-xl pt-4 border-t border-slate-700/50 z-10">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex-1 border-slate-600/50 text-slate-300 hover:text-white hover:border-red-500/50"
              disabled={isSaving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            {hasChanges && (
              <Button onClick={applyChanges} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600/50 text-slate-300 hover:text-white"
              disabled={isSaving}
            >
              {hasChanges ? "Cancel" : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
