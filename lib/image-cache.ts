/**
 * Image Cache - Aggressive image caching strategy
 * Preloads and caches images to prevent network requests
 */

class ImageCache {
  private cache: Map<string, HTMLImageElement> = new Map()
  private loading: Set<string> = new Set()
  private maxCacheSize = 100

  /**
   * Preload an image
   */
  async preload(url: string): Promise<HTMLImageElement> {
    // Return from cache if exists
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // Wait if already loading
    if (this.loading.has(url)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(url)) {
            clearInterval(checkInterval)
            resolve(this.cache.get(url)!)
          }
        }, 50)
      })
    }

    // Start loading
    this.loading.add(url)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.loading.delete(url)
        this.cache.set(url, img)
        this.pruneCache()
        resolve(img)
      }
      img.onerror = () => {
        this.loading.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }
      img.src = url
    })
  }

  /**
   * Batch preload multiple images
   */
  async preloadBatch(urls: string[], maxConcurrent = 5): Promise<void> {
    const chunks: string[][] = []
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map((url) => this.preload(url)))
    }
  }

  /**
   * Check if image is cached
   */
  has(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * Get cached image
   */
  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url)
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
    this.loading.clear()
  }

  /**
   * Prune cache to max size (LRU)
   */
  private pruneCache() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
  }
}

export const imageCache = new ImageCache()
