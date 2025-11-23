/**
 * Frame Throttling for Low-End Devices
 * Limits update rate to maintain smooth performance
 */

class FrameThrottler {
  private lastFrameTime = 0
  private targetFPS = 60
  private minFrameTime = 1000 / this.targetFPS

  /**
   * Set target FPS (automatically adjusts for low-end devices)
   */
  setTargetFPS(fps: number) {
    this.targetFPS = fps
    this.minFrameTime = 1000 / fps
    console.log(`🎯 Frame throttle set to ${fps} FPS`)
  }

  /**
   * Request animation frame with throttling
   */
  requestFrame(callback: () => void): number {
    return requestAnimationFrame((timestamp) => {
      const elapsed = timestamp - this.lastFrameTime

      if (elapsed >= this.minFrameTime) {
        this.lastFrameTime = timestamp
        callback()
      } else {
        // Skip this frame, schedule next
        this.requestFrame(callback)
      }
    })
  }

  /**
   * Throttle function execution to max FPS
   */
  throttle<T extends (...args: any[]) => void>(fn: T): T {
    let pending = false

    return ((...args: any[]) => {
      if (pending) return

      pending = true
      this.requestFrame(() => {
        fn(...args)
        pending = false
      })
    }) as T
  }
}

export const frameThrottler = new FrameThrottler()

// Auto-adjust for low-end devices
if (typeof window !== "undefined") {
  import("./device-performance").then(({ devicePerformance }) => {
    devicePerformance.detect().then((caps) => {
      if (caps.tier === "low") {
        frameThrottler.setTargetFPS(30) // 30 FPS for low-end
        console.log("📉 Frame rate limited to 30 FPS for smooth performance")
      } else if (caps.tier === "medium") {
        frameThrottler.setTargetFPS(45) // 45 FPS for mid-range
      }
    })
  })
}
