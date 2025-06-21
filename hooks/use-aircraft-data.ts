"use client"

import { useState, useEffect } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { fetchAircraftData, calculateStats, generateAlerts } from "@/utils/aircraft-data"

export function useAircraftData() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [stats, setStats] = useState<AircraftStats>({
    fastest: null,
    highest: null,
    lowest: null,
    mostMessages: null,
    emergency: null,
    totalAircraft: 0,
    lastUpdate: null,
    avgAltitude: 0,
    avgSpeed: 0,
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchAircraftData()
        setAircraft(data)
        setStats(calculateStats(data))
        setAlerts(generateAlerts(data))

        // Store data globally for map access
        if (typeof window !== "undefined") {
          window.currentFlightData = data
        }
      } catch (error) {
        console.error("Error fetching aircraft data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up interval for live updates
    const interval = setInterval(fetchData, 3000)

    return () => clearInterval(interval)
  }, [])

  return { aircraft, stats, alerts, isLoading }
}
