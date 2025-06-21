"use client"

import { Button } from "@/components/ui/button"
import { Radar, Settings, Wallet } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

interface AppHeaderProps {
  lastUpdate: Date
  onSettingsClick: () => void
  onArweaveClick: () => void
  isPlaybackMode: boolean
  onModeChange: (mode: "live" | "playback") => void
  walletConnected?: boolean
  walletAddress?: string | null
}

export function AppHeader({
  lastUpdate,
  onSettingsClick,
  onArweaveClick,
  isPlaybackMode,
  onModeChange,
  walletConnected = false,
  walletAddress = null,
}: AppHeaderProps) {
  const getWalletButtonText = () => {
    if (walletConnected && walletAddress) {
      return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    }
    return "Connect Wallet"
  }

  return (
    <div
      className={`bg-slate-900/30 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 ${isPlaybackMode ? "border-purple-500/30" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl shadow-lg ${isPlaybackMode ? "bg-gradient-to-r from-purple-600 to-purple-700" : "bg-gradient-to-r from-blue-600 to-blue-700"}`}
              >
                <Radar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">DeRadar</h1>
                  <span className="relative -top-1 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-sm backdrop-blur-sm">
                    BETA
                  </span>
                </div>
                <p className="text-sm text-slate-400 hidden sm:block">
                  {isPlaybackMode ? "Historical aircraft monitoring" : "Real-time aircraft monitoring"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div
                className={`w-2 h-2 rounded-full ${isPlaybackMode ? "bg-purple-500 animate-pulse" : "bg-green-500 animate-pulse"}`}
              ></div>
              <span>{lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Toggle
              aria-label="Enable historical playback"
              pressed={isPlaybackMode}
              onPressedChange={(pressed) => onModeChange(pressed ? "playback" : "live")}
              className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300 hover:text-white"
            >
              {isPlaybackMode ? "Playback" : "Live"}
            </Toggle>
            <Button
              size="sm"
              variant="outline"
              onClick={onArweaveClick}
              className={`border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300 hover:text-white ${
                walletConnected ? "border-green-500/30 bg-green-900/20" : ""
              }`}
            >
              <Wallet className={`w-4 h-4 mr-2 ${walletConnected ? "text-green-400" : ""}`} />
              <span className="hidden sm:inline">{getWalletButtonText()}</span>
              <span className="sm:hidden">
                <Wallet className="w-4 h-4" />
              </span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSettingsClick}
              className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
