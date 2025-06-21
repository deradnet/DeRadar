"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plane,
  Clock,
  Database,
  Calendar,
  Activity,
  Globe,
  Zap,
} from "lucide-react"
import { fetchHistoricalSnapshots, fetchHistoricalData, formatTimestampLocal } from "@/utils/arweave-data"
import type { PlaybackSnapshot } from "@/utils/arweave-data"

interface SnapshotWithCount extends PlaybackSnapshot {
  aircraftCount?: number
  isCountLoading?: boolean
}

export function DataUploadsSection() {
  const [snapshots, setSnapshots] = useState<SnapshotWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch more snapshots for the main section (25 instead of 10)
        const result = await fetchHistoricalSnapshots({ first: 25 })
        setSnapshots(result.snapshots.map((snapshot) => ({ ...snapshot, aircraftCount: 0, isCountLoading: false })))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data uploads")
        console.error("Failed to fetch data uploads:", err)
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

  const displayedSnapshots = snapshots.slice(0, 9)
  const totalAircraftCount = snapshots.reduce((sum, snapshot) => sum + (snapshot.aircraftCount || 0), 0)

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl backdrop-blur-sm">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Aircraft Data Archive</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Historical aircraft tracking data stored on Arweave</p>
              </div>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-slate-700 rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
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
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl backdrop-blur-sm">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            Aircraft Data Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-red-400">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium">Failed to load data archive</div>
            <div className="text-sm text-slate-500 mt-2">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl backdrop-blur-sm">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Aircraft Data Archive</CardTitle>
              <p className="text-sm text-slate-400 mt-1">Historical aircraft tracking data stored on Arweave</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {displayedSnapshots.map((snapshot) => {
            const isExpanded = expandedItems.has(snapshot.id)
            const aircraftCount = snapshot.aircraftCount || 0
            const isCountLoading = snapshot.isCountLoading || false
            const formattedTime = formatTimestampLocal(snapshot.timestamp)
            const relativeTime = formatRelativeTime(snapshot.timestamp)

            return (
              <Collapsible key={snapshot.id}>
                <Card className="bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 hover:bg-slate-800/60 cursor-pointer">
                  <CollapsibleTrigger onClick={() => toggleExpanded(snapshot.id)} className="w-full text-left">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-mono text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-300">
                            {snapshot.id.slice(0, 8)}...{snapshot.id.slice(-8)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewOnDerad(snapshot.id)
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-500/20 rounded">
                            <Plane className="w-3 h-3 text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Data Package</div>
                            <div className="text-xs text-slate-400">Click to expand</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/20 rounded">
                            <Clock className="w-3 h-3 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{relativeTime}</div>
                            <div className="text-xs text-slate-400">Upload time</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t border-slate-700/50">
                      <div className="space-y-4 mt-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Plane className="w-4 h-4 text-green-400" />
                            <span className="text-slate-300 font-medium">Aircraft Count</span>
                          </div>
                          <div className="text-white font-bold text-sm ml-6">
                            {isCountLoading ? (
                              <span className="animate-pulse text-slate-400">Loading...</span>
                            ) : (
                              `${aircraftCount.toLocaleString()}`
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-400 font-medium">Full Timestamp</span>
                            </div>
                            <div className="text-slate-300 ml-5">{formattedTime}</div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-400 font-medium">Network</span>
                            </div>
                            <div className="text-slate-300 ml-5">Arweave via Ar.io Turbo</div>
                          </div>

                          {snapshot.data && (
                            <>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-400 font-medium">Data Source</span>
                                </div>
                                <div className="text-slate-300 ml-5">{snapshot.data.source || "ADS-B Network"}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Zap className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-400 font-medium">Total messages received by antenna</span>
                                </div>
                                <div className="text-slate-300 font-semibold ml-5">
                                  {snapshot.data.messages?.toLocaleString() || "N/A"}
                                </div>
                              </div>
                            </>
                          )}

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Database className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-400 font-medium">Transaction ID</span>
                            </div>
                            <div className="text-slate-300 font-mono text-xs break-all bg-slate-900/50 p-3 rounded ml-5 mt-1">
                              {snapshot.id}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-700/50">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewOnDerad(snapshot.id)
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open on Derad Network Gateway
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>

        {snapshots.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <Database className="w-10 h-10 opacity-50" />
            </div>
            <div className="text-xl font-medium mb-2">No data uploads found</div>
            <div className="text-sm text-slate-500">Last 9 aircraft data uploads will appear here when available</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
