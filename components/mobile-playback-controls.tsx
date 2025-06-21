"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  ChevronUp,
  Database,
  Clock,
  Zap,
  Square,
  RotateCcw,
  Plus,
  Download,
} from "lucide-react"
import { formatTimestampUTC } from "@/utils/arweave-data"
import type { PlaybackState } from "@/hooks/use-playback"

interface MobilePlaybackControlsProps {
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

export function MobilePlaybackControls({
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
}: MobilePlaybackControlsProps) {
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
    <>
      {/* Bottom Navigation Bar - Instagram Style with Higher Z-Index */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50 safe-area-pb shadow-2xl">
        <div className="px-4 py-3">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between mb-2">
            {/* Left: Status */}
            <div className="flex items-center gap-2 flex-1">
              {canStartPlayback ? (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              )}
              <span className="font-medium text-white text-sm truncate">
                {canStartPlayback ? (backgroundLoading ? "Playing" : "Ready") : "Loading"}
              </span>
            </div>

            {/* Center: Main Controls */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrevious}
                disabled={!canStartPlayback || currentIndex === 0}
                className="h-10 w-10 p-0 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full touch-manipulation"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={isPlaying ? onPause : onPlay}
                disabled={!canStartPlayback || snapshots.length === 0}
                className="h-12 w-12 p-0 text-white bg-green-600/20 hover:bg-green-600/30 rounded-full border border-green-500/30 touch-manipulation"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                disabled={!canStartPlayback || currentIndex === snapshots.length - 1}
                className="h-10 w-10 p-0 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full touch-manipulation"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Right: Expand/Info */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {currentSnapshot && canStartPlayback && (
                <div className="text-xs text-slate-400 text-right">
                  <div className="font-mono">
                    {currentIndex + 1}/{snapshots.length}
                  </div>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full touch-manipulation"
              >
                <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Turbo Load Branding - Below Controls */}
          {canStartPlayback && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Zap className="w-3 h-3" />
                <span>
                  <strong>Turbo Load</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="text-[10px]">powered by</span>
                <img src="/ar-io-logo.svg" alt="ar.io" className="w-14 h-14" />
              </div>
            </div>
          )}

          {/* Progress Slider */}
          {canStartPlayback && (
            <div className="mb-2">
              <Slider
                value={[currentIndex]}
                onValueChange={([value]) => onSeekTo(value)}
                min={0}
                max={Math.max(0, snapshots.length - 1)}
                step={1}
                className="w-full touch-manipulation"
                disabled={isLoading || snapshots.length === 0}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span className="font-mono">
                  {snapshots.length > 0 ? formatTimestampUTC(snapshots[0]?.timestamp).split(" ")[1] : "--:--"}
                </span>
                <span className="font-mono">
                  {snapshots.length > 0
                    ? formatTimestampUTC(snapshots[snapshots.length - 1]?.timestamp).split(" ")[1]
                    : "--:--"}
                </span>
              </div>
            </div>
          )}

          {/* Loading Progress */}
          {(isPreloading || backgroundLoading) && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  {canStartPlayback ? (
                    <>
                      <Clock className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Background</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 text-purple-400" />
                      <span>Loading</span>
                    </>
                  )}
                </span>
                <span className="text-slate-400 font-mono text-xs">{Math.round(loadingProgress)}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 flex items-center justify-end pr-1 ${
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
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs mb-2">{error}</div>
          )}
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-3">
              {/* Range Selector */}
              {!isPreloading && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 min-w-fit">Range:</span>
                  <Select
                    value={selectedRange.toString()}
                    onValueChange={(value) => onChangeRange(Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-6 text-xs bg-slate-700/50 border-slate-600/50 text-white touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 z-[10000]">
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
                      className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 touch-manipulation"
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

              {/* Speed Control */}
              {canStartPlayback && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 min-w-fit">Speed:</span>
                  <Select
                    value={playbackSpeed.toString()}
                    onValueChange={(value) => onSetSpeed(Number.parseFloat(value))}
                  >
                    <SelectTrigger className="h-6 text-xs bg-slate-700/50 border-slate-600/50 text-white touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 z-[10000]">
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

              {/* Additional Controls */}
              {canStartPlayback && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onStop}
                    disabled={isLoading || (!isPlaying && currentIndex === 0)}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 touch-manipulation"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onReload}
                    disabled={isLoading || isPreloading}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 touch-manipulation"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reload
                  </Button>
                </div>
              )}

              {/* Current Time Display */}
              {currentSnapshot && canStartPlayback && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-3 h-3" />
                    <span className="font-mono">{formatTimestampUTC(currentSnapshot.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => window.open(`https://derad.network/${currentSnapshot.id}`, "_blank")}
                    className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer font-mono touch-manipulation"
                    title="View raw data"
                  >
                    {currentSnapshot.id.substring(0, 8)}...
                  </button>
                </div>
              )}

              {/* Data Details */}
              {currentData && canStartPlayback && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Aircraft:</span>
                    <div className="text-white font-mono">{currentData.aircraft?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Messages:</span>
                    <div className="text-white font-mono">{currentData.messages?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Source:</span>
                    <div className="text-white font-mono text-xs">{currentData.source}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">UTC:</span>
                    <div className="text-white font-mono text-xs">
                      {currentData.timestamp?.split("T")[1]?.split(".")[0]}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Range */}
              {canStartPlayback && (
                <div className="text-xs text-slate-400 text-center">
                  <span className="font-medium">{getDataRange()}</span>
                </div>
              )}

              {/* Loading Phase */}
              {(isPreloading || backgroundLoading) && (
                <div className="text-xs text-slate-500 text-center">
                  {loadingPhase || "Loading historical aircraft data with parallel processing"}
                </div>
              )}

              {/* Additional Info */}
              {canStartPlayback && (
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="text-center">
                    <span className="text-slate-400">Playback Direction:</span> Chronological (Oldest → Newest)
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400">Interval:</span> 1.5 seconds per data pack
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400">Loading Method:</span> Progressive parallel loading
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-700/50">
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
          </div>
        )}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-20 md:h-0" />
    </>
  )
}
