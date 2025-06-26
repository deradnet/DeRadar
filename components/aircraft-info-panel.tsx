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
import { getAirlineFromCallsign, type Airline } from "@/lib/airline-lookup"

interface AircraftInfoPanelProps {
  selectedFlight: SelectedFlight
  onClose: () => void
  openedFrom?: "map" | "list"
}

export function AircraftInfoPanel({ selectedFlight, onClose, openedFrom = "map" }: AircraftInfoPanelProps) {
  const [aircraftImage, setAircraftImage] = useState<AircraftImage | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [airline, setAirline] = useState<Airline | null>(null)
  const [isLoadingAirline, setIsLoadingAirline] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      setIsLoadingImage(true)
      const image = await fetchAircraftImage(selectedFlight.registration, selectedFlight.hex)
      setAircraftImage(image)
      setIsLoadingImage(false)
    }

    loadImage()
  }, [selectedFlight])

  useEffect(() => {
    const loadAirline = async () => {
      if (!selectedFlight.callsign) {
        setAirline(null)
        return
      }

      setIsLoadingAirline(true)
      try {
        const airlineData = await getAirlineFromCallsign(selectedFlight.callsign)
        setAirline(airlineData)
      } catch (error) {
        console.error("Error loading airline data:", error)
        setAirline(null)
      } finally {
        setIsLoadingAirline(false)
      }
    }

    loadAirline()
  }, [selectedFlight.callsign])

  // Determine positioning based on where it was opened from
  const getPositionClasses = () => {
    if (openedFrom === "list") {
      // Mobile: bottom sheet style, Desktop: right side
      return "fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:w-80 z-[10000]"
    } else {
      // When opened from map, use the original positioning
      return "absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-[10000]"
    }
  }

  const getCardClasses = () => {
    if (openedFrom === "list") {
      // Mobile: rounded top corners only, Desktop: normal rounded
      return "bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden rounded-t-2xl sm:rounded-lg border-b-0 sm:border-b"
    } else {
      return "bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden rounded-lg"
    }
  }

  const getAnimationProps = () => {
    if (openedFrom === "list") {
      return {
        initial: { opacity: 0, y: "100%", scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: "100%", scale: 1 },
      }
    } else {
      return {
        initial: { opacity: 0, x: -100, scale: 0.9 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -100, scale: 0.9 },
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        {...getAnimationProps()}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`${getPositionClasses()} max-w-[100vw] sm:max-w-[90vw]`}
        style={{ zIndex: 10000 }}
      >
        {/* Backdrop for mobile when opened from list */}
        {openedFrom === "list" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm sm:hidden -z-10" onClick={onClose} />
        )}

        <Card className={getCardClasses()}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <CountryFlag icao={selectedFlight.hex} size="sm" />
                <span className="truncate">{selectedFlight.callsign}</span>
                {/* Airline Logo in Header */}
                {airline && airline.IATA && (
                  <img
                    src={`/airlines/${airline.IATA}.png`}
                    alt={airline.Name}
                    className="w-8 h-6 object-contain ml-1"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                )}
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
            {/* Mobile drag indicator */}
            {openedFrom === "list" && (
              <div className="flex justify-center sm:hidden -mt-2 mb-2">
                <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 max-h-[calc(85vh-5rem)] sm:max-h-[calc(80vh-4rem)] overflow-y-auto overscroll-contain touch-pan-y pb-6 sm:pb-4">
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

            {/* Airline Information */}
            {selectedFlight.callsign && (
              <div className="space-y-2">
                <div className="text-slate-400 text-sm font-medium">Flight Information</div>
                <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                  {isLoadingAirline ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Airline</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  ) : airline ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Airline</span>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <div className="font-medium text-white">{airline.Alias || airline.Name}</div>
                            <div className="text-xs text-slate-400">{airline.Country}</div>
                          </div>
                          {/* Large Airline Logo */}
                          {airline.IATA && (
                            <img
                              src={`https://airline-logo-api.derad.org/${airline.IATA}.png`}
                              alt={airline.Name}
                              className="w-12 h-8 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Codes</span>
                        <div className="flex gap-2">
                          {airline.ICAO && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
                            >
                              {airline.ICAO}
                            </Badge>
                          )}
                          {airline.IATA && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
                            >
                              {airline.IATA}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {airline.Callsign && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Radio Callsign</span>
                          <span className="font-medium text-white text-sm">{airline.Callsign}</span>
                        </div>
                      )}
                    </>
                  ) : selectedFlight.callsign ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Airline</span>
                      <span className="text-slate-500 text-sm">Unknown</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

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
