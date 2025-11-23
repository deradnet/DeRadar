"use client"

import { useState, useEffect } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { fetchAircraftData, calculateStats, generateAlerts } from "@/utils/aircraft-data"
import { Preferences } from "@capacitor/preferences"
import { isCapacitor } from "@/lib/capacitor-utils"

const CACHE_KEY = "aircraft_data_cache"
const CACHE_DURATION = 10000 // Cache for 10 seconds

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
  const [lastFetchTime, setLastFetchTime] = useState(0)

  const fetchData = async (forceRefresh = false) => {
    const now = Date.now()

    // Use cached data if available and recent (prevents redundant fetches)
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      return
    }

    setIsLoading(true)
    try {
      const data = await fetchAircraftData()
      setAircraft(data)
      setStats(calculateStats(data))
      setAlerts(generateAlerts(data))
      setLastFetchTime(now)

      // Cache data natively for offline access
      if (isCapacitor()) {
        await Preferences.set({
          key: CACHE_KEY,
          value: JSON.stringify({ data, timestamp: now }),
        })
      }

      // Store data globally for map access
      if (typeof window !== "undefined") {
        window.currentFlightData = data
      }
    } catch (error) {
      console.error("Error fetching aircraft data:", error)

      // Load from cache on error (offline support)
      if (isCapacitor()) {
        const { value } = await Preferences.get({ key: CACHE_KEY })
        if (value) {
          const cached = JSON.parse(value)
          setAircraft(cached.data)
          setStats(calculateStats(cached.data))
          setAlerts(generateAlerts(cached.data))
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up interval for live updates - 5 seconds for better performance
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return { aircraft, stats, alerts, isLoading, refresh: fetchData }
}
