"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  Calendar,
  ChevronUp,
  ChevronDown,
  Download,
  Database,
  Plus,
  Zap,
  Clock,
} from "lucide-react"
import { formatTimestampUTC } from "@/utils/arweave-data"
import type { PlaybackState } from "@/hooks/use-playback"

interface PlaybackControlsProps {
  playbackState: PlaybackState
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeekTo: (index: number) => void
  onSetSpeed: (speed: number) => void
  onNext: () => void
  onPrevious: () => void
  onReload: () => void
  onLoadMore: () => void
  onChangeRange: (range: number) => void
}

export function PlaybackControls({
  playbackState,
  onPlay,
  onPause,
  onStop,
  onSeekTo,
  onSetSpeed,
  onNext,
  onPrevious,
  onReload,
  onLoadMore,
  onChangeRange,
}: PlaybackControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    isPlaying,
    currentIndex,
    snapshots,
    currentData,
    playbackSpeed,
    isLoading,
    error,
    loadingProgress,
    totalSnapshots,
    isPreloading,
    hasNextPage,
    selectedRange,
    isLoadingMore,
    loadingPhase,
    canStartPlayback,
    backgroundLoading,
  } = playbackState

  const currentSnapshot = snapshots[currentIndex]

  // Get data range for display
  const getDataRange = () => {
    if (snapshots.length === 0) return "No data"

    const oldest = snapshots[0]
    const newest = snapshots[snapshots.length - 1]

    if (!oldest || !newest) return "Loading..."

    const oldestTime = formatTimestampUTC(oldest.timestamp)
    const newestTime = formatTimestampUTC(newest.timestamp)

    // Format as date range
    const oldestDate = new Date(oldestTime).toLocaleDateString()
    const newestDate = new Date(newestTime).toLocaleDateString()

    if (oldestDate === newestDate) {
      // Same day, show time range
      const oldestTimeOnly = new Date(oldestTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const newestTimeOnly = new Date(newestTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      return `${oldestDate} ${oldestTimeOnly} → ${newestTimeOnly} UTC`
    } else {
      // Different days, show date range
      return `${oldestDate} → ${newestDate} UTC`
    }
  }

  return (
    <Card className="bg-slate-900/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canStartPlayback ? (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              )}
              <span className="font-medium text-white text-sm">
                {canStartPlayback ? (backgroundLoading ? "Playing + Loading" : "Ready") : "Loading Data"}
              </span>
              {(isLoading || isPreloading || backgroundLoading) && (
                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
              )}
              {canStartPlayback && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Zap className="w-3 h-3" />
                  <span>
                    <strong>Turbo Load</strong>
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>powered by</span>
                    <img src="/ar-io-logo.svg" alt="ar.io" className="w-12 h-12" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReload}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                disabled={isLoading || isPreloading}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Range Selector */}
          {!isPreloading && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 min-w-fit">Range:</span>
              <Select value={selectedRange.toString()} onValueChange={(value) => onChangeRange(Number.parseInt(value))}>
                <SelectTrigger className="h-6 text-xs bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="25" className="text-white text-xs">
                    25 scenes
                  </SelectItem>
                  <SelectItem value="50" className="text-white text-xs">
                    50 scenes
                  </SelectItem>
                  <SelectItem value="100" className="text-white text-xs">
                    100 scenes
                  </SelectItem>
                  <SelectItem value="200" className="text-white text-xs">
                    200 scenes
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasNextPage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  {isLoadingMore ? (
                    <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Load More
                </Button>
              )}
            </div>
          )}

          {/* Loading Progress */}
          {(isPreloading || backgroundLoading) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  {canStartPlayback ? (
                    <>
                      <Clock className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Background loading</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 text-purple-400" />
                      <span>Super-fast parallel loading</span>
                    </>
                  )}
                </span>
                <span className="text-slate-400 font-mono">
                  {Math.round(loadingProgress)}% ({Math.round((loadingProgress * totalSnapshots) / 100)}/
                  {totalSnapshots})
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 flex items-center justify-end pr-1 ${
                    canStartPlayback
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : "bg-gradient-to-r from-purple-500 to-purple-600"
                  }`}
                  style={{ width: `${loadingProgress}%` }}
                >
                  {loadingProgress > 20 && (
                    <Download className={`w-2 h-2 animate-bounce ${canStartPlayback ? "text-white" : "text-white"}`} />
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center">
                {loadingPhase || "Loading historical aircraft data with parallel processing"}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">{error}</div>
          )}

          {/* Current Time Display with Clickable Data ID */}
          {currentSnapshot && canStartPlayback && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3 h-3" />
                <span className="font-mono">{formatTimestampUTC(currentSnapshot.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">
                  {currentIndex + 1}/{snapshots.length}
                </span>
                <button
                  onClick={() => window.open(`https://derad.network/${currentSnapshot.id}`, "_blank")}
                  className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer font-mono"
                  title="View raw data"
                >
                  {currentSnapshot.id.substring(0, 6)}...
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {canStartPlayback && (
            <div className="space-y-1">
              <Slider
                value={[currentIndex]}
                onValueChange={([value]) => onSeekTo(value)}
                min={0}
                max={Math.max(0, snapshots.length - 1)}
                step={1}
                className="w-full"
                disabled={isLoading || snapshots.length === 0}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-mono">
                  {snapshots.length > 0 ? formatTimestampUTC(snapshots[0]?.timestamp).split(" ")[1] : "--:--"}
                </span>
                <span className="text-slate-400 text-center font-medium">{getDataRange()}</span>
                <span className="font-mono">
                  {snapshots.length > 0
                    ? formatTimestampUTC(snapshots[snapshots.length - 1]?.timestamp).split(" ")[1]
                    : "--:--"}
                </span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {canStartPlayback && (
            <div className="flex items-center justify-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrevious}
                disabled={isLoading || currentIndex === 0}
                className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                <SkipBack className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={isPlaying ? onPause : onPlay}
                disabled={isLoading || snapshots.length === 0}
                className="h-8 w-8 p-0 text-white hover:bg-green-600/20 bg-green-600/10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onStop}
                disabled={isLoading || (!isPlaying && currentIndex === 0)}
                className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                <Square className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                disabled={isLoading || currentIndex === snapshots.length - 1}
                className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                <SkipForward className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Speed Control */}
          {canStartPlayback && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 min-w-fit">Speed:</span>
              <Select value={playbackSpeed.toString()} onValueChange={(value) => onSetSpeed(Number.parseFloat(value))}>
                <SelectTrigger className="h-6 text-xs bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="0.25" className="text-white text-xs">
                    0.25x
                  </SelectItem>
                  <SelectItem value="0.5" className="text-white text-xs">
                    0.5x
                  </SelectItem>
                  <SelectItem value="1" className="text-white text-xs">
                    1x
                  </SelectItem>
                  <SelectItem value="2" className="text-white text-xs">
                    2x
                  </SelectItem>
                  <SelectItem value="4" className="text-white text-xs">
                    4x
                  </SelectItem>
                  <SelectItem value="8" className="text-white text-xs">
                    8x
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && currentData && canStartPlayback && (
            <div className="pt-2 border-t border-slate-700/50 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Source:</span>
                  <div className="text-white font-mono text-xs">{currentData.source}</div>
                </div>
                <div>
                  <span className="text-slate-400">Messages:</span>
                  <div className="text-white font-mono text-xs">{currentData.messages?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">Aircraft:</span>
                  <div className="text-white font-mono text-xs">{currentData.aircraft?.length || 0}</div>
                </div>
                <div>
                  <span className="text-slate-400">UTC:</span>
                  <div className="text-white font-mono text-xs">
                    {currentData.timestamp?.split("T")[1]?.split(".")[0]}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-slate-400">Playback Direction:</span> Chronological (Oldest → Newest)
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-slate-400">Interval:</span> 1.5 seconds per data pack
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-slate-400">Loading Method:</span> Progressive parallel loading
              </div>
            </div>
          )}

          {/* Status */}
          <div className="text-center text-xs text-slate-500">
            {!canStartPlayback
              ? `Loading data... ${Math.round(loadingProgress)}%`
              : backgroundLoading
                ? `Playing + Background loading (${Math.round(loadingProgress)}%)`
                : isLoading
                  ? "Loading..."
                  : snapshots.length === 0
                    ? "No data"
                    : isPlaying
                      ? `Playing ${playbackSpeed}x (${currentIndex + 1}/${snapshots.length})`
                      : `Paused (${currentIndex + 1}/${snapshots.length})`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
