"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

interface MobileNavProps {
  lastUpdate: Date
  totalAircraft: number
  isNativeApp?: boolean
}

export function MobileNav({
  lastUpdate,
  totalAircraft,
  isNativeApp = false,
}: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    // In native app, nav is always visible (sticky)
    if (isNativeApp) {
      setIsVisible(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDifference = Math.abs(currentScrollY - lastScrollY)

      if (scrollDifference > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
        setLastScrollY(currentScrollY)
      }
    }

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
  }, [lastScrollY, isNativeApp])

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/50 backdrop-blur-[40px] border-b border-white/5 shadow-2xl shadow-black/20 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="px-4 py-3 pt-safe">
        <div className={`flex items-center ${isNativeApp ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <h1 className={`font-bold tracking-[0.15em] uppercase text-white ${isNativeApp ? "text-[16px]" : "text-xl"}`}>
              DeRadar
            </h1>
            {!isNativeApp && (
              <span className="relative -top-0.5 px-1.5 py-0.5 text-[9px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-sm backdrop-blur-sm">
                BETA
              </span>
            )}
          </div>

          {!isNativeApp && (
            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 text-xs">
              {totalAircraft}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
