"use client"

import { useEffect, useState, useRef } from "react"
import { X, Sparkles, MapIcon } from "lucide-react"
import { haptic } from "@/lib/haptics"

interface MapEducatorTooltipProps {
  onDismiss: () => void
  tileStyle?: string
}

export function MapEducatorTooltip({ onDismiss, tileStyle }: MapEducatorTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [pointerPosition, setPointerPosition] = useState<number | null>(null)
  const initialTileStyleRef = useRef(tileStyle)

  useEffect(() => {
    // Fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Find and track the Map icon position
  useEffect(() => {
    const findMapIcon = () => {
      // Find all tab buttons in the bottom nav
      const navButtons = Array.from(document.querySelectorAll('button[class*="touch-manipulation"]'))

      // Find the Map button (should have "Map" text)
      for (const button of navButtons) {
        const textElement = button.querySelector('span')
        if (textElement?.textContent?.trim() === 'Map') {
          const rect = button.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          setPointerPosition(centerX)
          break
        }
      }
    }

    // Initial find
    findMapIcon()

    // Update on resize
    window.addEventListener('resize', findMapIcon)

    return () => window.removeEventListener('resize', findMapIcon)
  }, [])

  // Auto-dismiss when user changes map style
  useEffect(() => {
    if (tileStyle && tileStyle !== initialTileStyleRef.current) {
      // User used the feature! Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [tileStyle])

  const handleDismiss = () => {
    haptic.light()
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for fade out animation
  }

  return (
    <>
      {/* Apple-style card - positioned above nav */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-[60] px-4 transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative mx-auto max-w-sm">
          {/* Main card with Apple design */}
          <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Content container */}
            <div className="relative px-5 py-4">
              {/* Header with icon and close button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-white font-semibold text-base">Pro Tip</h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 bg-slate-800/60 hover:bg-slate-700/60 active:bg-slate-600/60 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/90" strokeWidth={2} />
                </button>
              </div>

              {/* Message */}
              <p className="text-slate-300 text-[15px] leading-relaxed">
                Press and hold the <MapIcon className="inline w-4 h-4 mb-0.5 text-blue-400" /> <span className="font-medium text-white">Map</span> icon below to switch between map styles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pointer arrow - positioned directly above map icon */}
      {pointerPosition !== null && (
        <div
          className={`fixed bottom-16 z-[60] transition-all duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: `${pointerPosition}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-5 h-5 bg-slate-900/95 backdrop-blur-xl rotate-45 border-r border-b border-white/20 shadow-lg" />
        </div>
      )}
    </>
  )
}
