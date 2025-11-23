"use client"

import { useState, useEffect } from "react"

interface BatteryStatus {
  level: number
  charging: boolean
  lowBattery: boolean
}

/**
 * Battery Saver Mode Hook
 * Automatically enables power saving when battery is low
 */
export function useBatterySaver() {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    level: 1,
    charging: true,
    lowBattery: false,
  })

  const [powerSaveMode, setPowerSaveMode] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined" || !("getBattery" in navigator)) {
      return
    }

    const updateBatteryStatus = (battery: any) => {
      const level = battery.level
      const charging = battery.charging
      const lowBattery = level < 0.2 && !charging // Below 20% and not charging

      setBatteryStatus({ level, charging, lowBattery })

      // Auto-enable power save mode when battery is low
      if (lowBattery && !powerSaveMode) {
        setPowerSaveMode(true)
        console.log("🔋 Low battery detected - Power Save Mode enabled")
      }
    }

    ;(navigator as any).getBattery().then((battery: any) => {
      updateBatteryStatus(battery)

      battery.addEventListener("levelchange", () => updateBatteryStatus(battery))
      battery.addEventListener("chargingchange", () => updateBatteryStatus(battery))
    })
  }, [powerSaveMode])

  const togglePowerSave = () => {
    setPowerSaveMode(!powerSaveMode)
  }

  return {
    batteryStatus,
    powerSaveMode,
    togglePowerSave,
  }
}

/**
 * Apply power save optimizations
 */
export function applyPowerSaveOptimizations() {
  if (typeof document === "undefined") return

  // Remove existing styles
  const existingStyle = document.getElementById("power-save-mode")
  if (existingStyle) existingStyle.remove()

  const style = document.createElement("style")
  style.id = "power-save-mode"
  style.innerHTML = `
    /* Power Save Mode - Maximum performance optimization */

    /* Disable ALL animations */
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }

    /* Disable ALL effects */
    * {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: none !important;
      filter: none !important;
      text-shadow: none !important;
    }

    /* Simplify backgrounds */
    .bg-gradient-to-r,
    .bg-gradient-to-br,
    .bg-gradient-to-t,
    .bg-gradient-to-b {
      background: #1e293b !important;
    }

    /* Disable transforms */
    * {
      transform: none !important;
      will-change: auto !important;
    }

    /* Reduce image quality */
    img {
      image-rendering: pixelated !important;
    }
  `

  document.head.appendChild(style)
  console.log("🔋 Power Save Mode - All visual effects disabled")
}

/**
 * Remove power save optimizations
 */
export function removePowerSaveOptimizations() {
  const style = document.getElementById("power-save-mode")
  if (style) {
    style.remove()
    console.log("🔌 Power Save Mode disabled")
  }
}
