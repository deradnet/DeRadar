import type { Aircraft } from "@/types/aircraft"
import { resolveApiUrls } from "@/config/app.config"
import { AbortSignal } from "abort-controller"

// Static configuration for S3 deployment
const PLAYBACK_CONFIG = {
  defaultRange: 50,
  defaultSpeed: 1,
  baseInterval: 1500,
  earlyLoadCount: 10,
  batchSize: 20,
  concurrency: {
    parallel: 5,
    initial: 8,
    background: 3,
  },
  api: {
    historical: {
      graphqlUrl: "https://derad.network/graphql",
      dataUrl: "https://derad.network",
      owner: "Vpu86GpNgl3H7yAPUzl8XvxdQmu3VPqJMsItF29SRB4",
      appName: "DeradNetworkBackup",
      timeout: 15000,
      retries: 3,
    },
  },
  storage: {
    cache: {
      maxAge: 3600000, // 1 hour
    },
  },
}

export interface ArweaveTransaction {
  id: string
  tags: {
    name: string
    value: string
  }[]
}

export interface ArweaveEdge {
  cursor: string
  node: ArweaveTransaction
}

export interface ArweaveResponse {
  data: {
    transactions: {
      edges: ArweaveEdge[]
      pageInfo: {
        hasNextPage: boolean
      }
    }
  }
}

export interface HistoricalData {
  source: string
  timestamp: string
  now: number
  messages: number
  aircraft: Aircraft[]
}

export interface PlaybackSnapshot {
  id: string
  timestamp: string
  data: HistoricalData | null
  isLoading?: boolean
  error?: string
}

export interface FetchOptions {
  first?: number
  after?: string
}

