"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { fetchAircraftData, calculateStats, generateAlerts } from "@/utils/aircraft-data"
import { Preferences } from "@capacitor/preferences"
import { isCapacitor } from "@/lib/capacitor-utils"

const CACHE_KEY = "aircraft_data_cache"
const CACHE_DURATION = 10000 // Cache for 10 seconds

// Deep equality check for aircraft data to prevent unnecessary updates
function aircraftArrayEqual(a: Aircraft[], b: Aircraft[]): boolean {
  if (a.length !== b.length) return false
  // Quick check: compare hex codes and key properties
  for (let i = 0; i < a.length; i++) {
    if (a[i].hex !== b[i].hex ||
        a[i].lat !== b[i].lat ||
        a[i].lon !== b[i].lon ||
        a[i].alt_baro !== b[i].alt_baro ||
        a[i].gs !== b[i].gs) {
      return false
    }
  }
  return true
}

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
  const previousAircraftRef = useRef<Aircraft[]>([])
  const fetchInProgressRef = useRef(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Prevent duplicate simultaneous fetches
    if (fetchInProgressRef.current && !forceRefresh) {
      return
    }

    // Use cached data if available and recent (prevents redundant fetches)
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      return
    }

    fetchInProgressRef.current = true
    setIsLoading(true)

    try {
      const data = await fetchAircraftData()

      // Only update if data actually changed (prevents unnecessary re-renders)
      if (!aircraftArrayEqual(data, previousAircraftRef.current)) {
        previousAircraftRef.current = data
        setAircraft(data)

        // Calculate stats only when data changes
        const newStats = calculateStats(data)
        setStats(newStats)

        // Generate alerts only when data changes
        const newAlerts = generateAlerts(data)
        setAlerts(newAlerts)
      }

      setLastFetchTime(now)

      // Cache data natively for offline access (non-blocking)
      if (isCapacitor()) {
        Preferences.set({
          key: CACHE_KEY,
          value: JSON.stringify({ data, timestamp: now }),
        }).catch(() => {}) // Silently fail
      }

      // Store data globally for map access
      if (typeof window !== "undefined") {
        window.currentFlightData = data
      }
    } catch (error) {
      // Load from cache on error (offline support)
      if (isCapacitor()) {
        const { value } = await Preferences.get({ key: CACHE_KEY })
        if (value) {
          const cached = JSON.parse(value)
          if (!aircraftArrayEqual(cached.data, previousAircraftRef.current)) {
            previousAircraftRef.current = cached.data
            setAircraft(cached.data)
            setStats(calculateStats(cached.data))
            setAlerts(generateAlerts(cached.data))
          }
        }
      }
    } finally {
      setIsLoading(false)
      fetchInProgressRef.current = false
    }
  }, [lastFetchTime])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up interval for live updates - 5 seconds for better performance
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return { aircraft, stats, alerts, isLoading, refresh: fetchData }
}
