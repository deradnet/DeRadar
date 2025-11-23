/**
 * Performance Monitor - Tracks and optimizes app performance
 * Automatically detects slow operations and suggests optimizations
 */

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private threshold = 16.67 // 60fps target (16.67ms per frame)

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    // Track metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const metrics = this.metrics.get(name)!
    metrics.push(duration)

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }

    // Warn if slow
    if (duration > this.threshold) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms (target: ${this.threshold}ms)`)
    }

    return result
  }

  /**
   * Measure async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      // Track metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      const metrics = this.metrics.get(name)!
      metrics.push(duration)

      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift()
      }

      // Warn if slow
      if (duration > 100) {
        // Async ops have 100ms threshold
        console.warn(`⚠️ Slow async operation: ${name} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      throw error
    }
  }

  /**
   * Get average performance for a metric
   */
  getAverage(name: string): number {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return 0
    return metrics.reduce((a, b) => a + b, 0) / metrics.length
  }

  /**
   * Get performance report
   */
  getReport() {
    const report: Record<string, { avg: number; max: number; min: number; count: number }> = {}

    this.metrics.forEach((metrics, name) => {
      if (metrics.length === 0) return

      report[name] = {
        avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
        max: Math.max(...metrics),
        min: Math.min(...metrics),
        count: metrics.length,
      }
    })

    return report
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics.clear()
  }
}

export const perfMonitor = new PerformanceMonitor()

// Expose on window for debugging
if (typeof window !== "undefined") {
  ;(window as any).perfMonitor = perfMonitor
}