// Fetch available historical data snapshots with pagination
export async function fetchHistoricalSnapshots(options: FetchOptions = {}): Promise<{
  snapshots: PlaybackSnapshot[]
  hasNextPage: boolean
  endCursor: string | null
}> {
  try {
    const { first = PLAYBACK_CONFIG.defaultRange, after } = options

    // Resolve gateway URLs
    const { graphqlUrl } = await resolveApiUrls()

    const query = `
      query {
        transactions(
          first: ${first}
          ${after ? `after: "${after}"` : ""}
          owners: ["${PLAYBACK_CONFIG.api.historical.owner}"]
          tags: [{ name: "App-Name", values: ["${PLAYBACK_CONFIG.api.historical.appName}"] }]
        ) {
          edges {
            cursor
            node {
              id
              tags {
                name
                value
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `

    console.log(`Fetching ${first} historical snapshots from ${graphqlUrl}...`)

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(PLAYBACK_CONFIG.api.historical.timeout),
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`)
    }

    const result: ArweaveResponse = await response.json()

    // Extract snapshots and sort by timestamp (newest first initially)
    const snapshots: PlaybackSnapshot[] = result.data.transactions.edges
      .map((edge) => {
        const timestampTag = edge.node.tags.find((tag) => tag.name === "Timestamp")
        return {
          id: edge.node.id,
          timestamp: timestampTag?.value || "",
          data: null, // Will be loaded during preload
          isLoading: false,
        }
      })
      .filter((snapshot) => snapshot.timestamp)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)) // Most recent first (will be reversed in hook)

    const hasNextPage = result.data.transactions.pageInfo.hasNextPage
    const endCursor =
      result.data.transactions.edges.length > 0
        ? result.data.transactions.edges[result.data.transactions.edges.length - 1].cursor
        : null

    console.log(`Found ${snapshots.length} historical snapshots, hasNextPage: ${hasNextPage}`)
    return { snapshots, hasNextPage, endCursor }
  } catch (error) {
    console.error("Failed to fetch historical snapshots:", error)
    return { snapshots: [], hasNextPage: false, endCursor: null }
  }
}

// Fetch specific historical data by ID with retry logic
export async function fetchHistoricalData(
  id: string,
  retries = PLAYBACK_CONFIG.api.historical.retries,
): Promise<HistoricalData | null> {
  // Resolve gateway URLs
  const { dataUrl } = await resolveApiUrls()

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching historical data for ID: ${id} from ${dataUrl}`)

      const response = await fetch(`${dataUrl}/${id}`, {
        signal: AbortSignal.timeout(PLAYBACK_CONFIG.api.historical.timeout),
        headers: {
          Accept: "application/json",
          "Cache-Control": `max-age=${PLAYBACK_CONFIG.storage.cache.maxAge / 1000}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: HistoricalData = await response.json()

      // Validate the data structure
      if (!data.aircraft || !Array.isArray(data.aircraft)) {
        throw new Error("Invalid data structure: missing aircraft array")
      }

      console.log(`✓ Loaded historical data: ${data.aircraft.length} aircraft at ${data.timestamp}`)
      return data
    } catch (error) {
      console.error(`✗ Attempt ${attempt}/${retries} failed for ID ${id}:`, error)

      if (attempt === retries) {
        console.error(`Failed to fetch historical data for ID ${id} after ${retries} attempts`)
        return null
      }

      // Exponential backoff: wait 1s, 2s, 4s between retries
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return null
}

// Parallel data fetching with controlled concurrency
export async function fetchHistoricalDataParallel(
  snapshots: PlaybackSnapshot[],
  onProgress: (loaded: number, total: number, currentId: string) => void,
  concurrency = PLAYBACK_CONFIG.concurrency.parallel,
): Promise<PlaybackSnapshot[]> {
  const results = [...snapshots]
  const total = snapshots.length
  let completed = 0

  // Create a semaphore to limit concurrent requests
  const semaphore = new Array(concurrency).fill(null).map(() => Promise.resolve())
  let semaphoreIndex = 0

  const fetchWithSemaphore = async (snapshot: PlaybackSnapshot, index: number): Promise<void> => {
    // Wait for an available slot
    const currentSemaphore = semaphore[semaphoreIndex]
    semaphoreIndex = (semaphoreIndex + 1) % concurrency

    await currentSemaphore

    // Create new promise for this slot
    const promise = (async () => {
      try {
        results[index].isLoading = true
        onProgress(completed, total, snapshot.id)

        const data = await fetchHistoricalData(snapshot.id)

        results[index].data = data
        results[index].isLoading = false

        if (!data) {
          results[index].error = "Failed to load data"
        }

        completed++
        onProgress(completed, total, snapshot.id)
      } catch (error) {
        results[index].error = error instanceof Error ? error.message : "Unknown error"
        results[index].isLoading = false
        completed++
        onProgress(completed, total, snapshot.id)
      }
    })()

    // Update the semaphore slot
    semaphore[semaphoreIndex - 1 < 0 ? concurrency - 1 : semaphoreIndex - 1] = promise
  }

  // Start all fetches
  const fetchPromises = snapshots.map((snapshot, index) => fetchWithSemaphore(snapshot, index))

  // Wait for all to complete
  await Promise.all(fetchPromises)

  console.log(`✓ Parallel loading completed: ${completed}/${total} snapshots loaded`)
  return results
}

// Batch processing for large datasets
export async function fetchHistoricalDataBatched(
  snapshots: PlaybackSnapshot[],
  onProgress: (loaded: number, total: number, batchInfo: string) => void,
  batchSize = PLAYBACK_CONFIG.batchSize,
  concurrency = PLAYBACK_CONFIG.concurrency.background,
): Promise<PlaybackSnapshot[]> {
  const results = [...snapshots]
  const total = snapshots.length
  let completed = 0

  // Split into batches
  const batches: PlaybackSnapshot[][] = []
  for (let i = 0; i < snapshots.length; i += batchSize) {
    batches.push(snapshots.slice(i, i + batchSize))
  }

  console.log(`Processing ${total} snapshots in ${batches.length} batches of ${batchSize}`)

  // Process batches sequentially, but items within each batch in parallel
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const batchStart = batchIndex * batchSize

    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`)

    onProgress(completed, total, `Batch ${batchIndex + 1}/${batches.length}`)

    // Process this batch in parallel
    const batchPromises = batch.map(async (snapshot, localIndex) => {
      const globalIndex = batchStart + localIndex

      try {
        results[globalIndex].isLoading = true
        const data = await fetchHistoricalData(snapshot.id)

        results[globalIndex].data = data
        results[globalIndex].isLoading = false

        if (!data) {
          results[globalIndex].error = "Failed to load data"
        }

        completed++

        // Update progress more frequently within batch
        if (completed % 5 === 0 || completed === total) {
          onProgress(completed, total, `Batch ${batchIndex + 1}/${batches.length}`)
        }
      } catch (error) {
        results[globalIndex].error = error instanceof Error ? error.message : "Unknown error"
        results[globalIndex].isLoading = false
        completed++
      }
    })

    // Wait for this batch to complete before starting the next
    await Promise.all(batchPromises)

    // Small delay between batches to avoid overwhelming the server
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log(`✓ Batch loading completed: ${completed}/${total} snapshots loaded`)
  return results
}

// Progressive loading - load essential data first
export async function fetchHistoricalDataProgressive(
  snapshots: PlaybackSnapshot[],
  onProgress: (loaded: number, total: number, phase: string) => void,
  onEarlyData: (earlySnapshots: PlaybackSnapshot[]) => void,
): Promise<PlaybackSnapshot[]> {
  const total = snapshots.length
  const results = [...snapshots]
  const { earlyLoadCount, concurrency } = PLAYBACK_CONFIG

  // Phase 1: Load first N snapshots quickly for immediate playback
  const earlyCount = Math.min(earlyLoadCount, snapshots.length)
  const earlySnapshots = snapshots.slice(0, earlyCount)

  console.log(`Phase 1: Loading first ${earlyCount} snapshots for immediate playback`)
  onProgress(0, total, "Loading initial data for playback...")

  const earlyResults = await fetchHistoricalDataParallel(
    earlySnapshots,
    (loaded, earlyTotal, currentId) => {
      onProgress(loaded, total, `Loading initial data (${loaded}/${earlyTotal})`)
    },
    concurrency.initial,
  )

  // Update results with early data
  earlyResults.forEach((snapshot, index) => {
    results[index] = snapshot
  })

  // Notify that early data is ready
  onEarlyData(earlyResults)

  // Phase 2: Load remaining data in background
  if (snapshots.length > earlyCount) {
    const remainingSnapshots = snapshots.slice(earlyCount)
    console.log(`Phase 2: Loading remaining ${remainingSnapshots.length} snapshots in background`)

    const remainingResults = await fetchHistoricalDataBatched(
      remainingSnapshots,
      (loaded, remainingTotal, batchInfo) => {
        const totalLoaded = earlyCount + loaded
        onProgress(totalLoaded, total, `Background loading: ${batchInfo}`)
      },
      PLAYBACK_CONFIG.batchSize,
      concurrency.background,
    )

    // Update results with remaining data
    remainingResults.forEach((snapshot, index) => {
      results[earlyCount + index] = snapshot
    })
  }

  console.log(`✓ Progressive loading completed: ${total} snapshots loaded`)
  return results
}

// Format timestamp for display - UTC time for playback controls
export function formatTimestampUTC(timestamp: string): string {
  try {
    // Parse timestamp format: YYYYMMDDHHMM
    const year = Number.parseInt(timestamp.substring(0, 4))
    const month = Number.parseInt(timestamp.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(timestamp.substring(6, 8))
    const hour = Number.parseInt(timestamp.substring(8, 10))
    const minute = Number.parseInt(timestamp.substring(10, 12))

    const date = new Date(Date.UTC(year, month, day, hour, minute))
    return date.toISOString().replace("T", " ").substring(0, 19) + " UTC"
  } catch (error) {
    return timestamp
  }
}

// Format timestamp for display - Local time for general use
export function formatTimestampLocal(timestamp: string): string {
  try {
    // Parse timestamp format: YYYYMMDDHHMM
    const year = Number.parseInt(timestamp.substring(0, 4))
    const month = Number.parseInt(timestamp.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(timestamp.substring(6, 8))
    const hour = Number.parseInt(timestamp.substring(8, 10))
    const minute = Number.parseInt(timestamp.substring(10, 12))

    // Create UTC date first, then convert to local
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute))
    return utcDate.toLocaleString()
  } catch (error) {
    return timestamp
  }
}

// Legacy function for backward compatibility - defaults to UTC for playback
export function formatTimestamp(timestamp: string): string {
  return formatTimestampUTC(timestamp)
}

// Parse UTC timestamp from historical data
export function parseUTCTimestamp(utcString: string): Date {
  return new Date(utcString)
}

// Get time range for playback
export function getPlaybackTimeRange(snapshots: PlaybackSnapshot[]): { start: Date; end: Date } | null {
  if (snapshots.length === 0) return null

  const timestamps = snapshots
    .map((s) => formatTimestampUTC(s.timestamp))
    .map((t) => new Date(t))
    .filter((d) => !isNaN(d.getTime()))

  if (timestamps.length === 0) return null

  return {
    start: new Date(Math.min(...timestamps.map((d) => d.getTime()))),
    end: new Date(Math.max(...timestamps.map((d) => d.getTime()))),
  }
}
