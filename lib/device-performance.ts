/**
 * Device Performance Detection
 * Automatically detects device capabilities and adjusts performance settings
 */

export type PerformanceTier = "high" | "medium" | "low"

interface DeviceCapabilities {
  tier: PerformanceTier
  cores: number
  memory: number
  concurrency: number
  supportsHardwareAcceleration: boolean
}

class DevicePerformanceDetector {
  private capabilities: DeviceCapabilities | null = null

  /**
   * Detect device performance tier
   */
  async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities

    const cores = navigator.hardwareConcurrency || 2
    const memory = (navigator as any).deviceMemory || 4 // GB

    // Performance tier based on cores and memory
    let tier: PerformanceTier = "medium"

    if (cores >= 8 && memory >= 6) {
      tier = "high" // Flagship phones
    } else if (cores >= 4 && memory >= 4) {
      tier = "medium" // Mid-range phones
    } else {
      tier = "low" // Budget phones
    }

    // Additional performance test for accuracy
    const performanceScore = await this.runPerformanceTest()

    // Adjust tier based on actual performance
    if (performanceScore < 30 && tier === "medium") {
      tier = "low"
    } else if (performanceScore > 80 && tier === "medium") {
      tier = "high"
    }

    this.capabilities = {
      tier,
      cores,
      memory,
      concurrency: Math.max(1, Math.floor(cores / 2)),
      supportsHardwareAcceleration: this.detectHardwareAcceleration(),
    }

    console.log("🔍 Device Performance Detected:", this.capabilities)

    return this.capabilities
  }

  /**
   * Run simple performance benchmark
   */
  private async runPerformanceTest(): Promise<number> {
    const start = performance.now()

    // Simple computation benchmark
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i)
    }

    const duration = performance.now() - start

    // Score: 0-100 (lower duration = higher score)
    // High-end: ~10-20ms (score: 90-100)
    // Mid-range: ~30-50ms (score: 50-70)
    // Low-end: ~80-150ms (score: 10-30)
    const score = Math.max(0, Math.min(100, 100 - duration))

    console.log(`⚡ Performance Test: ${duration.toFixed(2)}ms (score: ${score.toFixed(0)})`)

    return score
  }

  /**
   * Detect hardware acceleration support
   */
  private detectHardwareAcceleration(): boolean {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    return !!gl
  }

  /**
   * Get current device capabilities
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities
  }

  /**
   * Check if device is low-end
   */
  isLowEnd(): boolean {
    return this.capabilities?.tier === "low"
  }

  /**
   * Check if device is high-end
   */
  isHighEnd(): boolean {
    return this.capabilities?.tier === "high"
  }

  /**
   * Get recommended settings based on device tier
   */
  getRecommendedSettings() {
    const tier = this.capabilities?.tier || "medium"

    const settings = {
      high: {
        maxVisibleFlights: 100,
        updateInterval: 3000,
        enableAnimations: true,
        enableBlur: true,
        enableShadows: true,
        imageQuality: "high",
        chartUpdateInterval: 5000,
        enableTransitions: true,
        transitionDuration: 300,
        maxConcurrentRequests: 10,
      },
      medium: {
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
      },
      low: {
        maxVisibleFlights: 25,
        updateInterval: 8000,
        enableAnimations: false,
        enableBlur: false,
        enableShadows: false,
        imageQuality: "low",
        chartUpdateInterval: 15000,
        enableTransitions: false,
        transitionDuration: 0,
        maxConcurrentRequests: 3,
      },
    }

    return settings[tier]
  }
}

export const devicePerformance = new DevicePerformanceDetector()

// Auto-detect on load
if (typeof window !== "undefined") {
  devicePerformance.detect().then((caps) => {
    console.log("📱 Device Tier:", caps.tier)
    console.log("⚙️ Recommended Settings:", devicePerformance.getRecommendedSettings())
  })
}
