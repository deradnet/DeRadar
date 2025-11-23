"use client"

import { useState, useEffect } from "react"
import { devicePerformance, type PerformanceTier } from "@/lib/device-performance"

interface AdaptiveSettings {
  tier: PerformanceTier
  maxVisibleFlights: number
  updateInterval: number
  enableAnimations: boolean
  enableBlur: boolean
  enableShadows: boolean
  imageQuality: string
  chartUpdateInterval: number
  enableTransitions: boolean
  transitionDuration: number
  maxConcurrentRequests: number
}

/**
 * Hook for adaptive performance based on device capabilities
 * Automatically adjusts settings for low-end devices
 */
export function useAdaptivePerformance() {
  const [settings, setSettings] = useState<AdaptiveSettings>({
    tier: "medium",
    maxVisibleFlights: 50,
    updateInterval: 5000,
    enableAnimations: true,
    enableBlur: true,
    enableShadows: false,
    imageQuality: "medium",
    chartUpdateInterval: 10000,
    enableTransitions: true,
    transitionDuration: 150,
    maxConcurrentRequests: 5,
  })

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const detectAndApply = async () => {
      const caps = await devicePerformance.detect()
      const recommended = devicePerformance.getRecommendedSettings()

      setSettings({
        tier: caps.tier,
        ...recommended,
      })

      setIsReady(true)

      // Apply global CSS optimizations for low-end devices
      if (caps.tier === "low") {
        applyLowEndOptimizations()
      }
    }

    detectAndApply()
  }, [])

  return { settings, isReady, isLowEnd: settings.tier === "low" }
}

/**
 * Apply CSS optimizations for low-end devices
 */
function applyLowEndOptimizations() {
  if (typeof document === "undefined") return

  const style = document.createElement("style")
  style.id = "low-end-optimizations"
  style.innerHTML = `
    /* Disable all animations and transitions on low-end devices */
    * {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }

    /* Disable blur effects */
    .backdrop-blur-xl,
    .backdrop-blur-3xl,
    .backdrop-blur-lg,
    .backdrop-blur-md,
    .backdrop-blur-sm {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    /* Disable shadows */
    .shadow-xl,
    .shadow-2xl,
    .shadow-lg,
    .shadow-md {
      box-shadow: none !important;
    }

    /* Simplify gradients */
    .bg-gradient-to-r,
    .bg-gradient-to-br,
    .bg-gradient-to-t {
      background: var(--fallback-bg, #1e293b) !important;
    }

    /* Disable transforms for better performance */
    .hover\\:scale-\\[1\\.02\\]:hover,
    .hover\\:scale-\\[1\\.01\\]:hover {
      transform: none !important;
    }
  `

  document.head.appendChild(style)

  console.log("🔧 Low-end optimizations applied")
}
