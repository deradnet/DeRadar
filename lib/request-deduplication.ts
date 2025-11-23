/**
 * Request Deduplication - Prevent duplicate requests
 * If same request is already in flight, return same promise
 */

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map()
  private maxAge = 5000 // 5 seconds

  /**
   * Deduplicate request - if already in flight, return existing promise
   */
  async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const existing = this.pending.get(key)
    if (existing && Date.now() - existing.timestamp < this.maxAge) {
      console.log(`🔄 Deduplicating request: ${key}`)
      return existing.promise
    }

    // Start new request
    const promise = fetcher()
      .then((result) => {
        this.pending.delete(key)
        return result
      })
      .catch((error) => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, { promise, timestamp: Date.now() })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.clear()
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.pending.size
  }
}

export const requestDeduplicator = new RequestDeduplicator()
