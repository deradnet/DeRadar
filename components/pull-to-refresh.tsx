"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { PixelWave } from "./pixel-wave"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  enabled?: boolean
}

export function PullToRefresh({ onRefresh, children, enabled = true }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const startYRef = useRef(0)
  const scrollTopRef = useRef(0)

  const PULL_THRESHOLD = 80 // Distance needed to trigger refresh
  const MAX_PULL = 120 // Maximum pull distance

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      scrollTopRef.current = window.pageYOffset || document.documentElement.scrollTop

      // Only allow pull-to-refresh at the top of the page
      if (scrollTopRef.current === 0) {
        startYRef.current = e.touches[0].clientY
        console.log('🔵 Touch start at top, Y:', startYRef.current)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || startYRef.current === 0) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startYRef.current

      // Only pull down from the top
      if (diff > 0 && scrollTopRef.current === 0) {
        console.log('🟢 Pulling down, diff:', diff)
        // Prevent default scroll behavior
        e.preventDefault()

        // Apply resistance to the pull
        const resistance = 0.5
        const distance = Math.min(diff * resistance, MAX_PULL)

        setPullDistance(distance)
        setIsPulling(distance > 10)
      }
    }

    const handleTouchEnd = async () => {
      console.log('🔴 Touch end, distance:', pullDistance)
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        console.log('✅ Triggering refresh!')
        setIsRefreshing(true)
        setPullDistance(PULL_THRESHOLD)

        const startTime = Date.now()
        const minDuration = 2000 // Minimum 2 seconds for animation

        try {
          await onRefresh()
        } finally {
          // Calculate how long the refresh took
          const elapsed = Date.now() - startTime
          const remainingTime = Math.max(0, minDuration - elapsed)

          console.log(`Refresh took ${elapsed}ms, waiting ${remainingTime}ms more for animation`)

          // Wait for remaining time to ensure minimum 2 second animation
          setTimeout(() => {
            setIsRefreshing(false)
            setIsFadingOut(true)
            // Wait for fade-out animation before hiding
            setTimeout(() => {
              setPullDistance(0)
              setIsPulling(false)
              setIsFadingOut(false)
            }, 500)
          }, remainingTime)
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }

      startYRef.current = 0
      scrollTopRef.current = 0
    }

    // Attach to document instead of container for better mobile support
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [enabled, isRefreshing, pullDistance, onRefresh])

  const rotation = isRefreshing ? 360 : (pullDistance / PULL_THRESHOLD) * 360
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const scale = Math.min(pullDistance / PULL_THRESHOLD, 1)

  return (
    <>
      {/* Pixel Wave Band at Top */}
      {enabled && (isPulling || isRefreshing || isFadingOut) && (
        <div
          className={`fixed top-0 left-0 right-0 z-[60] overflow-hidden pointer-events-none transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : ''}`}
          style={{
            height: `${Math.min(pullDistance, 60)}px`,
            opacity: isFadingOut ? 0 : Math.min(pullDistance / 40, 1),
            transition: isFadingOut ? 'opacity 0.5s ease-out' : (isRefreshing ? 'none' : 'height 0.1s ease-out, opacity 0.1s ease-out'),
          }}
        >
          <PixelWave
            progress={pullDistance / PULL_THRESHOLD}
            isActive={isPulling || isRefreshing}
          />
        </div>
      )}

      {/* Pull indicator - Circular icon below the band */}
      {enabled && (isPulling || isRefreshing || isFadingOut) && (
        <div
          className={`fixed left-0 right-0 flex justify-center items-center z-[61] pointer-events-none transition-all duration-500 ${isFadingOut ? 'opacity-0' : ''}`}
          style={{
            top: `${Math.min(pullDistance, 60)}px`,
            transform: `translateY(${Math.min(pullDistance * 0.2, 20)}px)`,
          }}
        >
          <div className="relative">
            {/* Circular container */}
            <div
              className="relative w-12 h-12 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-[40px] rounded-full shadow-2xl border border-white/10 flex items-center justify-center"
              style={{
                opacity,
                transform: `scale(${scale})`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/50 via-blue-400/40 to-blue-600/50 blur-xl"
                style={{
                  transform: `scale(${1 + scale * 0.2})`,
                  opacity: 0.7,
                }}
              />

              {/* Icon */}
              <RefreshCw
                className={`w-5 h-5 text-blue-400 relative z-10 ${isRefreshing ? "animate-spin" : ""}`}
                style={{
                  transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
                  transition: isRefreshing ? undefined : "transform 0.1s ease-out",
                  animationDuration: isRefreshing ? '1s' : undefined,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </>
  )
}
