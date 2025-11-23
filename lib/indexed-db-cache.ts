/**
 * IndexedDB Cache - For massive datasets (10,000+ aircraft)
 * 100x faster than localStorage, unlimited storage
 */

const DB_NAME = "DeRadarCache"
const DB_VERSION = 1
const STORE_NAME = "aircraftCache"

interface CacheEntry {
  key: string
  value: any
  timestamp: number
  expiresAt: number
}

class IndexedDBCache {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        console.log("💾 IndexedDB initialized")
        resolve()
      }

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("expiresAt", "expiresAt", { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = 60000): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("IndexedDB not initialized")

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        if (!entry) {
          resolve(null)
          return
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
          this.delete(key) // Delete expired entry
          resolve(null)
          return
        }

        resolve(entry.value)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete entry
   */
  async delete(key: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all expired entries
   */
  async clearExpired(): Promise<void> {
    await this.init()
    if (!this.db) return

    const now = Date.now()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("expiresAt")
      const request = index.openCursor(IDBKeyRange.upperBound(now))

      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log("💾 IndexedDB cache cleared")
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    await this.init()
    if (!this.db) return 0

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const indexedDBCache = new IndexedDBCache()

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    indexedDBCache.clearExpired()
  }, 300000)
}
