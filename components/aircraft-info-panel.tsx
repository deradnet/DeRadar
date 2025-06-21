"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, X, Camera, ExternalLink } from "lucide-react"
import type { SelectedFlight, AircraftImage } from "@/types/aircraft"
import { fetchAircraftImage } from "@/utils/planespotters-api"
import { motion, AnimatePresence } from "framer-motion"
import { CountryFlag } from "@/components/country-flag"

interface AircraftInfoPanelProps {
  selectedFlight: SelectedFlight
  onClose: () => void
}

export function AircraftInfoPanel({ selectedFlight, onClose }: AircraftInfoPanelProps) {
  const [aircraftImage, setAircraftImage] = useState<AircraftImage | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      setIsLoadingImage(true)
      const image = await fetchAircraftImage(selectedFlight.registration, selectedFlight.hex)
      setAircraftImage(image)
      setIsLoadingImage(false)
    }

    loadImage()
  }, [selectedFlight])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-[10000]"
        style={{ zIndex: 10000 }}
      >
        <Card className="bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <CountryFlag icao={selectedFlight.hex} size="sm" />
                {selectedFlight.callsign}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aircraft Image */}
            <div className="relative">
              {isLoadingImage ? (
                <div className="w-full h-32 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : aircraftImage ? (
                <div className="space-y-2">
                  <img
                    src={aircraftImage.url || "/placeholder.svg"}
                    alt="Aircraft"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `/placeholder.svg?height=128&width=300&text=No+Image`
                    }}
                  />
                  {aircraftImage.photographer !== "No image available" && (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Photo by {aircraftImage.photographer}</span>
                      </div>
                      {aircraftImage.link && (
                        <a
                          href={aircraftImage.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Flight Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Status</div>
                <Badge
                  variant={selectedFlight.status === "Emergency" ? "destructive" : "secondary"}
                  className={
                    selectedFlight.status === "Emergency"
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-green-500/20 text-green-300 border-green-500/30"
                  }
                >
                  {selectedFlight.status}
                </Badge>
              </div>
              <div>
                <div className="text-slate-400">Squawk</div>
                <div className="font-medium text-white">{selectedFlight.squawk}</div>
              </div>
              <div>
                <div className="text-slate-400">Altitude</div>
                <div className="font-medium text-white">{selectedFlight.altitude.toLocaleString()} ft</div>
              </div>
              <div>
                <div className="text-slate-400">Speed</div>
                <div className="font-medium text-white">{selectedFlight.speed} kts</div>
              </div>
              <div>
                <div className="text-slate-400">Heading</div>
                <div className="font-medium text-white">{selectedFlight.heading}°</div>
              </div>
              <div>
                <div className="text-slate-400">Distance</div>
                <div className="font-medium text-white">
                  {selectedFlight.lat && selectedFlight.lng
                    ? `${Math.round(Math.sqrt(Math.pow(selectedFlight.lat - 41.0, 2) + Math.pow(selectedFlight.lng - 48.0, 2)) * 111.32)} km`
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Registration</div>
                <div className="flex items-center gap-2">
                  <div className="font-medium text-white">{selectedFlight.registration}</div>
                  <CountryFlag icao={selectedFlight.hex} size="xs" showCountryName={true} />
                </div>
              </div>
              <div>
                <div className="text-slate-400">Country</div>
                <div className="flex items-center gap-2">
                  <CountryFlag icao={selectedFlight.hex} size="sm" showCountryName={true} />
                </div>
              </div>
              <div>
                <div className="text-slate-400">Track Rate</div>
                <div className="font-medium text-white">
                  {selectedFlight.heading ? `${selectedFlight.heading > 180 ? "Left" : "Right"} turn` : "Stable"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400">ICAO Hex</div>
                <div className="font-medium text-white font-mono">{selectedFlight.hex.toUpperCase()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between">
                <span className="text-slate-400">Vertical Rate</span>
                <span className="font-medium text-white font-mono">
                  {selectedFlight.altitude > 10000
                    ? "Climbing"
                    : selectedFlight.altitude < 5000
                      ? "Descending"
                      : "Level"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flight Phase</span>
                <span className="font-medium text-white">
                  {selectedFlight.altitude > 30000
                    ? "Cruise"
                    : selectedFlight.speed < 200
                      ? "Approach/Departure"
                      : "Climb/Descent"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ground Speed Category</span>
                <span className="font-medium text-white">
                  {selectedFlight.speed > 500 ? "High Speed" : selectedFlight.speed > 300 ? "Normal" : "Low Speed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signal Strength</span>
                <span className="font-medium text-white text-green-400">Strong</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-sm">Position</div>
              <div className="font-medium text-white text-sm">
                {selectedFlight.lat.toFixed(4)}, {selectedFlight.lng.toFixed(4)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
