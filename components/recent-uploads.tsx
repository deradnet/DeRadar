"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"
import { fetchHistoricalSnapshots, fetchHistoricalData } from "@/utils/arweave-data"
import type { PlaybackSnapshot } from "@/utils/arweave-data"

interface SnapshotWithCount extends PlaybackSnapshot {
  aircraftCount?: number
  isCountLoading?: boolean
}

export function RecentUploads() {
  const [snapshots, setSnapshots] = useState<SnapshotWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch only 10 recent snapshots
        const result = await fetchHistoricalSnapshots({ first: 10 })
        setSnapshots(result.snapshots.map((snapshot) => ({ ...snapshot, aircraftCount: 0, isCountLoading: false })))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recent uploads")
        console.error("Failed to fetch recent uploads:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSnapshots()
    // Refresh every 2 minutes
    const interval = setInterval(loadSnapshots, 120000)
    return () => clearInterval(interval)
  }, [])

  const loadAircraftCount = async (snapshot: SnapshotWithCount) => {
    if (snapshot.aircraftCount !== undefined && snapshot.aircraftCount > 0) {
      return // Already loaded
    }

    // Set loading state
    setSnapshots((prev) => prev.map((s) => (s.id === snapshot.id ? { ...s, isCountLoading: true } : s)))

    try {
      // Fetch the actual data using the same function used for playback
      const data = await fetchHistoricalData(snapshot.id)

      let aircraftCount = 0
      if (data && data.aircraft && Array.isArray(data.aircraft)) {
        aircraftCount = data.aircraft.length
      }

      // Update the snapshot with the actual count
      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapshot.id ? { ...s, aircraftCount, isCountLoading: false, data } : s)),
      )
    } catch (error) {
      console.error("Failed to load aircraft count for snapshot:", snapshot.id, error)
      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapshot.id ? { ...s, aircraftCount: 0, isCountLoading: false } : s)),
      )
    }
  }

  const toggleExpanded = async (id: string) => {
    const newExpanded = new Set(expandedItems)
    const snapshot = snapshots.find((s) => s.id === id)

    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
      // Load aircraft count when expanding if not already loaded
      if (snapshot && (snapshot.aircraftCount === undefined || snapshot.aircraftCount === 0)) {
        await loadAircraftCount(snapshot)
      }
    }
    setExpandedItems(newExpanded)
  }

  const formatRelativeTime = (timestamp: string) => {
    try {
      const year = Number.parseInt(timestamp.substring(0, 4))
      const month = Number.parseInt(timestamp.substring(4, 6)) - 1
      const day = Number.parseInt(timestamp.substring(6, 8))
      const hour = Number.parseInt(timestamp.substring(8, 10))
      const minute = Number.parseInt(timestamp.substring(10, 12))

      const date = new Date(Date.UTC(year, month, day, hour, minute))
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      return timestamp
    }
  }

  const handleViewOnDerad = (id: string) => {
    window.open(`https://derad.network/${id}`, "_blank", "noopener,noreferrer")
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5" />
            Recent Aircraft Data Uploads via Ar.io Turbo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5" />
            Recent Aircraft Data Uploads via Ar.io Turbo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-400">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>Failed to load recent uploads</div>
            <div className="text-sm text-slate-500 mt-1">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg backdrop-blur-sm">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Data Uploads</h3>
              <p className="text-sm text-slate-400">Latest aircraft data via Ar.io Turbo</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1">
            {snapshots.length} uploads
          </Badge>
        </div>
      </div>
      {/* Content removed - showing header only */}
    </div>
  )
}
