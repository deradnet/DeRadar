/**
 * Aggressive Prefetching - Predict and preload data
 * Prefetches data before user needs it
 */

import { indexedDBCache } from "./indexed-db-cache"

class PrefetchOptimizer {
  private prefetchQueue: Set<string> = new Set()
  private isProcessing = false

  /**
   * Prefetch data in the background
   */
  async prefetch(url: string, fetcher: () => Promise<any>, priority: "high" | "low" = "low") {
    if (this.prefetchQueue.has(url)) return

    this.prefetchQueue.add(url)

    // High priority: fetch immediately
    if (priority === "high") {
      this.processPrefetch(url, fetcher)
    } else {
      // Low priority: wait for idle time
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => this.processPrefetch(url, fetcher))
      } else {
        setTimeout(() => this.processPrefetch(url, fetcher), 100)
      }
    }
  }

  /**
   * Process prefetch request
   */
  private async processPrefetch(url: string, fetcher: () => Promise<any>) {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Check cache first
      const cached = await indexedDBCache.get(url)
      if (cached) {
        console.log(`✅ Prefetch cache hit: ${url}`)
        this.prefetchQueue.delete(url)
        this.isProcessing = false
        return
      }

      // Fetch and cache
      console.log(`🔮 Prefetching: ${url}`)
      const data = await fetcher()
      await indexedDBCache.set(url, data, 300000) // Cache for 5 minutes

      this.prefetchQueue.delete(url)
    } catch (error) {
      console.warn(`⚠️ Prefetch failed: ${url}`, error)
      this.prefetchQueue.delete(url)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Prefetch airline logos for visible flights
   */
  prefetchAirlineLogos(callsigns: string[]) {
    callsigns.slice(0, 20).forEach((callsign) => {
      const icao = callsign.substring(0, 3).toUpperCase()
      const url = `https://airline-api.derad.org/${icao}`

      this.prefetch(
        url,
        () => fetch(url).then((r) => r.json()),
        "low"
      )
    })
  }

  /**
   * Clear prefetch queue
   */
  clear() {
    this.prefetchQueue.clear()
  }
}

export const prefetchOptimizer = new PrefetchOptimizer()
