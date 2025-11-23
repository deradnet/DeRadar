"use client"

import { useEffect, useRef, useState } from "react"
import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"

/**
 * Hook to offload heavy calculations to a Web Worker
 * This keeps the main thread responsive while processing 2000+ aircraft
 */
export function useWorkerStats(aircraft: Aircraft[]) {
  const workerRef = useRef<Worker | null>(null)
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
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Only use Web Workers in browser environment
    if (typeof window === "undefined") return

    // Initialize worker
    try {
      workerRef.current = new Worker("/workers/aircraft-stats.worker.js")

      // Handle worker messages
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data

        switch (type) {
          case "STATS_RESULT":
            setStats(data)
            setIsProcessing(false)
            break

          case "ALERTS_RESULT":
            setAlerts(data)
            break

          default:
            console.warn("Unknown worker response:", type)
        }
      }

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error)
        setIsProcessing(false)
      }
    } catch (error) {
      console.warn("Web Workers not supported, falling back to main thread")
      workerRef.current = null
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  // Send aircraft data to worker for processing
  useEffect(() => {
    if (!workerRef.current || aircraft.length === 0) return

    setIsProcessing(true)

    // Calculate stats in worker
    workerRef.current.postMessage({
      type: "CALCULATE_STATS",
      data: aircraft,
    })

    // Generate alerts in worker
    workerRef.current.postMessage({
      type: "GENERATE_ALERTS",
      data: aircraft,
    })
  }, [aircraft])

  return { stats, alerts, isProcessing }
}
