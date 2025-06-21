"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Radar, Wallet } from "lucide-react"

interface MobileNavProps {
  lastUpdate: Date
  totalAircraft: number
  onSettingsClick: () => void
  onArweaveClick?: () => void
  walletConnected?: boolean
  walletAddress?: string | null
  isPlaybackMode?: boolean
}

export function MobileNav({
  lastUpdate,
  totalAircraft,
  onSettingsClick,
  onArweaveClick,
  walletConnected = false,
  walletAddress = null,
  isPlaybackMode = false,
}: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDifference = Math.abs(currentScrollY - lastScrollY)

      // Only hide/show if scroll difference is significant (avoid jitter)
      if (scrollDifference > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down and past 100px
          setIsVisible(false)
        } else {
          // Scrolling up or at top
          setIsVisible(true)
        }
        setLastScrollY(currentScrollY)
      }
    }

    // Throttle scroll events
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", throttledHandleScroll, { passive: true })
    return () => window.removeEventListener("scroll", throttledHandleScroll)
  }, [lastScrollY])

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shadow-lg ${
                isPlaybackMode
                  ? "bg-gradient-to-r from-purple-600 to-purple-700"
                  : "bg-gradient-to-r from-blue-600 to-blue-700"
              }`}
            >
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">DeRadar</h1>
                <span className="relative -top-1 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-sm backdrop-blur-sm">
                  BETA
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isPlaybackMode ? "bg-purple-500" : "bg-green-500"
                  }`}
                ></div>
                <span>{isPlaybackMode ? "Historical aircraft monitoring" : "Real-time aircraft monitoring"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 text-xs">
              {totalAircraft}
            </Badge>

            {/* Arweave Snapshot Button */}
            {onArweaveClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onArweaveClick}
                className={`border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm h-8 w-8 p-0 ${
                  walletConnected ? "border-green-500/50 bg-green-900/20" : ""
                }`}
                title={walletConnected ? `Connected: ${walletAddress?.slice(0, 6)}...` : "Connect Wallet"}
              >
                <Wallet className={`w-3.5 h-3.5 ${walletConnected ? "text-green-400" : ""}`} />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onSettingsClick}
              className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm h-8 w-8 p-0"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
