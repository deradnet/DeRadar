"use client"

import { Plane, TrendingUp, Search, Filter, Radar, MapIcon, Grid3x3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { haptic } from "@/lib/haptics"
import { PixelWave } from "./pixel-wave"
import { useState, useRef, useEffect } from "react"
import { Keyboard } from "@capacitor/keyboard"

export type MobileTab = "home" | "stats" | "flights" | "miniapps" | "charts" | "map"

interface MobileBottomNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  isNativeApp?: boolean
  searchTerm?: string
  onSearchChange?: (term: string) => void
  onFilterClick?: () => void
  hasActiveFilters?: boolean
  onHomeRefresh?: () => Promise<void>
  miniAppIcon?: string | null
  onMapLayoutSwitch?: () => void
}

export function MobileBottomNav({ activeTab, onTabChange, isNativeApp = false, searchTerm = "", onSearchChange, onFilterClick, hasActiveFilters = false, onHomeRefresh, miniAppIcon, onMapLayoutSwitch }: MobileBottomNavProps) {
  const [isHomeRefreshing, setIsHomeRefreshing] = useState(false)
  const [showPixelWave, setShowPixelWave] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isMapHolding, setIsMapHolding] = useState(false)
  const [isMapSwitching, setIsMapSwitching] = useState(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mapHoldTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isHoldingRef = useRef(false)
  const isMapHoldingRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Only show in native app
  if (!isNativeApp) {
    return null
  }

  // Keyboard management
  useEffect(() => {
    if (!isNativeApp) return

    let keyboardWillShowListener: any = null
    let keyboardWillHideListener: any = null

    Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info.keyboardHeight)

      // Scroll search input into view when keyboard appears
      setTimeout(() => {
        if (searchInputRef.current && activeTab === 'flights') {
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }).then(handle => {
      keyboardWillShowListener = handle
    })

    Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0)
    }).then(handle => {
      keyboardWillHideListener = handle
    })

    // Set keyboard behavior
    Keyboard.setAccessoryBarVisible({ isVisible: true })
    Keyboard.setScroll({ isDisabled: false })

    return () => {
      if (keyboardWillShowListener) {
        keyboardWillShowListener.remove()
      }
      if (keyboardWillHideListener) {
        keyboardWillHideListener.remove()
      }
    }
  }, [isNativeApp, activeTab])

  const tabs = [
    { id: "flights" as MobileTab, icon: Plane, label: "Flights" },
    { id: "miniapps" as MobileTab, icon: Grid3x3, label: "Mini Apps" },
    { id: "home" as MobileTab, icon: Radar, label: "Home" },
    { id: "map" as MobileTab, icon: MapIcon, label: "Map" },
    { id: "charts" as MobileTab, icon: TrendingUp, label: "Charts" },
  ]

  const handleTabClick = (tab: MobileTab) => {
    if (tab !== activeTab) {
      // Haptic feedback on tab switch (non-blocking)
      haptic.light()
      onTabChange(tab)
    }
  }

  const handleFilterClick = () => {
    haptic.medium()
    onFilterClick?.()
  }

  const handleHomePress = () => {
    isHoldingRef.current = true
    holdTimerRef.current = setTimeout(async () => {
      if (isHoldingRef.current && onHomeRefresh) {
        // Trigger haptic feedback for long-press action
        await haptic.heavy()

        setShowPixelWave(true)
        setIsHomeRefreshing(true)

        const startTime = Date.now()
        const minDuration = 2000

        try {
          await onHomeRefresh()
        } finally {
          const elapsed = Date.now() - startTime
          const remainingTime = Math.max(0, minDuration - elapsed)

          setTimeout(() => {
            setIsHomeRefreshing(false)
            setIsFadingOut(true)
            // Wait for fade-out animation before hiding
            setTimeout(() => {
              setShowPixelWave(false)
              setIsFadingOut(false)
            }, 500)
          }, remainingTime)
        }
      }
    }, 500) // 500ms hold to trigger
  }

  const handleHomeRelease = () => {
    isHoldingRef.current = false
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const handleMapPress = () => {
    // Only allow map layout switching when already on map tab
    if (activeTab !== "map") return

    setIsMapHolding(true)
    isMapHoldingRef.current = true
    mapHoldTimerRef.current = setTimeout(async () => {
      if (isMapHoldingRef.current && onMapLayoutSwitch) {
        // Trigger haptic feedback for long-press action
        await haptic.medium()

        // Show switching animation
        setIsMapSwitching(true)
        onMapLayoutSwitch()

        // Reset animations after switch
        setTimeout(() => {
          setIsMapHolding(false)
          setIsMapSwitching(false)
        }, 400)
      }
    }, 500) // 500ms hold to trigger
  }

  const handleMapRelease = () => {
    isMapHoldingRef.current = false
    setIsMapHolding(false)
    if (mapHoldTimerRef.current) {
      clearTimeout(mapHoldTimerRef.current)
      mapHoldTimerRef.current = null
    }
  }

  const navBarHeight = activeTab === "flights" && onSearchChange ? 120 : 64

  return (
    <>
      {/* Pixel Wave Animation - Fills entire nav bar from bottom */}
      {showPixelWave && (
        <div
          className={`fixed left-0 right-0 z-[60] overflow-hidden pointer-events-none rotate-180 transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
          style={{
            bottom: '0',
            height: `${navBarHeight}px`
          }}
        >
          <div style={{ height: `${navBarHeight}px` }}>
            <PixelWave progress={1} isActive={isHomeRefreshing} height={navBarHeight} />
          </div>
        </div>
      )}

      <div
        className="fixed left-0 right-0 z-50 bg-gradient-to-t from-slate-900/70 via-slate-900/60 to-slate-900/50 backdrop-blur-[40px] border-t border-white/5 shadow-2xl shadow-black/20 transition-all duration-300"
        style={{
          bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0'
        }}
      >
        {/* Search Bar - Only show on flights tab */}
        {activeTab === "flights" && onSearchChange && (
          <div className="px-4 py-3 border-b border-white/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search flights..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    // Scroll into view when focused
                    setTimeout(() => {
                      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }, 300)
                  }}
                  className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 backdrop-blur-xl shadow-inner focus:bg-white/10 focus:border-blue-400/30 transition-all"
                />
              </div>
              {onFilterClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 backdrop-blur-xl relative h-10 px-3 shadow-lg transition-all touch-manipulation"
                  onClick={handleFilterClick}
                >
                  <Filter className="w-4 h-4" />
                  {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse"></div>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-5 pb-safe">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            const isRadar = tab.id === "home"
            const isMap = tab.id === "map"
            const isMiniApps = tab.id === "miniapps"
            const showCustomIcon = isMiniApps && miniAppIcon

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                onTouchStart={isRadar ? handleHomePress : isMap ? handleMapPress : undefined}
                onTouchEnd={isRadar ? handleHomeRelease : isMap ? handleMapRelease : undefined}
                onTouchCancel={isRadar ? handleHomeRelease : isMap ? handleMapRelease : undefined}
                onMouseDown={isRadar ? handleHomePress : isMap ? handleMapPress : undefined}
                onMouseUp={isRadar ? handleHomeRelease : isMap ? handleMapRelease : undefined}
                onMouseLeave={isRadar ? handleHomeRelease : isMap ? handleMapRelease : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 h-16 transition-all duration-150 touch-manipulation ${
                  isActive ? "text-blue-400" : "text-slate-400 active:text-slate-300"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  willChange: isActive ? "auto" : "transform",
                }}
              >
                {showCustomIcon ? (
                  <img
                    src={miniAppIcon}
                    alt="Mini app icon"
                    className={`w-6 h-6 rounded-lg transition-all duration-150 ${isActive ? "scale-110" : "scale-100"}`}
                    style={{ willChange: "transform" }}
                  />
                ) : (
                  <div className="relative">
                    <Icon className={`w-6 h-6 transition-all duration-150 ${isActive && !isRadar ? "fill-blue-400 scale-110" : isActive ? "scale-110" : "scale-100"} ${isHomeRefreshing && isRadar ? "animate-spin" : ""} ${isMap && isMapHolding ? "scale-90 opacity-60" : ""} ${isMap && isMapSwitching ? "rotate-180" : ""}`}
                      style={{ willChange: "transform" }} />
                    {/* Hold progress ring for map icon */}
                    {isMap && isMapHolding && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="63"
                          strokeDashoffset="0"
                          className="text-blue-400 opacity-30 animate-[dash_0.5s_linear]"
                          style={{
                            animation: 'dash 0.5s linear forwards',
                          }}
                        />
                      </svg>
                    )}
                  </div>
                )}
                <span className={`text-[10px] font-medium transition-opacity duration-150 ${isActive ? "opacity-100" : "opacity-80"}`}>
                  {tab.label}
                </span>
                {/* Simple bottom indicator line with slide animation */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-in slide-in-from-bottom-1 duration-200"
                    style={{ willChange: "transform" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
