/**
 * Request Batcher - Batches and throttles API requests
 * Prevents unnecessary network calls and improves performance
 */

type BatchedRequest<T> = {
  resolve: (value: T) => void
  reject: (error: any) => void
}

class RequestBatcher {
  private queues: Map<string, BatchedRequest<any>[]> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private batchDelay = 50 // ms
  private cacheMaxAge = 1000 // 1 second cache

  /**
   * Batch multiple requests to the same endpoint
   */
  async batch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data
    }

    return new Promise<T>((resolve, reject) => {
      // Add to queue
      if (!this.queues.has(key)) {
        this.queues.set(key, [])
      }
      this.queues.get(key)!.push({ resolve, reject })

      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!)
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const queue = this.queues.get(key) || []
        this.queues.delete(key)
        this.timers.delete(key)

        try {
          const result = await fetcher()
          // Cache result
          this.cache.set(key, { data: result, timestamp: Date.now() })
          // Resolve all waiting requests
          queue.forEach((req) => req.resolve(result))
        } catch (error) {
          // Reject all waiting requests
          queue.forEach((req) => req.reject(error))
        }
      }, this.batchDelay)

      this.timers.set(key, timer)
    })
  }

  /**
   * Clear cache for a specific key
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Clear old cache entries
   */
  pruneCache() {
    const now = Date.now()
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheMaxAge * 10) {
        this.cache.delete(key)
      }
    })
  }
}

export const requestBatcher = new RequestBatcher()

// Prune cache every 30 seconds
if (typeof window !== "undefined") {
  setInterval(() => requestBatcher.pruneCache(), 30000)
}
