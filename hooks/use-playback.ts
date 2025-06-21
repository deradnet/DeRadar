"use client"

import { useState, useEffect, useCallback } from "react"
import type { Aircraft } from "@/types/aircraft"
import {
  fetchHistoricalSnapshots,
  fetchHistoricalDataProgressive,
  type PlaybackSnapshot,
  type HistoricalData,
  type FetchOptions,
} from "@/utils/arweave-data"
import { APP_CONFIG } from "@/config/app.config"

// Remove the static configuration
// const PLAYBACK_CONFIG = {
//   defaultSpeed: 1,
//   defaultRange: 50,
//   baseInterval: 1500,
// }

export interface PlaybackState {
  isPlaying: boolean
  currentIndex: number
  snapshots: PlaybackSnapshot[]
  currentData: HistoricalData | null
  playbackSpeed: number
  isLoading: boolean
  error: string | null
  loadingProgress: number
  totalSnapshots: number
  isPreloading: boolean
  hasNextPage: boolean
  endCursor: string | null
  selectedRange: number
  isLoadingMore: boolean
  loadingPhase: string
  canStartPlayback: boolean
  backgroundLoading: boolean
}

export function usePlayback() {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: 0,
    snapshots: [],
    currentData: null,
    playbackSpeed: APP_CONFIG.playback.defaultSpeed, // This will be 4
    isLoading: false,
    error: null,
    loadingProgress: 0,
    totalSnapshots: 0,
    isPreloading: false,
    hasNextPage: false,
    endCursor: null,
    selectedRange: APP_CONFIG.playback.defaultRange, // This will be 50
    isLoadingMore: false,
    loadingPhase: "",
    canStartPlayback: false,
    backgroundLoading: false,
  })

  // Load available snapshots on mount
  useEffect(() => {
    loadSnapshots()
  }, [])

  const loadSnapshots = async (options: FetchOptions = {}) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      isPreloading: true,
      isLoadingMore: !!options.after,
      loadingPhase: "Fetching snapshot list...",
      canStartPlayback: false,
      backgroundLoading: false,
    }))

    try {
      console.log("🚀 Starting fast data loading process...")
      const startTime = performance.now()

      const result = await fetchHistoricalSnapshots({
        first: options.first || state.selectedRange,
        after: options.after,
      })

      if (result.snapshots.length === 0 && !options.after) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPreloading: false,
          isLoadingMore: false,
          error: "No historical data available",
        }))
        return
      }

      // Sort snapshots from oldest to newest (reverse the default order)
      const sortedSnapshots = [...result.snapshots].reverse()

      // If loading more, append to existing snapshots
      const allSnapshots = options.after ? [...state.snapshots, ...sortedSnapshots] : sortedSnapshots

      setState((prev) => ({
        ...prev,
        snapshots: allSnapshots,
        totalSnapshots: allSnapshots.length,
        currentIndex: options.after ? prev.currentIndex : 0,
        hasNextPage: result.hasNextPage,
        endCursor: result.endCursor,
        isLoadingMore: false,
        loadingPhase: "Preparing progressive data loading...",
      }))

      console.log(`📊 Found ${allSnapshots.length} total snapshots, starting progressive loading...`)

      // Use progressive loading for super fast initial playback
      await preloadDataProgressive(allSnapshots, options.after ? state.snapshots.length : 0)

      const endTime = performance.now()
      console.log(`⚡ Total loading time: ${((endTime - startTime) / 1000).toFixed(2)}s`)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPreloading: false,
        isLoadingMore: false,
        error: error instanceof Error ? error.message : "Failed to load snapshots",
      }))
    }
  }

  const loadMoreSnapshots = useCallback(async () => {
    if (!state.hasNextPage || !state.endCursor || state.isLoadingMore) return

    await loadSnapshots({
      first: state.selectedRange,
      after: state.endCursor,
    })
  }, [state.hasNextPage, state.endCursor, state.selectedRange, state.isLoadingMore])

  const changeRange = useCallback(async (newRange: number) => {
    setState((prev) => ({ ...prev, selectedRange: newRange }))

    // Reload with new range
    await loadSnapshots({ first: newRange })
  }, [])

  const preloadDataProgressive = async (snapshots: PlaybackSnapshot[], startIndex = 0) => {
    if (startIndex === 0) {
      setState((prev) => ({ ...prev, loadingProgress: 0 }))
    }

    const snapshotsToLoad = startIndex === 0 ? snapshots : snapshots.slice(startIndex)

    try {
      // Use progressive loading for super fast initial experience
      const loadedSnapshots = await fetchHistoricalDataProgressive(
        snapshotsToLoad,
        (loaded, total, phase) => {
          const progress = (loaded / total) * 100
          setState((prev) => ({
            ...prev,
            loadingProgress: progress,
            loadingPhase: phase,
            snapshots: startIndex === 0 ? snapshots : [...state.snapshots, ...snapshots.slice(startIndex)],
          }))
        },
        (earlySnapshots) => {
          // Early data callback - enable playback as soon as first few snapshots are ready
          console.log("🎬 Early data ready! Enabling playback...")

          if (startIndex === 0) {
            // Update snapshots with early data
            const updatedSnapshots = [...snapshots]
            earlySnapshots.forEach((snapshot, index) => {
              updatedSnapshots[index] = snapshot
            })

            setState((prev) => ({
              ...prev,
              snapshots: updatedSnapshots,
              currentData: earlySnapshots[0]?.data || null,
              currentIndex: 0,
              canStartPlayback: true,
              isPlaying: true, // Auto-start playback
              isPreloading: false,
              isLoading: false,
              backgroundLoading: true,
              loadingPhase: "Auto-playing! Loading more data in background...",
            }))
          }
        },
      )

      // Update all snapshots with loaded data
      if (startIndex === 0) {
        setState((prev) => ({
          ...prev,
          snapshots: loadedSnapshots,
          backgroundLoading: false,
          loadingProgress: 100,
          loadingPhase: "All data loaded!",
        }))
      } else {
        setState((prev) => ({
          ...prev,
          snapshots: [...state.snapshots, ...loadedSnapshots],
          backgroundLoading: false,
          loadingProgress: 100,
        }))
      }

      console.log("✅ Progressive data loading completed!")
    } catch (error) {
      console.error("❌ Progressive loading failed:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPreloading: false,
        backgroundLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }))
    }
  }

  const loadSnapshotData = useCallback(
    (index: number) => {
      if (index < 0 || index >= state.snapshots.length) return

      const snapshot = state.snapshots[index]

      // Data should already be preloaded
      if (snapshot.data) {
        setState((prev) => ({
          ...prev,
          currentData: snapshot.data,
          currentIndex: index,
        }))
      } else if (snapshot.isLoading) {
        setState((prev) => ({
          ...prev,
          error: "Data is still loading for this snapshot",
        }))
      } else {
        console.warn(`Data not available for snapshot ${index}`)
        setState((prev) => ({
          ...prev,
          error: "Data not available for this snapshot",
        }))
      }
    },
    [state.snapshots],
  )

  const play = useCallback(() => {
    if (!state.canStartPlayback) {
      setState((prev) => ({ ...prev, error: "Please wait for initial data to load" }))
      return
    }
    setState((prev) => ({ ...prev, isPlaying: true, error: null }))
  }, [state.canStartPlayback])

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const stop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentIndex: 0,
    }))
    if (state.snapshots.length > 0 && state.snapshots[0].data) {
      setState((prev) => ({
        ...prev,
        currentData: state.snapshots[0].data,
      }))
    }
  }, [state.snapshots])

  const seekTo = useCallback(
    (index: number) => {
      if (!state.canStartPlayback) {
        setState((prev) => ({ ...prev, error: "Please wait for initial data to load" }))
        return
      }
      if (index >= 0 && index < state.snapshots.length) {
        loadSnapshotData(index)
      }
    },
    [state.snapshots, state.canStartPlayback, loadSnapshotData],
  )

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, playbackSpeed: speed }))
  }, [])

  const nextSnapshot = useCallback(() => {
    if (!state.canStartPlayback) return

    const nextIndex = state.currentIndex + 1
    if (nextIndex < state.snapshots.length) {
      loadSnapshotData(nextIndex)
    } else if (state.isPlaying) {
      // Loop back to start (oldest data)
      loadSnapshotData(0)
    }
  }, [state.currentIndex, state.snapshots, state.isPlaying, state.canStartPlayback, loadSnapshotData])

  const previousSnapshot = useCallback(() => {
    if (!state.canStartPlayback) return

    const prevIndex = state.currentIndex - 1
    if (prevIndex >= 0) {
      loadSnapshotData(prevIndex)
    }
  }, [state.currentIndex, state.canStartPlayback, loadSnapshotData])

  // Auto-advance playback
  useEffect(() => {
    if (!state.isPlaying || state.snapshots.length === 0 || !state.canStartPlayback) return

    const interval = setInterval(() => {
      nextSnapshot()
    }, APP_CONFIG.playback.baseInterval / state.playbackSpeed)

    return () => clearInterval(interval)
  }, [state.isPlaying, state.playbackSpeed, state.canStartPlayback, nextSnapshot])

  // Get current aircraft data for map
  const getCurrentAircraft = useCallback((): Aircraft[] => {
    return state.currentData?.aircraft || []
  }, [state.currentData])

  return {
    ...state,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
    nextSnapshot,
    previousSnapshot,
    getCurrentAircraft,
    loadMoreSnapshots,
    changeRange,
    reload: () => loadSnapshots(),
  }
}
