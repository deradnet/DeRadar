"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plane, Filter, X } from "lucide-react"
import { registration_from_hexid } from "@/lib/registration-lookup"
import type { Aircraft } from "@/types/aircraft"
import type { FilterCriteria } from "@/types/filter-criteria" // Declare FilterCriteria type
import { CountryFlag } from "@/components/country-flag"

interface ActiveFlightsProps {
  aircraft: Aircraft[]
  searchTerm: string
  onSearchChange: (term: string) => void
  onFlightSelect: (flight: Aircraft) => void
  isPlaybackMode?: boolean
}

export function ActiveFlights({
  aircraft,
  searchTerm,
  onSearchChange,
  onFlightSelect,
  isPlaybackMode = false,
}: ActiveFlightsProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    showEmergencyOnly: false,
    minAltitude: 0,
    maxAltitude: 60000,
    minSpeed: 0,
    maxSpeed: 1000,
    aircraftType: "all",
  })
  const [visibleFlights, setVisibleFlights] = useState(6)

  const filteredFlights = aircraft.filter((flight) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const flightMatch = flight.flight && flight.flight.trim().toLowerCase().includes(searchLower)
    const hexMatch = flight.hex && flight.hex.toLowerCase().includes(searchLower)
    const regMatch = flight.r && flight.r.toLowerCase().includes(searchLower)
    const typeMatch = flight.t && flight.t.toLowerCase().includes(searchLower)

    // Check computed registration
    const computedReg = flight.hex ? registration_from_hexid(flight.hex) : null
    const computedRegMatch = computedReg && computedReg.toLowerCase().includes(searchLower)

    const matchesSearch = !searchTerm || flightMatch || hexMatch || regMatch || typeMatch || computedRegMatch

    // Filter criteria
    const matchesEmergency = !filterCriteria.showEmergencyOnly || (flight.emergency && flight.emergency !== "none")
    const matchesAltitude =
      !flight.alt_baro ||
      (flight.alt_baro >= filterCriteria.minAltitude && flight.alt_baro <= filterCriteria.maxAltitude)
    const matchesSpeed = !flight.gs || (flight.gs >= filterCriteria.minSpeed && flight.gs <= filterCriteria.maxSpeed)

    let matchesType = true
    if (filterCriteria.aircraftType !== "all") {
      const aircraftType = flight.t?.toLowerCase() || flight.category?.toLowerCase() || ""
      switch (filterCriteria.aircraftType) {
        case "airliner":
          matchesType = /a3[123]|a33|b73|a32|b77|a35/.test(aircraftType)
          break
        case "fighter":
          matchesType = /f1|f2|f3|a10|f16|f18/.test(aircraftType)
          break
        case "heavy":
          matchesType = /c17|b74|a38|b74|a34/.test(aircraftType)
          break
        case "cessna":
          matchesType = /c172|pa2|sr2|c152|c182/.test(aircraftType)
          break
        case "glider":
          matchesType = /glid|ask|dg8|discus/.test(aircraftType)
          break
        case "helicopter":
          matchesType = flight.category === "A7" || /heli|ec13|bell|r44/.test(aircraftType)
          break
      }
    }

    return matchesSearch && matchesEmergency && matchesAltitude && matchesSpeed && matchesType
  })

  const displayedFlights = filteredFlights.slice(0, visibleFlights)

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget

    // Load more when scrolled to within 100px of bottom
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleFlights < filteredFlights.length) {
        setVisibleFlights((prev) => Math.min(prev + 6, filteredFlights.length))
      }
    }
  }

  useEffect(() => {
    setVisibleFlights(6)
  }, [searchTerm, filterCriteria])

  const hasActiveFilters =
    filterCriteria.showEmergencyOnly ||
    filterCriteria.minAltitude > 0 ||
    filterCriteria.maxAltitude < 60000 ||
    filterCriteria.minSpeed > 0 ||
    filterCriteria.maxSpeed < 1000 ||
    filterCriteria.aircraftType !== "all"

  const cardClass = `lg:col-span-2 bg-slate-900/30 border-slate-800/50 backdrop-blur-xl ${isPlaybackMode ? "border-purple-500/30" : ""}`
  const titleClass = isPlaybackMode ? "text-purple-300" : "text-blue-400"

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plane className={`w-5 h-5 ${titleClass}`} />
            <span className="text-white">{isPlaybackMode ? "Historical Flights" : "Active Flights"}</span>
            {isPlaybackMode && (
              <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                Historical
              </div>
            )}
            {searchTerm && (
              <Badge
                variant="secondary"
                className={`${isPlaybackMode ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}`}
              >
                {displayedFlights.length} of {aircraft.length}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto relative">
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                placeholder="Search flights, hex, reg, type..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400 backdrop-blur-sm pr-8"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSearchChange("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>}
            </Button>
          </div>
        </CardTitle>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Emergency Only</span>
              <Switch
                checked={filterCriteria.showEmergencyOnly}
                onCheckedChange={(checked) => setFilterCriteria((prev) => ({ ...prev, showEmergencyOnly: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Debug Flag Issues</span>
              <Switch checked={showDebug} onCheckedChange={setShowDebug} />
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-300">Altitude Range (ft)</span>
              <div className="px-2">
                <Slider
                  value={[filterCriteria.minAltitude, filterCriteria.maxAltitude]}
                  onValueChange={([min, max]) =>
                    setFilterCriteria((prev) => ({ ...prev, minAltitude: min, maxAltitude: max }))
                  }
                  min={0}
                  max={60000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{filterCriteria.minAltitude.toLocaleString()}</span>
                  <span>{filterCriteria.maxAltitude.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-300">Speed Range (kts)</span>
              <div className="px-2">
                <Slider
                  value={[filterCriteria.minSpeed, filterCriteria.maxSpeed]}
                  onValueChange={([min, max]) =>
                    setFilterCriteria((prev) => ({ ...prev, minSpeed: min, maxSpeed: max }))
                  }
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{filterCriteria.minSpeed}</span>
                  <span>{filterCriteria.maxSpeed}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-300">Aircraft Type</span>
              <Select
                value={filterCriteria.aircraftType}
                onValueChange={(value: any) => setFilterCriteria((prev) => ({ ...prev, aircraftType: value }))}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white">
                    All Types
                  </SelectItem>
                  <SelectItem value="airliner" className="text-white">
                    Airliners
                  </SelectItem>
                  <SelectItem value="fighter" className="text-white">
                    Military
                  </SelectItem>
                  <SelectItem value="heavy" className="text-white">
                    Heavy Aircraft
                  </SelectItem>
                  <SelectItem value="cessna" className="text-white">
                    General Aviation
                  </SelectItem>
                  <SelectItem value="glider" className="text-white">
                    Gliders
                  </SelectItem>
                  <SelectItem value="helicopter" className="text-white">
                    Helicopters
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setFilterCriteria({
                    showEmergencyOnly: false,
                    minAltitude: 0,
                    maxAltitude: 60000,
                    minSpeed: 0,
                    maxSpeed: 1000,
                    aircraftType: "all",
                  })
                }
                className="text-slate-400 hover:text-white"
              >
                Clear All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(false)}
                className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]" onScrollCapture={handleScroll}>
          <div className="space-y-2">
            {displayedFlights.map((flight) => {
              const registration = flight.r || registration_from_hexid(flight.hex)
              const isEmergency = flight.emergency && flight.emergency !== "none"

              return (
                <div
                  key={flight.hex}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    isEmergency
                      ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50"
                  } backdrop-blur-sm`}
                  onClick={() => onFlightSelect(flight)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CountryFlag icao={flight.hex} size="sm" debug={showDebug} />
                        <span className="font-semibold text-white">
                          {flight.flight ? flight.flight.trim() : registration || flight.hex}
                        </span>
                        {registration && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
                          >
                            {registration}
                          </Badge>
                        )}
                        {isEmergency && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            {flight.emergency}
                          </Badge>
                        )}
                        {showDebug && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
                            {flight.hex}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Alt:</span>
                          <span className="text-white ml-1 font-mono">
                            {flight.alt_baro ? `${flight.alt_baro.toLocaleString()}ft` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Speed:</span>
                          <span className="text-white ml-1 font-mono">
                            {flight.gs ? `${Math.round(flight.gs)}kts` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Squawk:</span>
                          <span className="text-white ml-1 font-mono">{flight.squawk || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white ml-1">{flight.t || flight.category || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isEmergency
                            ? "bg-red-500 animate-ping"
                            : flight.gs && flight.gs > 0
                              ? "bg-green-500"
                              : "bg-slate-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load more indicator */}
            {visibleFlights < filteredFlights.length && (
              <div className="text-center py-4 text-slate-400">
                <div className="text-sm">Scroll for more flights...</div>
                <div className="text-xs mt-1">
                  Showing {visibleFlights} of {filteredFlights.length}
                </div>
              </div>
            )}

            {displayedFlights.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>No flights match your search criteria</div>
                {searchTerm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSearchChange("")}
                    className="mt-2 text-slate-400 hover:text-white"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
