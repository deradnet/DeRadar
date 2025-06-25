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
                className={`group relative p-3 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-125 hover:rotate-3 ${
                  isPlaybackMode
                    ? "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800"
                    : "bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-800"
                } hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:border hover:border-white/30`}
                style={{
                  background: isPlaybackMode
                    ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 25%, #4f46e5 50%, #3730a3 75%, #1e1b4b 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #0891b2 25%, #0284c7 50%, #0369a1 75%, #1e3a8a 100%)",
                }}
              >
                {/* Main radar icon - CLEAN DEFAULT with SMOOTH HOVER TRANSFORM */}
                <Radar
                  className="w-6 h-6 text-white relative z-20 transition-all duration-700 ease-out will-change-transform group-hover:rotate-[360deg] group-hover:scale-150 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:text-cyan-100"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
                  }}
                />

                {/* All spectacular effects - ONLY on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none">
                  {/* Holographic base layer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse rounded-xl"></div>

                  {/* Multiple radar sweeps at different speeds */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-conic-fast from-transparent via-white/40 to-transparent animate-spin-fast rounded-full"></div>
                    <div className="absolute inset-0 bg-gradient-conic-slow from-transparent via-cyan-300/30 to-transparent animate-spin-slow rounded-full"></div>
                    <div className="absolute inset-0 bg-gradient-conic-reverse from-transparent via-blue-300/20 to-transparent animate-spin-reverse rounded-full"></div>
                  </div>

                  {/* Electromagnetic field rings */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping"></div>
                    <div
                      className="absolute inset-1 border border-cyan-300/30 rounded-full animate-ping"
                      style={{ animationDelay: "200ms" }}
                    ></div>
                    <div
                      className="absolute inset-2 border border-blue-300/20 rounded-full animate-ping"
                      style={{ animationDelay: "500ms" }}
                    ></div>
                  </div>

                  {/* Digital matrix rain effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-1 w-px h-full bg-gradient-to-b from-transparent via-green-400/50 to-transparent animate-matrix-rain"></div>
                    <div
                      className="absolute top-0 left-3 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent animate-matrix-rain"
                      style={{ animationDelay: "100ms" }}
                    ></div>
                    <div
                      className="absolute top-0 right-1 w-px h-full bg-gradient-to-b from-transparent via-blue-400/50 to-transparent animate-matrix-rain"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                    <div
                      className="absolute top-0 right-3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/40 to-transparent animate-matrix-rain"
                      style={{ animationDelay: "500ms" }}
                    ></div>
                  </div>

                  {/* Holographic scan lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent animate-scan-line"></div>
                    <div
                      className="absolute top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent animate-scan-line"
                      style={{ animationDelay: "200ms" }}
                    ></div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent animate-scan-line"
                      style={{ animationDelay: "400ms" }}
                    ></div>
                  </div>

                  {/* Energy orb in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-energy-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  </div>

                  {/* Advanced particle system */}
                  <div className="absolute inset-0">
                    {/* Corner particles */}
                    <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-300 rounded-full animate-particle-float"></div>
                    <div
                      className="absolute top-0 right-0 w-1 h-1 bg-blue-300 rounded-full animate-particle-float"
                      style={{ animationDelay: "100ms" }}
                    ></div>
                    <div
                      className="absolute bottom-0 left-0 w-1 h-1 bg-purple-300 rounded-full animate-particle-float"
                      style={{ animationDelay: "200ms" }}
                    ></div>
                    <div
                      className="absolute bottom-0 right-0 w-1 h-1 bg-pink-300 rounded-full animate-particle-float"
                      style={{ animationDelay: "300ms" }}
                    ></div>

                    {/* Orbiting particles */}
                    <div className="absolute inset-0">
                      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-orbit-1"></div>
                      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-300 rounded-full animate-orbit-2"></div>
                      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-300 rounded-full animate-orbit-3"></div>
                    </div>
                  </div>

                  {/* Shockwave effect */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-shockwave"></div>
                  </div>

                  {/* Glitch effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 animate-glitch"></div>
                </div>
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
