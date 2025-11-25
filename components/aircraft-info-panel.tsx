"use client"

import { useState, useEffect } from "react"
import { X, Plane, MapPin, Gauge, ArrowUp, Locate } from "lucide-react"
import type { SelectedFlight } from "@/types/aircraft"
import { CountryFlag } from "@/components/country-flag"
import { motion, AnimatePresence } from "framer-motion"

interface AircraftInfoPanelProps {
  selectedFlight: SelectedFlight
  onClose: () => void
  onShowOnMap?: (hex: string) => void
}

export function AircraftInfoPanel({ selectedFlight, onClose, onShowOnMap }: AircraftInfoPanelProps) {
  const [aircraftImage, setAircraftImage] = useState<string | null>(null)

  useEffect(() => {
    setAircraftImage(null) // Reset image when aircraft changes

    const loadImage = async () => {
      if (!selectedFlight.registration && !selectedFlight.hex) return

      try {
        // Try using registration first if available
        const query = selectedFlight.registration || selectedFlight.hex
        const response = await fetch(
          `https://api.planespotters.net/pub/photos/reg/${query}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.photos && data.photos.length > 0) {
            const photo = data.photos[0]
            // Use thumbnail_large if available, otherwise use thumbnail
            const imageUrl = photo.thumbnail_large?.src || photo.thumbnail?.src
            if (imageUrl) {
              setAircraftImage(imageUrl)
            }
          }
        }
      } catch (error) {
        // Silently fail - image is optional
        console.log("Aircraft image not available")
      }
    }

    loadImage()
  }, [selectedFlight.hex, selectedFlight.registration])

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Close and Locate Buttons */}
        <div className="absolute top-5 right-4 flex items-center gap-2 z-10">
          {onShowOnMap && selectedFlight.lat && selectedFlight.lng && (
            <button
              onClick={() => {
                onShowOnMap(selectedFlight.hex)
                if ((window as any).Capacitor?.Plugins?.Haptics) {
                  (window as any).Capacitor.Plugins.Haptics.impact({ style: 'light' })
                }
              }}
              className="p-2.5 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border border-blue-500/40 rounded-full transition-all active:scale-95 shadow-lg"
              title="Locate on map"
            >
              <Locate className="w-5 h-5 text-blue-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-full transition-all active:scale-95 shadow-lg"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-3rem)] pb-6">
          {/* Aircraft Image */}
          {aircraftImage && (
            <div className="relative w-full h-48 bg-slate-800">
              <img
                src={aircraftImage}
                alt="Aircraft"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          )}

          {/* Header Info */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start gap-3 mb-4">
              <CountryFlag icao={selectedFlight.hex} size="md" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedFlight.callsign || selectedFlight.registration || selectedFlight.hex}
                </h2>
                {selectedFlight.callsign && selectedFlight.registration && (
                  <p className="text-sm text-slate-400">{selectedFlight.registration}</p>
                )}
                {selectedFlight.type && selectedFlight.type !== "Unknown" && (
                  <p className="text-xs text-slate-500 mt-1">{selectedFlight.type}</p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            {selectedFlight.status === "Emergency" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full mb-4">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-red-300">EMERGENCY</span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="px-4 mb-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Altitude */}
              <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <ArrowUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {selectedFlight.altitude > 0 ? Math.round(selectedFlight.altitude / 100) : 'GND'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">
                  {selectedFlight.altitude > 0 ? 'FL' : 'Ground'}
                </div>
              </div>

              {/* Speed */}
              <div className="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Gauge className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{selectedFlight.speed}</div>
                <div className="text-[10px] text-slate-400 uppercase">kts</div>
              </div>

              {/* Heading */}
              <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Plane
                  className="w-4 h-4 text-purple-400 mx-auto mb-1"
                  style={{ transform: `rotate(${selectedFlight.heading}deg)` }}
                />
                <div className="text-lg font-bold text-white">{selectedFlight.heading}°</div>
                <div className="text-[10px] text-slate-400 uppercase">hdg</div>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="px-4 space-y-2">
            {/* Position */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">Position</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Latitude:</span>
                  <div className="font-mono text-white font-semibold">{selectedFlight.lat.toFixed(5)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Longitude:</span>
                  <div className="font-mono text-white font-semibold">{selectedFlight.lng.toFixed(5)}</div>
                </div>
              </div>
            </div>

            {/* Aircraft Details */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">Aircraft Info</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ICAO Hex:</span>
                  <span className="font-mono text-white font-semibold">{selectedFlight.hex.toUpperCase()}</span>
                </div>
                {selectedFlight.type && selectedFlight.type !== "Unknown" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-white font-semibold">{selectedFlight.type}</span>
                  </div>
                )}
                {selectedFlight.registration && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Registration:</span>
                    <span className="font-mono text-white font-semibold">{selectedFlight.registration}</span>
                  </div>
                )}
                {selectedFlight.squawk && selectedFlight.squawk !== "N/A" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Squawk:</span>
                    <span className="font-mono text-white font-semibold">{selectedFlight.squawk}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Full Altitude Display */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Altitude (ft):</span>
                <span className="text-white font-semibold">
                  {selectedFlight.altitude > 0 ? selectedFlight.altitude.toLocaleString() : 'Ground Level'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
