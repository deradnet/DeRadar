"use client"

import { useEffect, useState } from "react"
import { Network } from "@capacitor/network"
import { isCapacitor } from "@/lib/capacitor-utils"

/**
 * Native network detection hook
 * Uses Capacitor Network API for instant network status
 */
export function useNativeNetwork() {
  const [isOnline, setIsOnline] = useState(true)
  const [networkType, setNetworkType] = useState<string>("unknown")

  useEffect(() => {
    if (!isCapacitor()) {
      // Fallback to browser API
      setIsOnline(navigator.onLine)
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }

    // Use native network detection
    const initNetwork = async () => {
      const status = await Network.getStatus()
      setIsOnline(status.connected)
      setNetworkType(status.connectionType)
    }

    initNetwork()

    // Listen for network changes
    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected)
      setNetworkType(status.connectionType)
    })

    return () => {
      listener.then((l) => l.remove())
    }
  }, [])

  return { isOnline, networkType, isWifi: networkType === "wifi" }
}
