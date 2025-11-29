"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { haptic } from "@/lib/haptics"

interface MapEducatorTooltipProps {
  onDismiss: () => void
}

export function MapEducatorTooltip({ onDismiss }: MapEducatorTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    haptic.light()
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for fade out animation
  }

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-[60] transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="relative bg-gradient-to-br from-blue-500/95 to-blue-600/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-blue-500/30 border border-blue-400/30">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-7 h-7 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-lg transition-all"
        >
          <X className="w-4 h-4 text-white" strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 pr-4">
            <h3 className="text-white font-semibold text-[15px] mb-1">Pro Tip!</h3>
            <p className="text-white/90 text-[13px] leading-relaxed">
              Press and hold the <span className="font-semibold">Map icon</span> to switch between different map styles (Street, Dark, Satellite, etc.)
            </p>
          </div>
        </div>

        {/* Pointer arrow pointing to map icon */}
        <div className="absolute -bottom-3 right-16 w-6 h-6 bg-gradient-to-br from-blue-500/95 to-blue-600/95 rotate-45 border-r border-b border-blue-400/30" />
      </div>
    </div>
  )
}
